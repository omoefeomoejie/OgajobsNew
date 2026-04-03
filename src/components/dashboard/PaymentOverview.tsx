import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  DollarSign,
  Clock,
  Receipt,
  Download,
  AlertCircle,
  CheckCircle,
  Shield,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PaymentData {
  escrowBalance: number;
  pendingInvoices: number;
  totalSpent: number;
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    date: string;
    description: string;
    booking_id?: string;
  }>;
}

export function PaymentOverview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<PaymentData>({
    escrowBalance: 0,
    pendingInvoices: 0,
    totalSpent: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchPaymentData();
    }
  }, [user]);

  const fetchPaymentData = async () => {
    setFetchError(null);
    try {
      // escrow_payments uses client_id (UUID) — confirmed against DB types
      const { data: escrowData, error: escrowError } = await supabase
        .from('escrow_payments')
        .select('*')
        .eq('client_id', user?.id);

      if (escrowError) {
        console.error('Error fetching escrow payments:', escrowError);
        throw escrowError;
      }

      // Fetch bookings for payment info
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_email', user?.email);

      if (bookingsError) {
        console.error('Error fetching bookings for payment:', bookingsError);
        throw bookingsError;
      }

      const resolvedEscrow = escrowData || [];
      const resolvedBookings = bookingsData || [];

      const escrowBalance = resolvedEscrow
        .filter(e => e.status === 'held')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const pendingInvoices = resolvedBookings
        .filter(b => b.payment_status === 'pending')
        .reduce((sum, b) => sum + Number(b.budget || 0), 0);

      const totalSpent = resolvedBookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + Number(b.budget || 0), 0);

      const transactions = [
        ...resolvedEscrow.map(e => ({
          id: e.id,
          amount: Number(e.amount),
          type: 'escrow',
          status: e.status || 'unknown',
          date: e.created_at || new Date().toISOString(),
          description: 'Escrow payment for booking',
          booking_id: e.booking_id
        })),
        ...resolvedBookings
          .filter(b => b.payment_status === 'paid')
          .map(b => ({
            id: b.id,
            amount: Number(b.budget || 0),
            type: 'payment',
            status: 'completed',
            date: b.created_at,
            description: `Payment for ${b.work_type}`,
            booking_id: b.id
          }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setPaymentData({
        escrowBalance,
        pendingInvoices,
        totalSpent,
        transactions
      });
    } catch (error: any) {
      console.error('Error fetching payment data:', error);
      const message = error?.message || 'Failed to load payment data.';
      setFetchError(message);
      toast({
        title: 'Payment data unavailable',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      held: { label: 'In Escrow', variant: 'secondary' as const, icon: Shield },
      pending: { label: 'Pending', variant: 'outline' as const, icon: Clock },
      completed: { label: 'Completed', variant: 'default' as const, icon: CheckCircle },
      failed: { label: 'Failed', variant: 'destructive' as const, icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (fetchError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setLoading(true); fetchPaymentData(); }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Overview
        </CardTitle>
        <CardDescription>Manage your payments and transactions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Escrow Balance
              </span>
            </div>
            <p className="text-xl font-bold text-blue-600">₦{paymentData.escrowBalance.toLocaleString()}</p>
            <p className="text-xs text-blue-600/70">Protected funds</p>
          </div>
          
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Pending Invoices
              </span>
            </div>
            <p className="text-xl font-bold text-orange-600">₦{paymentData.pendingInvoices.toLocaleString()}</p>
            <p className="text-xs text-orange-600/70">Awaiting payment</p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Total Spent
              </span>
            </div>
            <p className="text-xl font-bold text-green-600">₦{paymentData.totalSpent.toLocaleString()}</p>
            <p className="text-xs text-green-600/70">All time</p>
          </div>
        </div>

        {/* Transactions */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="escrow">Escrow</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Recent Transactions</h4>
              <Button size="sm" variant="outline">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
            
            {paymentData.transactions.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {paymentData.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-medium">₦{transaction.amount.toLocaleString()}</p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="escrow">
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Escrow Protection</p>
              <p className="text-sm text-muted-foreground">
                Your payments are held securely until work is completed
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="receipts">
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Digital Receipts</p>
              <p className="text-sm text-muted-foreground">
                Download receipts for completed payments
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}