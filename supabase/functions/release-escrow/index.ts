import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    }
  );

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const { escrow_id, reason } = await req.json();

    if (!escrow_id) {
      throw new Error("Escrow ID is required");
    }

    // Get escrow payment details
    const { data: escrow, error: escrowError } = await supabaseClient
      .from("escrow_payments")
      .select("*, payment_transactions(*)")
      .eq("id", escrow_id)
      .single();

    if (escrowError || !escrow) {
      throw new Error("Escrow payment not found");
    }

    // Check if user is authorized to release escrow (client who made the payment)
    if (escrow.client_id !== user.id) {
      throw new Error("Not authorized to release this escrow");
    }

    // Check if escrow is in pending status
    if (escrow.status !== "pending") {
      throw new Error("Escrow can only be released from pending status");
    }

    // Update escrow status to released
    const { error: updateError } = await supabaseClient
      .from("escrow_payments")
      .update({
        status: "released",
        release_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", escrow_id);

    if (updateError) {
      throw new Error("Failed to release escrow");
    }

    // Update the related payment transaction escrow status
    const { error: transactionError } = await supabaseClient
      .from("payment_transactions")
      .update({
        escrow_status: "released",
        updated_at: new Date().toISOString(),
      })
      .eq("id", escrow.transaction_id);

    if (transactionError) {
      console.log("Failed to update transaction escrow status:", transactionError);
    }

    return new Response(
      JSON.stringify({
        message: "Escrow payment released successfully",
        escrow_id: escrow_id,
        amount: escrow.artisan_amount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});