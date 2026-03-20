import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import webpush from 'https://esm.sh/web-push@3.6.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationPayload {
  user_id: string;
  title: string;
  body: string;
  action_url?: string;
  type?: 'booking' | 'message' | 'payment' | 'system';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Configure web-push with VAPID keys
    webpush.setVapidDetails(
      'mailto:support@ogajobs.com',
      Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
      Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, title, body, action_url, type = 'system' }: PushNotificationPayload = await req.json()

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user_id)
      .eq('enabled', true)

    if (subError) {
      throw new Error(`Failed to get subscriptions: ${subError.message}`)
    }

    // Store notification in database
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id,
        title,
        message: body,
        type,
        action_url,
        read: false,
        created_at: new Date().toISOString()
      })

    if (notificationError) {
      console.error('Failed to store notification:', notificationError)
    }

    // Send push notifications to all user's devices
    const pushPromises = subscriptions.map(async (sub) => {
      try {
        const subscription = JSON.parse(sub.subscription)
        
        const pushPayload = JSON.stringify({
          title,
          body,
          icon: '/icon-192.png',
          badge: '/icon-96.png',
          data: {
            url: action_url || '/',
            type
          }
        })

        // Send actual push notification using web-push
        const result = await webpush.sendNotification(subscription, pushPayload)
        
        console.log('Push notification sent successfully:', {
          endpoint: subscription.endpoint,
          statusCode: result.statusCode
        })

        return { success: true }
      } catch (error) {
        console.error('Error sending push notification:', error)
        return { success: false, error: error.message }
      }
    })

    const results = await Promise.all(pushPromises)
    const successCount = results.filter(r => r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent successfully`,
        sent_count: successCount,
        total_subscriptions: subscriptions.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})