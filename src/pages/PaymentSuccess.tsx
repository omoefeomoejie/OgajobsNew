import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, XCircle, Home, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [transactionData, setTransactionData] = useState<any>(null);
  const { toast } = useToast();

  const reference = searchParams.get('reference');

  useEffect(() => {
    if (reference) {
      verifyPayment();
    } else {
      setVerificationStatus('failed');
    }
  }, [reference]);

  const verifyPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { reference }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.verified) {
        setVerificationStatus('success');
        setTransactionData(data);
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully",
        });
      } else {
        setVerificationStatus('failed');
        toast({
          title: "Payment Verification Failed",
          description: "Unable to verify your payment",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setVerificationStatus('failed');
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "Failed to verify payment",
        variant: "destructive"
      });
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
              <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
              <p className="text-muted-foreground">Please wait while we verify your payment...</p>
            </CardContent>
          </Card>
        );

      case 'success':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <div className="text-center">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {transactionData && (
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="font-semibold">₦{transactionData.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-mono text-sm">{reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-semibold text-green-600">Completed</span>
                  </div>
                </div>
              )}

              {transactionData?.transaction?.transaction_type === 'booking_payment' && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">Escrow Protection Active</h3>
                  <p className="text-blue-700 text-sm">
                    Your payment is held securely in escrow. You can release it to the artisan once the service is completed to your satisfaction.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link to="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/bookings">
                    <Receipt className="mr-2 h-4 w-4" />
                    View My Bookings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'failed':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <div className="text-center">
                <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                <CardTitle className="text-2xl text-red-600">Payment Verification Failed</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                We couldn't verify your payment. Please contact support if you believe this is an error.
              </p>
              
              {reference && (
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Reference: </span>
                  <span className="font-mono text-sm">{reference}</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={verifyPayment} className="w-full">
                  <Loader2 className="mr-2 h-4 w-4" />
                  Retry Verification
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      {renderContent()}
    </div>
  );
}