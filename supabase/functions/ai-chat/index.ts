import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  agentId: string
  messages: Array<{ role: string; content: string }>
  knowledgeBaseId?: string
  stream?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { agentId, messages, knowledgeBaseId, stream = false }: ChatRequest = await req.json()

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Get agent configuration
    const { data: agent, error: agentError } = await supabaseClient
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return new Response('Agent not found', { status: 404, headers: corsHeaders })
    }

    // Check user tier for usage limits
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('tier')
      .eq('user_id', user.id)
      .single()

    if (profile?.tier === 'free') {
      // Check daily usage limits for free tier
      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabaseClient
        .from('agent_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today)

      if (count && count >= 10) {
        return new Response(
          JSON.stringify({ error: 'Daily limit reached. Upgrade to Pro for unlimited usage.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get relevant knowledge if knowledgeBaseId is provided
    let contextualKnowledge = ''
    if (knowledgeBaseId) {
      const userQuery = messages[messages.length - 1]?.content || ''
      
      // Simple keyword matching for now - in production, use vector similarity
      const { data: knowledgeItems } = await supabaseClient
        .from('knowledge_items')
        .select('name, metadata')
        .eq('kb_id', knowledgeBaseId)
        .limit(5)

      if (knowledgeItems && knowledgeItems.length > 0) {
        contextualKnowledge = `\n\nRelevant Knowledge:\n${knowledgeItems
          .map(item => `- ${item.name}: ${item.metadata?.summary || 'No summary available'}`)
          .join('\n')}`
      }
    }

    // Prepare system message with agent persona and knowledge
    const systemMessage = {
      role: 'system',
      content: `You are ${agent.name}, a ${agent.role} AI agent powered by Cognis Digital. 
      
Description: ${agent.description}
Capabilities: ${agent.capabilities?.join(', ') || 'General assistance'}

You are professional, knowledgeable, and focused on helping with business tasks. Always maintain the Cognis Digital branding in your responses.${contextualKnowledge}`
    }

    // Prepare messages for OpenAI
    const openaiMessages = [systemMessage, ...messages]

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agent.model_config?.model || 'gpt-4',
        messages: openaiMessages,
        temperature: agent.model_config?.temperature || 0.7,
        max_tokens: agent.model_config?.max_tokens || 1000,
        stream: stream,
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI API error:', error)
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const completion = await openaiResponse.json()
    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'

    // Log the interaction
    const startTime = Date.now()
    await supabaseClient
      .from('agent_interactions')
      .insert({
        agent_id: agentId,
        user_id: user.id,
        prompt: messages[messages.length - 1]?.content || '',
        response: assistantMessage,
        tokens_used: completion.usage?.total_tokens || 0,
        duration_ms: Date.now() - startTime,
      })

    // Update agent stats
    await supabaseClient
      .from('ai_agents')
      .update({
        tasks_completed: agent.tasks_completed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId)

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        usage: completion.usage,
        agent: agent.name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in ai-chat function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
)