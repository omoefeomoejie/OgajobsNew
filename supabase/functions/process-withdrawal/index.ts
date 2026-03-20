import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WithdrawalRequest {
  id: string;
  artisan_id: string;
  amount: number;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  status: string;
}

interface PaystackTransferData {
  source: string;
  amount: number;
  recipient: string;
  reason: string;
  reference: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { withdrawalId, action } = await req.json();

    console.log(`Processing withdrawal ${withdrawalId} with action: ${action}`);

    // Get withdrawal request details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests_v2')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (withdrawalError || !withdrawal) {
      throw new Error('Withdrawal request not found');
    }

    if (action === 'approve') {
      // Create Paystack transfer recipient
      const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nuban',
          name: withdrawal.account_name,
          account_number: withdrawal.account_number,
          bank_code: withdrawal.bank_code,
        }),
      });

      const recipientData = await recipientResponse.json();

      if (!recipientData.status) {
        throw new Error(`Failed to create recipient: ${recipientData.message}`);
      }

      // Initiate transfer
      const reference = `WD_${withdrawal.id}_${Date.now()}`;
      const transferData: PaystackTransferData = {
        source: 'balance',
        amount: withdrawal.amount * 100, // Convert to kobo
        recipient: recipientData.data.recipient_code,
        reason: `Withdrawal for artisan ${withdrawal.artisan_id}`,
        reference: reference,
      };

      const transferResponse = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });

      const transferResult = await transferResponse.json();

      if (!transferResult.status) {
        throw new Error(`Transfer failed: ${transferResult.message}`);
      }

      // Update withdrawal request
      const { error: updateError } = await supabase
        .from('withdrawal_requests_v2')
        .update({
          status: 'processing',
          transaction_reference: reference,
          paystack_transfer_code: transferResult.data.transfer_code,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      if (updateError) {
        throw updateError;
      }

      console.log(`Withdrawal ${withdrawalId} approved and transfer initiated`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Withdrawal approved and transfer initiated',
          transferCode: transferResult.data.transfer_code,
          reference: reference,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (action === 'reject') {
      // Reject withdrawal
      const { error: updateError } = await supabase
        .from('withdrawal_requests_v2')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      if (updateError) {
        throw updateError;
      }

      console.log(`Withdrawal ${withdrawalId} rejected`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Withdrawal rejected',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } else if (action === 'verify') {
      // Verify transfer status with Paystack
      const { data: currentWithdrawal, error: fetchError } = await supabase
        .from('withdrawal_requests_v2')
        .select('paystack_transfer_code, transaction_reference')
        .eq('id', withdrawalId)
        .single();

      if (fetchError || !currentWithdrawal?.paystack_transfer_code) {
        throw new Error('Transfer code not found');
      }

      const verifyResponse = await fetch(
        `https://api.paystack.co/transfer/verify/${currentWithdrawal.transaction_reference}`,
        {
          headers: {
            'Authorization': `Bearer ${paystackSecretKey}`,
          },
        }
      );

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.status) {
        throw new Error(`Verification failed: ${verifyResult.message}`);
      }

      let newStatus = 'processing';
      if (verifyResult.data.status === 'success') {
        newStatus = 'completed';

        // Fix: Fetch specific earnings records, then mark only enough to cover
        // the withdrawal amount — not ALL earnings before the request date.
        const { data: availableEarnings } = await supabase
          .from('artisan_earnings_v2')
          .select('id, amount')
          .eq('artisan_id', withdrawal.artisan_id)
          .eq('status', 'available')
          .lte('created_at', withdrawal.created_at)
          .order('created_at', { ascending: true });

        if (availableEarnings && availableEarnings.length > 0) {
          let remaining = withdrawal.amount;
          const idsToMark: string[] = [];
          for (const earning of availableEarnings) {
            if (remaining <= 0) break;
            idsToMark.push(earning.id);
            remaining -= earning.amount;
          }
          if (idsToMark.length > 0) {
            await supabase
              .from('artisan_earnings_v2')
              .update({ status: 'withdrawn' })
              .in('id', idsToMark);
          }
        }

      } else if (verifyResult.data.status === 'failed') {
        newStatus = 'failed';
      }

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('withdrawal_requests_v2')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Withdrawal status verified',
          status: newStatus,
          paystackStatus: verifyResult.data.status,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('Error processing withdrawal:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
};

serve(handler);