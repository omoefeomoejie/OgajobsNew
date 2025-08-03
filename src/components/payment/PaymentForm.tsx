import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Shield, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { toast } = useToast();

  const platformFee = Math.round(amount * 0.10 * 100) / 100;
  const artisanEarnings = Math.round(amount * 0.90 * 100) / 100;

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount,
          currency: 'NGN',
          transaction_type: transactionType,
          booking_id: bookingId,
          artisan_id: artisanId,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Redirect to Paystack checkout
      window.open(data.authorization_url, '_blank');
      
      toast({
        title: "Payment Initiated",
        description: "You'll be redirected to complete your payment",
      });

      onSuccess?.();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
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

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Powered by Paystack - Secure Payment Processing</span>
        </div>

        <Button 
          onClick={handlePayment} 
          disabled={isProcessing || !amount || amount <= 0}
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
  );
}