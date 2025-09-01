import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export const manualRoleSync = async (userId: string, correctRole: string) => {
  try {
    logger.debug('Manual role sync initiated', { hasUserId: !!userId, role: correctRole });
    
    // Try to update the profile role directly
    const { error } = await supabase
      .from('profiles')
      .update({ role: correctRole })
      .eq('id', userId);
    
    if (error) {
      logger.warn('Database role sync failed', { errorCode: error.code });
      return false;
    }
    
    logger.info('Manual role sync successful');
    return true;
  } catch (err) {
    logger.warn('Manual role sync failed', { error: err });
    return false;
  }
};

export const forceUserRole = async (userId: string): Promise<string | null> => {
  try {
    // Get user metadata as source of truth
    const { data: userData } = await supabase.auth.getUser();
    const userMetadataRole = userData?.user?.user_metadata?.role;
    
    if (userMetadataRole) {
      logger.debug('Forcing role from user metadata', { role: userMetadataRole });
      
      // Try to sync database but don't block on it
      manualRoleSync(userId, userMetadataRole).catch((error) => logger.warn('Role sync failed', { error }));
      
      return userMetadataRole;
    }
    
    return null;
  } catch (err) {
    logger.warn('Error forcing user role', { error: err });
    return null;
  }
};