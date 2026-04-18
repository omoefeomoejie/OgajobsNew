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
    if (authError || !user?.email) {
      console.log("Authentication error:", authError);
      throw new Error("User not authenticated");
    }

    const { amount, currency = "NGN", transaction_type, booking_id, artisan_id } = await req.json();

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    // Read commission rate from platform_settings
    const { data: commissionSetting } = await supabaseClient
      .from('platform_settings')
      .select('value')
      .eq('key', 'commission_rate')
      .maybeSingle();

    const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) / 100 : 0.10;

    // Calculate fees
    const platformFee = Math.round(amount * commissionRate * 100) / 100;
    const artisanEarnings = Math.round(amount * (1 - commissionRate) * 100) / 100;

    // Generate unique reference
    const reference = `ogajobs_${Date.now()}_${user.id.slice(0, 8)}`;

    // Initialize payment with Paystack
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amount * 100, // Convert to kobo (Paystack expects amount in kobo)
        currency: currency,
        reference: reference,
        callback_url: `${Deno.env.get('APP_URL') || 'https://www.ogajobs.com.ng'}/payment-success`,
        metadata: {
          user_id: user.id,
          transaction_type: transaction_type,
          booking_id: booking_id,
          artisan_id: artisan_id,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.log("Paystack error:", paystackData);
      throw new Error(paystackData.message || "Payment initialization failed");
    }

    // Create transaction record in database
    const { error: dbError } = await supabaseClient
      .from("payment_transactions")
      .insert({
        user_id: user.id,
        booking_id: booking_id,
        artisan_id: artisan_id,
        client_id: user.id,
        amount: amount,
        currency: currency,
        paystack_reference: reference,
        payment_status: "pending",
        transaction_type: transaction_type,
        platform_fee: platformFee,
        artisan_earnings: artisanEarnings,
        escrow_status: "held",
      });

    if (dbError) {
      console.log("Database error:", dbError);
      throw new Error("Failed to create transaction record");
    }

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: reference,
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