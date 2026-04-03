import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Home, Receipt, Shield } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference');
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (!reference) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/my-bookings');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [reference, navigate]);

  if (!reference) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <div className="text-center">
              <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <CardTitle className="text-2xl text-red-600">No Payment Found</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              No payment reference was found. Please check your bookings.
            </p>
            <Button asChild className="w-full">
              <Link to="/my-bookings">
                <Receipt className="mr-2 h-4 w-4" />
                View My Bookings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <CardTitle className="text-2xl text-green-600">Payment Received!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference:</span>
              <span className="font-mono text-sm">{reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold text-green-600">Completed</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Escrow Protection Active</h3>
            </div>
            <p className="text-blue-700 text-sm">
              Your payment is held securely in escrow. Release it to the artisan once the service is completed to your satisfaction.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Redirecting to My Bookings in {countdown}s…
          </p>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link to="/my-bookings">
                <Receipt className="mr-2 h-4 w-4" />
                View My Bookings
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
