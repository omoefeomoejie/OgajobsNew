import { useState } from "react";
import { WelcomeEmailService, WelcomeEmailData } from "@/components/auth/WelcomeEmailService";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

/**
 * Custom hook for sending welcome emails
 */
export function useWelcomeEmail() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendWelcomeEmail = async (data: WelcomeEmailData) => {
    setIsLoading(true);
    
    try {
      const result = await WelcomeEmailService.sendWelcomeEmail(data);
      
      if (result.success) {
        logger.info('Welcome email sent via hook', { userId: data.userId });
        toast({
          title: "Welcome Email Sent",
          description: "A welcome email has been sent to your email address.",
        });
        return { success: true };
      } else {
        logger.error('Welcome email failed via hook', { 
          userId: data.userId, 
          error: result.error 
        });
        // Don't show error toast for email issues during signup
        // Just log it silently
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      logger.error('Welcome email hook error', { 
        userId: data.userId, 
        error: error.message 
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
    setIsLoading(true);
    
    try {
      const result = await WelcomeEmailService.sendPasswordResetEmail(email, resetUrl);
      
      if (result.success) {
        toast({
          title: "Password Reset Email Sent",
          description: "Please check your email for password reset instructions.",
        });
        return { success: true };
      } else {
        toast({
          title: "Email Error",
          description: result.error || "Failed to send password reset email.",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      toast({
        title: "Email Error", 
        description: "Failed to send password reset email.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailVerification = async (email: string, confirmUrl: string) => {
    setIsLoading(true);
    
    try {
      const result = await WelcomeEmailService.sendEmailVerification(email, confirmUrl);
      
      if (result.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your email to verify your account.",
        });
        return { success: true };
      } else {
        toast({
          title: "Email Error",
          description: result.error || "Failed to send verification email.",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      toast({
        title: "Email Error",
        description: "Failed to send verification email.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendEmailVerification,
    isLoading
  };
}