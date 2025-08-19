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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.json();
    const { type, items } = body;

    if (type === "payment_verification") {
      // Enhanced payment verification with additional security checks
      const { reference, expectedAmount, userId } = items;

      // Verify with Paystack
      const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          "Authorization": `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
          "Content-Type": "application/json",
        },
      });

      const paystackData = await paystackResponse.json();

      // Enhanced validation
      const validationResults = {
        paystack_status: paystackData.status,
        amount_match: paystackData.data.amount === (expectedAmount * 100), // Convert to kobo
        status_success: paystackData.data.status === 'success',
        user_validation: true, // Can add more user-specific validation
        timestamp: new Date().toISOString()
      };

      // Log verification attempt
      await supabaseClient
        .from("payment_security_logs")
        .insert({
          event_type: "payment_verification_attempt",
          user_id: userId,
          transaction_reference: reference,
          event_details: validationResults,
          severity: validationResults.paystack_status && validationResults.amount_match ? 'low' : 'high'
        });

      return new Response(JSON.stringify({
        success: true,
        validation_results: validationResults,
        verified: Object.values(validationResults).every(v => v === true)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    if (type === "escrow_security_check") {
      // Security check for escrow operations
      const { escrowId, operation, userId } = items;

      // Verify escrow ownership and status
      const { data: escrow, error } = await supabaseClient
        .from("escrow_payments")
        .select("*")
        .eq("id", escrowId)
        .single();

      if (error || !escrow) {
        throw new Error("Escrow payment not found");
      }

      const securityChecks = {
        ownership_verified: escrow.client_id === userId || escrow.artisan_id === userId,
        status_valid: escrow.status === 'pending',
        operation_allowed: operation === 'release' && escrow.client_id === userId,
        amount_reasonable: escrow.amount <= 10000000, // 10M Naira cap
        timing_appropriate: new Date(escrow.auto_release_date) > new Date()
      };

      return new Response(JSON.stringify({
        success: true,
        security_checks: securityChecks,
        authorized: Object.values(securityChecks).every(v => v === true)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    if (type === "transaction_anomaly_detection") {
      // Detect unusual transaction patterns
      const { userId, amount, transactionType } = items;

      // Get user's recent transaction history
      const { data: recentTransactions } = await supabaseClient
        .from("payment_transactions")
        .select("amount, created_at, transaction_type")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false });

      const anomalyChecks = {
        frequency_normal: (recentTransactions?.length || 0) <= 10, // Max 10 transactions per day
        amount_reasonable: amount >= 100 && amount <= 1000000, // Between 100 and 1M Naira
        pattern_consistent: true, // Can add more sophisticated pattern analysis
        velocity_acceptable: true // Can add velocity checks
      };

      // Flag if anomalies detected
      if (!Object.values(anomalyChecks).every(v => v === true)) {
        await supabaseClient
          .from("payment_security_logs")
          .insert({
            event_type: "transaction_anomaly_detected",
            user_id: userId,
            event_details: { anomalyChecks, amount, transactionType },
            severity: 'high'
          });
      }

      return new Response(JSON.stringify({
        success: true,
        anomaly_checks: anomalyChecks,
        flagged: !Object.values(anomalyChecks).every(v => v === true)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    throw new Error("Invalid security check type");

  } catch (error) {
    console.error("Security validation error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});