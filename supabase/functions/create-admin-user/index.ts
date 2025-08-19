import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAdminRequest {
  email: string;
  password: string;
  fullName?: string;
  role?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Create Supabase client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create regular Supabase client for validation
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Set auth header for regular client
    supabase.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: '',
    } as any);

    const { email, password, fullName, role = 'admin' }: CreateAdminRequest = await req.json();

    console.log('Creating admin user:', { email, role, fullName });

    // Validate the request using our database function
    const { data: validationResult, error: validationError } = await supabase.rpc(
      'create_admin_user',
      {
        p_email: email,
        p_password: password,
        p_full_name: fullName,
        p_role: role
      }
    );

    if (validationError) {
      console.error('Validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Validation failed: ' + validationError.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      return new Response(
        JSON.stringify({ error: validationResult.error }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create the user with Supabase Admin API
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName || ''
      }
    });

    if (userError) {
      console.error('User creation error:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user: ' + userError.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('User created successfully:', userData.user.id);

    // Create the profile using the setup_admin_user function
    const { error: profileError } = await supabaseAdmin.rpc('setup_admin_user', {
      admin_email: email,
      admin_user_id: userData.user.id
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Try to clean up the user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create admin profile: ' + profileError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Update the profile with the correct role and full name if provided
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: role,
        ...(fullName && { full_name: fullName })
      })
      .eq('id', userData.user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Don't fail completely, just log the error
      console.log('Profile created but role/name update failed');
    }

    // Log successful admin creation
    await supabase.rpc('log_security_event', {
      p_event_type: 'admin_user_created',
      p_event_details: {
        target_email: email,
        target_role: role,
        target_user_id: userData.user.id,
        created_by_function: true
      },
      p_severity: 'medium'
    });

    console.log('Admin user created successfully:', {
      id: userData.user.id,
      email: email,
      role: role
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: userData.user.id,
          email: userData.user.email,
          role: role,
          fullName: fullName
        }
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});