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

  // Use service role key - bypasses RLS so booking updates always work
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const { reference } = await req.json();

    if (!reference) {
      throw new Error("Payment reference is required");
    }

    console.log(`Verifying payment reference: ${reference}`);

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paystackData = await paystackResponse.json();
    console.log(`Paystack response status: ${paystackData.data?.status}`);

    if (!paystackData.status) {
      throw new Error(paystackData.message || "Payment verification failed");
    }

    const paymentStatus = paystackData.data.status; // "success" or "failed"
    const amount = paystackData.data.amount / 100; // kobo to naira

    // Find the transaction by reference
    const { data: transaction, error: findError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (findError || !transaction) {
      console.log("Transaction not found:", findError);
      throw new Error("Transaction not found for this reference");
    }

    console.log(`Transaction found: ${transaction.id}, current status: ${transaction.payment_status}`);

    // If already processed, return early
    if (transaction.payment_status === "success") {
      console.log("Transaction already processed");
      return new Response(
        JSON.stringify({ status: "success", already_processed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Update transaction status
    await supabase
      .from("payment_transactions")
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("paystack_reference", reference);

    console.log(`Transaction updated to: ${paymentStatus}`);

    // If payment successful - update booking and create escrow
    if (paymentStatus === "success" && transaction.booking_id) {
      console.log(`Updating booking ${transaction.booking_id} to paid`);

      // Update booking status
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          status: "paid",
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.booking_id);

      if (bookingError) {
        console.log("Booking update error:", bookingError);
      } else {
        console.log("Booking successfully marked as paid");
      }

      // Create escrow entry
      const { error: escrowError } = await supabase
        .from("escrow_payments")
        .upsert({
          transaction_id: transaction.id,
          booking_id: transaction.booking_id,
          client_id: transaction.client_id,
          artisan_id: transaction.artisan_id,
          amount: amount,
          platform_fee: transaction.platform_fee,
          artisan_amount: transaction.artisan_earnings,
          status: "pending",
          auto_release_date: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }, { onConflict: "transaction_id" });

      if (escrowError) {
        console.log("Escrow creation error:", escrowError);
      }
    }

    return new Response(
      JSON.stringify({
        status: paymentStatus,
        amount: amount,
        booking_updated: paymentStatus === "success" && !!transaction.booking_id,
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
