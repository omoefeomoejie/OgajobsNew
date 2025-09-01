import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface WelcomeEmailData {
  userId: string;
  email: string;
  fullName: string;
  role: 'client' | 'artisan';
}

/**
 * Service for sending welcome emails to new users
 */
export class WelcomeEmailService {
  /**
   * Send a welcome email to a new user
   */
  static async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Sending welcome email', { 
        userId: data.userId, 
        email: data.email, 
        role: data.role 
      });

      const template = data.role === 'client' ? 'welcome_client' : 'welcome_artisan';

      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'email',
          template: template,
          userEmail: data.email,
          userId: data.userId,
          data: {
            full_name: data.fullName,
            role: data.role
          }
        }
      });

      if (error) {
        logger.error('Welcome email sending failed', { 
          error: error.message, 
          userId: data.userId 
        });
        return { success: false, error: error.message };
      }

      logger.info('Welcome email sent successfully', { userId: data.userId });
      return { success: true };

    } catch (error: any) {
      logger.error('Welcome email service error', { 
        error: error.message, 
        userId: data.userId 
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a password reset email
   */
  static async sendPasswordResetEmail(email: string, resetUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Sending password reset email', { email });

      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'email',
          template: 'password_reset',
          userEmail: email,
          data: {
            reset_url: resetUrl,
            expires_in: '1 hour'
          }
        }
      });

      if (error) {
        logger.error('Password reset email sending failed', { 
          error: error.message, 
          email 
        });
        return { success: false, error: error.message };
      }

      logger.info('Password reset email sent successfully', { email });
      return { success: true };

    } catch (error: any) {
      logger.error('Password reset email service error', { 
        error: error.message, 
        email 
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an email verification email
   */
  static async sendEmailVerification(email: string, confirmUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Sending email verification', { email });

      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'email',
          template: 'email_verification',
          userEmail: email,
          data: {
            confirm_url: confirmUrl
          }
        }
      });

      if (error) {
        logger.error('Email verification sending failed', { 
          error: error.message, 
          email 
        });
        return { success: false, error: error.message };
      }

      logger.info('Email verification sent successfully', { email });
      return { success: true };

    } catch (error: any) {
      logger.error('Email verification service error', { 
        error: error.message, 
        email 
      });
      return { success: false, error: error.message };
    }
  }
}