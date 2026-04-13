import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'

// Import email templates
import { WelcomeClientEmail } from './_templates/welcome-client.tsx'
import { WelcomeArtisanEmail } from './_templates/welcome-artisan.tsx'
import { WelcomePOSAgentEmail } from './_templates/welcome-pos-agent.tsx'
import { PasswordResetEmail } from './_templates/password-reset.tsx'
import { EmailVerificationEmail } from './_templates/email-verification.tsx'
import { EmailConfirmationEmail } from './_templates/email-confirmation.tsx'
import { MagicLinkEmail } from './_templates/magic-link.tsx'
import { ReauthenticationEmail } from './_templates/reauthentication.tsx'
import { EmailChangeEmail } from './_templates/email-change.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

    let result;

    // Process different notification types
    switch (type) {
      case 'email':
        result = await sendEmailNotification(template, data, targetEmail!);
        break;
      
      case 'push':
        result = await sendPushNotification(template, data, targetUserId!, supabase);
        break;
      
      case 'sms':
        result = await sendSMSNotification(template, data);
        break;
      
      case 'in_app':
        result = await createInAppNotification(template, data, targetUserId!, supabase);
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
          status: result?.success ? 'sent' : 'failed',
          data: data,
          priority: priority,
          error_message: result?.error || null
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${type} notification sent successfully`,
        result: result
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

// Email notification function with Resend integration
async function sendEmailNotification(template: string, data: Record<string, any>, email: string) {
  console.log(`Sending email to ${email} using template: ${template}`);
  
  try {
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'https://ogajobs.com';
    let emailHtml = '';
    let subject = '';

    // Generate HTML content based on template
    switch (template) {
      case 'welcome_client':
        subject = 'Welcome to OgaJobs - Your trusted marketplace for skilled artisans';
        emailHtml = await renderAsync(
          React.createElement(WelcomeClientEmail, {
            fullName: data.full_name || data.fullName || 'Valued Client',
            appUrl: appUrl
          })
        );
        break;
        
      case 'welcome_artisan':
        subject = 'Welcome to OgaJobs - Start earning with your skills today!';
        emailHtml = await renderAsync(
          React.createElement(WelcomeArtisanEmail, {
            fullName: data.full_name || data.fullName || 'Skilled Artisan',
            appUrl: appUrl
          })
        );
        break;
        
      case 'welcome_pos_agent':
        subject = 'Welcome to OgaJobs POS Partnership - Start earning commissions today!';
        emailHtml = await renderAsync(
          React.createElement(WelcomePOSAgentEmail, {
            fullName: data.full_name || data.fullName || 'POS Agent',
            agentCode: data.agent_code || data.agentCode || 'AGENT001',
            appUrl: appUrl
          })
        );
        break;
        
      case 'password_reset':
        subject = 'Reset your OgaJobs password';
        emailHtml = await renderAsync(
          React.createElement(PasswordResetEmail, {
            resetUrl: data.reset_url || data.resetUrl || '#',
            userEmail: email,
            appUrl: appUrl,
            expiresIn: data.expires_in || data.expiresIn || '1 hour'
          })
        );
        break;
        
      case 'email_verification':
        subject = 'Verify your OgaJobs email address';
        emailHtml = await renderAsync(
          React.createElement(EmailVerificationEmail, {
            confirmUrl: data.confirm_url || data.confirmUrl || '#',
            userEmail: email,
            appUrl: appUrl
          })
        );
        break;
        
      case 'email_confirmation':
        subject = 'Welcome to OgaJobs - Confirm your email address';
        emailHtml = await renderAsync(
          React.createElement(EmailConfirmationEmail, {
            confirmUrl: data.confirm_url || data.confirmUrl || '#',
            userEmail: email,
            appUrl: appUrl,
            fullName: data.full_name || data.fullName || 'Valued User'
          })
        );
        break;

      case 'auth_signup_confirmation':
        subject = 'Confirm Your Signup - OgaJobs';
        emailHtml = await renderAsync(
          React.createElement(EmailConfirmationEmail, {
            confirmUrl: data.confirm_url || data.confirmUrl || '#',
            userEmail: email,
            appUrl: appUrl,
            fullName: data.full_name || data.fullName || 'Valued User'
          })
        );
        break;

      case 'auth_password_reset':
        subject = 'Reset your OgaJobs password';
        emailHtml = await renderAsync(
          React.createElement(PasswordResetEmail, {
            resetUrl: data.reset_url || data.resetUrl || '#',
            userEmail: email,
            appUrl: appUrl,
            expiresIn: data.expires_in || data.expiresIn || '1 hour'
          })
        );
        break;

      case 'auth_magic_link':
        subject = 'Your secure login link for OgaJobs';
        emailHtml = await renderAsync(
          React.createElement(MagicLinkEmail, {
            magicLink: data.magic_link || data.magicLink || '#',
            userEmail: email,
            appUrl: appUrl
          })
        );
        break;

      case 'auth_reauthentication':
        subject = 'Confirm reauthentication - OgaJobs';
        emailHtml = await renderAsync(
          React.createElement(ReauthenticationEmail, {
            verificationCode: data.verification_code || data.verificationCode || '000000',
            userEmail: email,
            appUrl: appUrl
          })
        );
        break;

      case 'auth_email_change':
        subject = 'Confirm your email change - OgaJobs';
        emailHtml = await renderAsync(
          React.createElement(EmailChangeEmail, {
            confirmUrl: data.confirm_url || data.confirmUrl || '#',
            userEmail: email,
            oldEmail: data.old_email || data.oldEmail,
            appUrl: appUrl
          })
        );
        break;
        
      default:
        // Fallback for other templates with simple HTML
        const fallbackTemplates = {
          booking_assigned: {
            subject: 'New Booking Assignment',
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New Booking Assignment</h2>
              <p>Hello ${data.artisanName},</p>
              <p>You have been assigned a new booking: <strong>${data.bookingTitle}</strong></p>
              <p><strong>Location:</strong> ${data.location}<br>
              <strong>Budget:</strong> ₦${data.budget}</p>
              <p>Please respond within 24 hours.</p>
              <p>Best regards,<br>OgaJobs Team</p>
            </div>`
          },
          booking_confirmed: {
            subject: 'Booking Confirmed',
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Booking Confirmed</h2>
              <p>Hello ${data.clientName},</p>
              <p>Your booking has been confirmed with <strong>${data.artisanName}</strong>.</p>
              <p><strong>Service:</strong> ${data.serviceType}<br>
              <strong>Date:</strong> ${data.preferredDate}</p>
              <p>The artisan will contact you soon.</p>
              <p>Best regards,<br>OgaJobs Team</p>
            </div>`
          },
          payment_received: {
            subject: 'Payment Received - OgaJobs',
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Payment Received</h2>
              <p>Payment of <strong>₦${data.amount}</strong> has been received for Job ID: ${data.booking_id}.</p>
              <p>Best regards,<br>OgaJobs Team</p>
            </div>`
          }
        };
        
        const fallback = fallbackTemplates[template as keyof typeof fallbackTemplates] || {
          subject: 'Notification from OgaJobs',
          html: '<div style="font-family: Arial, sans-serif;"><p>You have a new notification from OgaJobs.</p></div>'
        };
        
        subject = fallback.subject;
        emailHtml = fallback.html;
    }

    // Send email using Resend
    const { data: emailResult, error } = await resend.emails.send({
      from: 'OgaJobs <noreply@ogajobs.com.ng>',
      to: [email],
      subject: subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', emailResult);
    return {
      success: true,
      email: email,
      subject: subject,
      messageId: emailResult?.id,
      service: 'resend'
    };

  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

async function sendPushNotification(template: string, data: Record<string, any>, userId: string, supabase: any) {
  try {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);
    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, message: 'No push subscriptions' };
    }
    return { success: true, message: 'Push queued' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendSMSNotification(template: string, data: Record<string, any>) {
  return { success: false, error: 'SMS not configured' };
}

async function createInAppNotification(template: string, data: Record<string, any>, userId: string, supabase: any) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: data.title || template,
        message: data.message || '',
        type: data.type || 'system',
        read: false,
        target_audience: null,
        created_at: new Date().toISOString()
      });
    if (error) {
      console.error('In-app notification error:', error);
      return { success: false, error: error.message };
    }
    return { success: true, userId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

serve(handler);