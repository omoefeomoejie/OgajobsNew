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

    const { reference } = await req.json();

    if (!reference) {
      throw new Error("Payment reference is required");
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error(paystackData.message || "Payment verification failed");
    }

    const paymentStatus = paystackData.data.status;
    const amount = paystackData.data.amount / 100; // Convert from kobo to naira

    // Update payment transaction in database
    const { data: transaction, error: updateError } = await supabaseClient
      .from("payment_transactions")
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("paystack_reference", reference)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.log("Database update error:", updateError);
      throw new Error("Failed to update transaction status");
    }

    // If payment is successful and it's a booking payment, create escrow entry and update booking
    if (paymentStatus === "success" && transaction.transaction_type === "booking_payment") {
      // Create escrow entry
      const { error: escrowError } = await supabaseClient
        .from("escrow_payments")
        .insert({
          transaction_id: transaction.id,
          booking_id: transaction.booking_id,
          client_id: transaction.client_id,
          artisan_id: transaction.artisan_id,
          amount: amount,
          platform_fee: transaction.platform_fee,
          artisan_amount: transaction.artisan_earnings,
          status: "pending",
          auto_release_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        });

      if (escrowError) {
        console.log("Escrow creation error:", escrowError);
      }

      // Update booking status to paid
      if (transaction.booking_id) {
        const { error: bookingError } = await supabaseClient
          .from("bookings")
          .update({
            status: "paid",
            payment_status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.booking_id);

        if (bookingError) {
          console.log("Booking update error:", bookingError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        status: paymentStatus,
        amount: amount,
        transaction: transaction,
        verified: paymentStatus === "success",
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