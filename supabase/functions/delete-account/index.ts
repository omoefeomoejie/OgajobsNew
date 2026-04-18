import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated");

    const { reason } = await req.json().catch(() => ({ reason: null }));

    // Check for active/pending bookings
    const { data: activeBookings } = await serviceClient
      .from("bookings")
      .select("id, status")
      .eq("client_email", user.email)
      .in("status", ["pending", "accepted", "in_progress", "paid"])
      .limit(1);

    if (activeBookings && activeBookings.length > 0) {
      throw new Error("You have active bookings. Please complete or cancel them before deleting your account.");
    }

    // Check for pending escrow payments as artisan
    const { data: pendingEscrow } = await serviceClient
      .from("escrow_payments")
      .select("id")
      .eq("status", "pending")
      .limit(1);

    // Soft delete — set deleted_at timestamp
    const { error: deleteError } = await serviceClient
      .from("profiles")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (deleteError) throw new Error("Failed to delete account");

    // Sign out the user
    await anonClient.auth.signOut();

    // Log the deletion
    await serviceClient.from("audit_logs").insert({
      user_id: user.id,
      action: "account_deleted",
      details: { reason: reason || "No reason provided" },
      created_at: new Date().toISOString(),
    }).catch(() => {}); // Non-blocking

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
