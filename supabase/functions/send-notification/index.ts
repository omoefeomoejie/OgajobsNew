import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId?: string;
  userEmail?: string;
  type: 'email' | 'push' | 'sms' | 'in_app';
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, userEmail, type, template, data, priority = 'normal' }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification using template: ${template}`);

    let targetUserId = userId;
    let targetEmail = userEmail;

    // If userId provided but no email, fetch email
    if (userId && !userEmail) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
      } else {
        targetEmail = profile?.email;
      }
    }

    // If email provided but no userId, fetch userId
    if (userEmail && !userId) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
      } else {
        targetUserId = profile?.id;
      }
    }

    // Process different notification types
    switch (type) {
      case 'email':
        await sendEmailNotification(template, data, targetEmail!);
        break;
      
      case 'push':
        await sendPushNotification(template, data, targetUserId!, supabase);
        break;
      
      case 'sms':
        await sendSMSNotification(template, data);
        break;
      
      case 'in_app':
        await createInAppNotification(template, data, targetUserId!, supabase);
        break;
      
      default:
        throw new Error(`Unsupported notification type: ${type}`);
    }

    // Log notification
    if (targetUserId) {
      await supabase
        .from('notification_logs')
        .insert({
          user_id: targetUserId,
          type: type,
          template: template,
          status: 'sent',
          data: data,
          priority: priority,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${type} notification sent successfully`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
};

async function sendEmailNotification(template: string, data: Record<string, any>, email: string) {
  console.log(`Sending email to ${email} using template: ${template}`);
  
  // Email templates
  const templates = {
    booking_assigned: {
      subject: 'New Booking Assignment',
      body: `Hello ${data.artisanName},\n\nYou have been assigned a new booking: ${data.bookingTitle}\n\nLocation: ${data.location}\nBudget: ₦${data.budget}\n\nPlease respond within 24 hours.\n\nBest regards,\nOgaJobs Team`
    },
    booking_confirmed: {
      subject: 'Booking Confirmed',
      body: `Hello ${data.clientName},\n\nYour booking has been confirmed with ${data.artisanName}.\n\nService: ${data.serviceType}\nDate: ${data.preferredDate}\n\nThe artisan will contact you soon.\n\nBest regards,\nOgaJobs Team`
    },
    withdrawal_approved: {
      subject: 'Withdrawal Approved',
      body: `Hello ${data.artisanName},\n\nYour withdrawal request of ₦${data.amount} has been approved and processed.\n\nBank: ${data.bankName}\nAccount: ${data.accountNumber}\nReference: ${data.reference}\n\nFunds should reflect in your account within 24 hours.\n\nBest regards,\nOgaJobs Team`
    },
    support_ticket_response: {
      subject: 'Support Ticket Update',
      body: `Hello ${data.customerName},\n\nThere's an update on your support ticket #${data.ticketNumber}:\n\n${data.message}\n\nYou can reply to continue the conversation.\n\nBest regards,\nOgaJobs Support Team`
    }
  };

  const emailTemplate = templates[template as keyof typeof templates];
  if (!emailTemplate) {
    throw new Error(`Email template not found: ${template}`);
  }

  // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
  // For now, we'll log the email content
  console.log('Email would be sent:', {
    to: email,
    subject: emailTemplate.subject,
    body: emailTemplate.body
  });
}

async function sendPushNotification(template: string, data: Record<string, any>, userId: string, supabase: any) {
  console.log(`Sending push notification to user ${userId} using template: ${template}`);
  
  // Push notification templates
  const templates = {
    booking_assigned: {
      title: 'New Booking Assignment',
      body: `You have a new booking: ${data.bookingTitle}`,
      icon: '/icons/booking.png',
      data: { type: 'booking', bookingId: data.bookingId }
    },
    message_received: {
      title: 'New Message',
      body: `New message from ${data.senderName}`,
      icon: '/icons/message.png',
      data: { type: 'message', conversationId: data.conversationId }
    },
    payment_received: {
      title: 'Payment Received',
      body: `You received ₦${data.amount} for ${data.serviceName}`,
      icon: '/icons/payment.png',
      data: { type: 'payment', amount: data.amount }
    }
  };

  const pushTemplate = templates[template as keyof typeof templates];
  if (!pushTemplate) {
    throw new Error(`Push template not found: ${template}`);
  }

  // Get user's push subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true);

  if (error) {
    console.error('Error fetching push subscriptions:', error);
    return;
  }

  // Send push notifications to all user's devices
  for (const subscription of subscriptions || []) {
    try {
      // Here you would integrate with web push service
      console.log('Push notification would be sent:', {
        subscription: subscription.subscription_data,
        payload: pushTemplate
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}

async function sendSMSNotification(template: string, data: Record<string, any>) {
  console.log(`Sending SMS using template: ${template}`);
  
  // SMS templates (shorter versions)
  const templates = {
    booking_confirmed: `OgaJobs: Your booking with ${data.artisanName} is confirmed. Service: ${data.serviceType}. They will contact you soon.`,
    otp_verification: `OgaJobs: Your verification code is ${data.otp}. Valid for 10 minutes.`,
    payment_reminder: `OgaJobs: Payment reminder for booking #${data.bookingId}. Amount: ₦${data.amount}. Pay now to confirm.`
  };

  const smsTemplate = templates[template as keyof typeof templates];
  if (!smsTemplate) {
    throw new Error(`SMS template not found: ${template}`);
  }

  // Here you would integrate with SMS service (Twilio, etc.)
  console.log('SMS would be sent:', {
    to: data.phoneNumber,
    message: smsTemplate
  });
}

async function createInAppNotification(template: string, data: Record<string, any>, userId: string, supabase: any) {
  console.log(`Creating in-app notification for user ${userId} using template: ${template}`);
  
  // In-app notification templates
  const templates = {
    booking_update: {
      title: 'Booking Update',
      message: `Your booking status has been updated to: ${data.status}`,
      type: 'booking',
      action_url: `/bookings/${data.bookingId}`
    },
    profile_verification: {
      title: 'Profile Verification',
      message: data.approved ? 'Your profile has been verified!' : 'Profile verification requires attention',
      type: 'verification',
      action_url: '/verification'
    },
    new_review: {
      title: 'New Review',
      message: `You received a ${data.rating}-star review from ${data.clientName}`,
      type: 'review',
      action_url: `/reviews`
    }
  };

  const notificationTemplate = templates[template as keyof typeof templates];
  if (!notificationTemplate) {
    throw new Error(`In-app template not found: ${template}`);
  }

  // Create in-app notification record
  const { error } = await supabase
    .from('in_app_notifications')
    .insert({
      user_id: userId,
      title: notificationTemplate.title,
      message: notificationTemplate.message,
      type: notificationTemplate.type,
      action_url: notificationTemplate.action_url,
      data: data,
      read: false,
    });

  if (error) {
    throw error;
  }
}

serve(handler);