import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
    const { escrow_id } = await req.json();

    if (!escrow_id) throw new Error("Escrow ID is required");

    // 1. Fetch escrow record
    const { data: escrow, error: escrowError } = await supabase
      .from("escrow_payments")
      .select("*, payment_transactions(*)")
      .eq("id", escrow_id)
      .single();

    if (escrowError || !escrow) throw new Error("Escrow record not found");
    if (escrow.status !== "pending") throw new Error("Escrow already released or disputed");

    // 2. Read commission rate from platform_settings
    const { data: setting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "commission_rate")
      .maybeSingle();

    const commissionRate = setting ? parseFloat(setting.value) / 100 : 0.10;
    const grossAmount = escrow.amount ?? escrow.payment_transactions?.amount ?? 0;
    const artisanAmount = Math.floor(grossAmount * (1 - commissionRate));
    const platformFee = grossAmount - artisanAmount;

    // 3. Get artisan's booking to find artisan_id
    const { data: booking } = await supabase
      .from("bookings")
      .select("artisan_id, artisan_email, work_type")
      .eq("id", escrow.booking_id)
      .maybeSingle();

    // 4. Get artisan's most recent bank details from withdrawal_requests_v2
    const { data: bankDetails } = await supabase
      .from("withdrawal_requests_v2")
      .select("bank_code, account_number, account_name, bank_name")
      .eq("artisan_id", booking?.artisan_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let transferCode = null;
    let transferInitiated = false;

    // 5. Initiate Paystack transfer if bank details exist
    if (bankDetails?.bank_code && bankDetails?.account_number) {
      // Create transfer recipient
      const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "nuban",
          name: bankDetails.account_name,
          account_number: bankDetails.account_number,
          bank_code: bankDetails.bank_code,
          currency: "NGN",
        }),
      });

      const recipientData = await recipientRes.json();

      if (recipientData.status && recipientData.data?.recipient_code) {
        // Initiate transfer
        const transferRes = await fetch("https://api.paystack.co/transfer", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source: "balance",
            amount: artisanAmount * 100, // Paystack uses kobo
            recipient: recipientData.data.recipient_code,
            reason: `Payment for ${booking?.work_type || "service"} on OgaJobs`,
          }),
        });

        const transferData = await transferRes.json();
        if (transferData.status) {
          transferCode = transferData.data?.transfer_code;
          transferInitiated = true;
        }
      }
    }

    // 6. Update escrow_payments to released
    await supabase
      .from("escrow_payments")
      .update({
        status: "released",
        release_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", escrow_id);

    // 7. Update payment_transactions
    await supabase
      .from("payment_transactions")
      .update({
        escrow_status: "released",
        updated_at: new Date().toISOString(),
      })
      .eq("id", escrow.transaction_id);

    // 8. Write to artisan_earnings_v2
    if (booking?.artisan_id) {
      await supabase.from("artisan_earnings_v2").insert({
        artisan_id: booking.artisan_id,
        booking_id: escrow.booking_id,
        gross_amount: grossAmount,
        platform_fee: platformFee,
        artisan_amount: artisanAmount,
        status: transferInitiated ? "transferred" : "pending_withdrawal",
        transfer_code: transferCode,
        created_at: new Date().toISOString(),
      });
    }

    // 9. Send notification to artisan
    if (booking?.artisan_email) {
      await supabase.functions.invoke("send-notification", {
        body: {
          userEmail: booking.artisan_email,
          type: "in_app",
          template: "payment_received",
          data: {
            title: "Payment Released",
            message: `₦${artisanAmount.toLocaleString()} has been released for your ${booking.work_type} job`,
            type: "payment",
          },
        },
      });

      await supabase.functions.invoke("send-notification", {
        body: {
          userEmail: booking.artisan_email,
          type: "email",
          template: "payment_received",
          data: {
            amount: artisanAmount,
            booking_type: booking.work_type,
            transfer_initiated: transferInitiated,
          },
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: transferInitiated
          ? "Escrow released and bank transfer initiated"
          : "Escrow released — artisan has no bank details on file",
        escrow_id,
        artisan_amount: artisanAmount,
        platform_fee: platformFee,
        transfer_initiated: transferInitiated,
        transfer_code: transferCode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("release-escrow error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
