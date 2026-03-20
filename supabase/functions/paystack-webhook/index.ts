import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  // Paystack sends POST with x-paystack-signature header
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  // Verify webhook signature using HMAC-SHA512 (Web Crypto API)
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(body);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-512" }, false, ["sign"]
  );
  const rawSig = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const hash = Array.from(new Uint8Array(rawSig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hash !== signature) {
    console.error("Webhook signature mismatch");
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);
  console.log("Paystack webhook received:", event.event);

  // Use service role key — webhook runs outside user session
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  if (event.event === "charge.success") {
    const data = event.data;
    const reference = data.reference as string;
    const paystackAmount = data.amount / 100; // Paystack sends kobo

    console.log(`Processing successful charge: ${reference}, amount: ${paystackAmount}`);

    // Find the transaction by reference
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (txError || !transaction) {
      console.error("Transaction not found for reference:", reference, txError);
      // Still return 200 so Paystack doesn't retry
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (transaction.payment_status === "success") {
      // Already processed (idempotency)
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Update transaction status
    await supabase
      .from("payment_transactions")
      .update({
        payment_status: "success",
        updated_at: new Date().toISOString(),
      })
      .eq("paystack_reference", reference);

    // Create escrow entry
    const autoReleaseDate = new Date();
    autoReleaseDate.setDate(autoReleaseDate.getDate() + 7);

    const { error: escrowError } = await supabase
      .from("escrow_payments")
      .upsert({
        transaction_id: transaction.id,
        booking_id: transaction.booking_id,
        client_id: transaction.client_id,
        artisan_id: transaction.artisan_id,
        amount: paystackAmount,
        platform_fee: transaction.platform_fee,
        artisan_amount: transaction.artisan_earnings,
        status: "pending",
        auto_release_date: autoReleaseDate.toISOString(),
      }, { onConflict: "transaction_id" });

    if (escrowError) {
      console.error("Escrow creation error:", escrowError);
    }

    // Update booking status to 'paid'
    if (transaction.booking_id) {
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          status: "paid",
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.booking_id);

      if (bookingError) {
        console.error("Booking update error:", bookingError);
      } else {
        console.log(`Booking ${transaction.booking_id} marked as paid`);
      }
    }
  } else if (event.event === "transfer.success") {
    // Artisan payout completed
    const reference = event.data.reference as string;

    await supabase
      .from("withdrawal_requests_v2")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_reference", reference);

    console.log(`Transfer completed: ${reference}`);
  } else if (event.event === "transfer.failed") {
    const reference = event.data.reference as string;

    await supabase
      .from("withdrawal_requests_v2")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_reference", reference);

    console.log(`Transfer failed: ${reference}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
