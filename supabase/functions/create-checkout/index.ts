import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { priceId, successUrl, cancelUrl } = await req.json()

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

    // Get user profile and organization
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('*, organizations(*)')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return new Response('Profile not found', { status: 404, headers: corsHeaders })
    }

    // Check if customer already exists
    let customerId: string
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('org_id', profile.org_id)
      .single()

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile.display_name,
        metadata: {
          supabase_user_id: user.id,
          org_id: profile.org_id,
        },
      })
      customerId = customer.id

      // Create subscription record
      await supabaseClient
        .from('subscriptions')
        .insert({
          org_id: profile.org_id,
          stripe_customer_id: customerId,
          tier: 'free',
          status: 'incomplete',
        })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/dashboard?success=true`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/settings?canceled=true`,
      metadata: {
        user_id: user.id,
        org_id: profile.org_id,
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
)