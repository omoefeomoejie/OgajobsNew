import { supabase } from "@/integrations/supabase/client";

export const manualRoleSync = async (userId: string, correctRole: string) => {
  try {
    console.log(`Manually syncing role for user ${userId} to ${correctRole}`);
    
    // Try to update the profile role directly
    const { error } = await supabase
      .from('profiles')
      .update({ role: correctRole })
      .eq('id', userId);
    
    if (error) {
      console.warn('Database role sync failed:', error);
      return false;
    }
    
    console.log('Manual role sync successful');
    return true;
  } catch (err) {
    console.warn('Manual role sync failed:', err);
    return false;
  }
};

export const forceUserRole = async (userId: string): Promise<string | null> => {
  try {
    // Get user metadata as source of truth
    const { data: userData } = await supabase.auth.getUser();
    const userMetadataRole = userData?.user?.user_metadata?.role;
    
    if (userMetadataRole) {
      console.log(`Forcing role from user metadata: ${userMetadataRole}`);
      
      // Try to sync database but don't block on it
      manualRoleSync(userId, userMetadataRole).catch(console.warn);
      
      return userMetadataRole;
    }
    
    return null;
  } catch (err) {
    console.warn('Error forcing user role:', err);
    return null;
  }
};