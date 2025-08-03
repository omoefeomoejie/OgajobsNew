import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EscrowPayment {
  id: string;
  transaction_id: string;
  booking_id: string;
  client_id: string;
  artisan_id: string;
  amount: number;
  platform_fee: number;
  artisan_amount: number;
  status: string;
  release_date: string | null;
  auto_release_date: string;
  created_at: string;
  payment_transactions: {
    paystack_reference: string;
    transaction_type: string;
  };
}

interface EscrowManagerProps {
  clientId?: string;
  artisanId?: string;
}

export default function EscrowManager({ clientId, artisanId }: EscrowManagerProps) {
  const [escrowPayments, setEscrowPayments] = useState<EscrowPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchEscrowPayments();
  }, [clientId, artisanId]);

  const fetchEscrowPayments = async () => {
    try {
      let query = supabase
        .from('escrow_payments')
        .select(`
          *,
          payment_transactions(paystack_reference, transaction_type)
        `)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      if (artisanId) {
        query = query.eq('artisan_id', artisanId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEscrowPayments(data || []);
    } catch (error) {
      console.error('Error fetching escrow payments:', error);
      toast({
        title: "Error",
        description: "Failed to load escrow payments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const releaseEscrow = async (escrowId: string) => {
    setProcessingIds(prev => new Set(prev).add(escrowId));

    try {
      const { data, error } = await supabase.functions.invoke('release-escrow', {
        body: { escrow_id: escrowId }
      });

      if (error) throw new Error(error.message);

      toast({
        title: "Escrow Released",
        description: `Payment of ₦${data.amount} has been released to the artisan`,
      });

      // Refresh the list
      await fetchEscrowPayments();
    } catch (error) {
      console.error('Error releasing escrow:', error);
      toast({
        title: "Release Failed",
        description: error instanceof Error ? error.message : "Failed to release escrow",
        variant: "destructive"
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(escrowId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'released':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disputed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return "secondary";
      case 'released':
        return "default";
      case 'disputed':
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAutoReleaseClose = (autoReleaseDate: string) => {
    const now = new Date();
    const releaseDate = new Date(autoReleaseDate);
    const timeDiff = releaseDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff <= 1;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Escrow Payments</h3>
      </div>

      {escrowPayments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No escrow payments found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {escrowPayments.map((escrow) => (
            <Card key={escrow.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Payment Escrow
                  </CardTitle>
                  <Badge variant={getStatusVariant(escrow.status)} className="flex items-center gap-1">
                    {getStatusIcon(escrow.status)}
                    {escrow.status.charAt(0).toUpperCase() + escrow.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>
                    <p className="font-medium">₦{escrow.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Artisan Receives:</span>
                    <p className="font-medium">₦{escrow.artisan_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Platform Fee:</span>
                    <p className="font-medium">₦{escrow.platform_fee.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">{formatDate(escrow.created_at)}</p>
                  </div>
                </div>

                {escrow.status === 'pending' && (
                  <>
                    {isAutoReleaseClose(escrow.auto_release_date) && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          This payment will be automatically released on {formatDate(escrow.auto_release_date)}
                        </AlertDescription>
                      </Alert>
                    )}

                    {clientId === escrow.client_id && (
                      <Button
                        onClick={() => releaseEscrow(escrow.id)}
                        disabled={processingIds.has(escrow.id)}
                        className="w-full"
                      >
                        {processingIds.has(escrow.id) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Releasing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Release Payment to Artisan
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}

                {escrow.release_date && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Released on:</span>
                    <p className="font-medium">{formatDate(escrow.release_date)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}