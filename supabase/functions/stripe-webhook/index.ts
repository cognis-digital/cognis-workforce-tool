import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )

    console.log('Received Stripe event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          
          // Get user by customer ID
          const { data: existingSubscription } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('stripe_customer_id', session.customer as string)
            .single()

          if (existingSubscription) {
            // Update existing subscription
            await supabaseAdmin
              .from('subscriptions')
              .update({
                stripe_subscription_id: subscription.id,
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                tier: getTierFromPriceId(subscription.items.data[0].price.id),
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_customer_id', session.customer as string)

            // Update user profile tier
            await supabaseAdmin
              .from('user_profiles')
              .update({
                tier: getTierFromPriceId(subscription.items.data[0].price.id),
                updated_at: new Date().toISOString(),
              })
              .eq('org_id', existingSubscription.org_id)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            tier: getTierFromPriceId(subscription.items.data[0].price.id),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        // Update user profile tier
        const { data: subscriptionData } = await supabaseAdmin
          .from('subscriptions')
          .select('org_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (subscriptionData) {
          await supabaseAdmin
            .from('user_profiles')
            .update({
              tier: getTierFromPriceId(subscription.items.data[0].price.id),
              updated_at: new Date().toISOString(),
            })
            .eq('org_id', subscriptionData.org_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        // Downgrade user to free tier
        const { data: subscriptionData } = await supabaseAdmin
          .from('subscriptions')
          .select('org_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (subscriptionData) {
          await supabaseAdmin
            .from('user_profiles')
            .update({
              tier: 'free',
              updated_at: new Date().toISOString(),
            })
            .eq('org_id', subscriptionData.org_id)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Stripe webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
)

function getTierFromPriceId(priceId: string): string {
  // Map your Stripe price IDs to tiers
  const priceToTierMap: Record<string, string> = {
    'price_pro_monthly': 'pro',
    'price_pro_yearly': 'pro',
    'price_enterprise_monthly': 'enterprise',
    'price_enterprise_yearly': 'enterprise',
  }
  
  return priceToTierMap[priceId] || 'free'
}