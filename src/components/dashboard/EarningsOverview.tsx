import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Wallet, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EarningsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  pending: number;
  withdrawable: number;
  trend: number;
}

export function EarningsOverview() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    pending: 0,
    withdrawable: 0,
    trend: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchEarnings();
    }
  }, [user]);

  const fetchEarnings = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      type EarningRow = {
        artisan_amount: number;
        gross_amount: number;
        platform_fee: number;
        status: string;
        created_at: string;
      };

      // Fetch artisan net earnings from artisan_earnings_v2
      // Cast required: table is not yet in Supabase generated types
      const { data: earningsRaw, error } = await (supabase as any)
        .from('artisan_earnings_v2')
        .select('artisan_amount, gross_amount, platform_fee, status, created_at')
        .eq('artisan_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allEarnings: EarningRow[] = earningsRaw || [];
      const releasedEarnings = allEarnings.filter(e => e.status === 'transferred' || e.status === 'pending_withdrawal');

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const todayEarnings = releasedEarnings
        .filter(e => e.created_at >= todayStart)
        .reduce((sum, e) => sum + Number(e.artisan_amount), 0);

      const weekEarnings = releasedEarnings
        .filter(e => e.created_at >= weekStart)
        .reduce((sum, e) => sum + Number(e.artisan_amount), 0);

      const monthEarnings = releasedEarnings
        .filter(e => e.created_at >= monthStart)
        .reduce((sum, e) => sum + Number(e.artisan_amount), 0);

      const withdrawableAmount = releasedEarnings
        .reduce((sum, e) => sum + Number(e.artisan_amount), 0);

      const pendingAmount = allEarnings
        .filter(e => e.status === 'pending_withdrawal')
        .reduce((sum, e) => sum + Number(e.artisan_amount), 0);

      setEarnings({
        today: todayEarnings,
        thisWeek: weekEarnings,
        thisMonth: monthEarnings,
        withdrawable: withdrawableAmount,
        pending: pendingAmount,
        trend: 0,
      });

    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Earnings Overview
        </CardTitle>
        <CardDescription>Track your financial performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="period" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="period">Period View</TabsTrigger>
            <TabsTrigger value="status">Status View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="period" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">₦{earnings.today.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">₦{earnings.thisWeek.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">₦{earnings.thisMonth.toLocaleString()}</p>
              </div>
            </div>
            
            {earnings.trend !== 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                {earnings.trend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${earnings.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {earnings.trend > 0 ? '+' : ''}{earnings.trend}% vs last month
                </span>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Pending (Escrow)
                  </span>
                </div>
                <p className="text-xl font-bold text-orange-600">₦{earnings.pending.toLocaleString()}</p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Withdrawable
                  </span>
                </div>
                <p className="text-xl font-bold text-green-600">₦{earnings.withdrawable.toLocaleString()}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}