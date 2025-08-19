import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Shield, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentErrorBoundary } from './PaymentErrorBoundary';
import { useSecureSubmit } from '@/hooks/useSecureSubmit';
import { logSecurityEvent } from '@/lib/security';

interface PaymentFormProps {
  bookingId?: string;
  artisanId?: string;
  transactionType: 'booking_payment' | 'profile_boost';
  defaultAmount?: number;
  onSuccess?: () => void;
}

export default function PaymentForm({ 
  bookingId, 
  artisanId, 
  transactionType, 
  defaultAmount,
  onSuccess 
}: PaymentFormProps) {
  const [amount, setAmount] = useState(defaultAmount || 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const { toast } = useToast();

  const { submitSecurely } = useSecureSubmit({
    rateLimitKey: `payment_${transactionType}`,
    maxAttempts: 3,
    onError: (error) => setLastError(error),
    validator: (data) => {
      const errors: string[] = [];
      if (!data.amount || data.amount <= 0) {
        errors.push('Valid amount is required');
      }
      if (data.amount < 100) {
        errors.push('Minimum payment amount is ₦100');
      }
      if (data.amount > 10000000) {
        errors.push('Maximum payment amount is ₦10,000,000');
      }
      return { valid: errors.length === 0, errors };
    }
  });

  const platformFee = Math.round(amount * 0.10 * 100) / 100;
  const artisanEarnings = Math.round(amount * 0.90 * 100) / 100;

  const handlePayment = async () => {
    setLastError(null);
    setPaymentAttempts(prev => prev + 1);

    await submitSecurely(
      {
        amount,
        currency: 'NGN',
        transaction_type: transactionType,
        booking_id: bookingId,
        artisan_id: artisanId,
      },
      async (sanitizedData) => {
        setIsProcessing(true);

        try {
          // Log payment initiation
          await logSecurityEvent('payment_initiated', {
            transaction_type: transactionType,
            amount: sanitizedData.amount,
            booking_id: bookingId,
            attempt: paymentAttempts
          }, 'medium');

          const { data, error } = await supabase.functions.invoke('create-payment', {
            body: sanitizedData
          });

          if (error) {
            throw new Error(error.message);
          }

          if (!data?.authorization_url) {
            throw new Error('Invalid payment response - no authorization URL received');
          }

          // Validate authorization URL
          try {
            new URL(data.authorization_url);
          } catch {
            throw new Error('Invalid payment URL received');
          }

          // Open payment page in new tab with validation
          const paymentWindow = window.open(data.authorization_url, '_blank', 'noopener,noreferrer');
          
          if (!paymentWindow) {
            throw new Error('Payment popup was blocked. Please allow popups and try again.');
          }
          
          toast({
            title: "Payment Initiated",
            description: "Complete your payment in the new window",
          });

          // Log successful initiation
          await logSecurityEvent('payment_redirect_success', {
            transaction_type: transactionType,
            reference: data.reference
          }, 'low');

          onSuccess?.();
        } catch (error) {
          console.error('Payment error:', error);
          
          // Log payment failure
          await logSecurityEvent('payment_initiation_failed', {
            transaction_type: transactionType,
            error: error instanceof Error ? error.message : 'Unknown error',
            attempt: paymentAttempts
          }, 'high');

          const errorMessage = error instanceof Error ? error.message : "Failed to initiate payment";
          setLastError(errorMessage);
          
          toast({
            title: "Payment Failed",
            description: errorMessage,
            variant: "destructive"
          });
          
          throw error;
        } finally {
          setIsProcessing(false);
        }
      }
    );
  };

  return (
    <PaymentErrorBoundary onRetry={() => window.location.reload()}>
      <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {transactionType === 'booking_payment' ? 'Pay for Service' : 'Boost Profile'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (NGN)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Enter amount"
            disabled={isProcessing}
            min="1"
            step="0.01"
          />
        </div>

        {amount > 0 && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Amount:</span>
              <span>₦{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Platform Fee (10%):</span>
              <span>₦{platformFee.toLocaleString()}</span>
            </div>
            {transactionType === 'booking_payment' && (
              <div className="flex justify-between text-sm font-medium">
                <span>Artisan Receives:</span>
                <span>₦{artisanEarnings.toLocaleString()}</span>
              </div>
            )}
            <hr />
            <div className="flex justify-between font-semibold">
              <span>You Pay:</span>
              <span>₦{amount.toLocaleString()}</span>
            </div>
          </div>
        )}

        {lastError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {lastError}
            </AlertDescription>
          </Alert>
        )}

        {transactionType === 'booking_payment' && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Escrow Protection</p>
                <p className="text-sm">Your payment is held securely until the service is completed. You can release payment to the artisan once satisfied.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {paymentAttempts > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            Payment attempt {paymentAttempts} of 3
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Powered by Paystack - Secure Payment Processing</span>
        </div>

        <Button 
          onClick={handlePayment} 
          disabled={isProcessing || !amount || amount <= 0 || paymentAttempts >= 3}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ₦{amount.toLocaleString()}
            </>
          )}
        </Button>

        <div className="flex flex-wrap gap-1 justify-center">
          <Badge variant="secondary" className="text-xs">SSL Secured</Badge>
          <Badge variant="secondary" className="text-xs">256-bit Encryption</Badge>
          <Badge variant="secondary" className="text-xs">PCI Compliant</Badge>
        </div>
      </CardContent>
    </Card>
    </PaymentErrorBoundary>
  );
}