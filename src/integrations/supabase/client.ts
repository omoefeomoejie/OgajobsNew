import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vclzkuzexsuhaaliweey.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbHprdXpleHN1aGFhbGl3ZWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMTMyMjEsImV4cCI6MjA2NjU4OTIyMX0.mNyEzMp185PumIi8Y7j7WbLc6ixh8d9BlNeOMONPr_w";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});