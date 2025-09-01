import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Users, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface CommissionTrackerProps {
  agentId?: string;
  className?: string;
}

const CommissionTracker: React.FC<CommissionTrackerProps> = ({ agentId, className }) => {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarned: 0,
    pendingAmount: 0,
    activeArtisans: 0,
    monthlyGrowth: 0
  });

  useEffect(() => {
    loadCommissionData();
  }, [agentId]);

  const loadCommissionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get POS agent data
      const { data: agentData, error: agentError } = await supabase
        .from('pos_agents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (agentError && agentError.code !== 'PGRST116') {
        console.error('Error fetching agent data:', agentError);
      }

      if (!agentData) {
        setStats({
          totalEarned: 0,
          pendingAmount: 0,
          activeArtisans: 0,
          monthlyGrowth: 0
        });
        setLoading(false);
        return;
      }

      // Get commission transactions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commission_transactions')
        .select(`
          *,
          artisans!commission_transactions_artisan_id_fkey (
            id,
            full_name,
            email,
            category
          )
        `)
        .eq('agent_id', agentData.id)
        .order('created_at', { ascending: false });

      if (commissionsError && commissionsError.code !== 'PGRST116') {
        console.error('Error fetching commissions:', commissionsError);
      }

      // Get agent referrals for artisan count
      const { data: referralsData, error: referralsError } = await supabase
        .from('agent_referrals')
        .select('*')
        .eq('agent_id', agentData.id);

      if (referralsError && referralsError.code !== 'PGRST116') {
        console.error('Error fetching referrals:', referralsError);
      }

      const commissions = commissionsData || [];
      const totalArtisans = referralsData?.length || 0;

      // Format commissions for display
      const formattedCommissions = commissions.map((commission: any) => ({
        id: commission.id,
        artisan_name: commission.artisans?.full_name || 'Unknown Artisan',
        artisan_service: commission.artisans?.category || 'N/A',
        amount: Number(commission.amount),
        status: commission.status,
        date: new Date(commission.created_at),
        commission_rate: Number(commission.commission_rate || 0),
        booking_count: 1 // This could be enhanced with actual booking count
      }));

      setCommissions(formattedCommissions);

      // Calculate stats
      const totalEarned = commissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + Number(c.amount), 0);
      
      const pendingAmount = commissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + Number(c.amount), 0);

      // Calculate monthly growth (comparison with previous month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const currentMonthEarnings = commissions
        .filter(c => {
          const commissionDate = new Date(c.created_at);
          return commissionDate.getMonth() === currentMonth && 
                 commissionDate.getFullYear() === currentYear;
        })
        .reduce((sum, c) => sum + Number(c.amount), 0);

      const previousMonthEarnings = commissions
        .filter(c => {
          const commissionDate = new Date(c.created_at);
          return commissionDate.getMonth() === previousMonth && 
                 commissionDate.getFullYear() === previousYear;
        })
        .reduce((sum, c) => sum + Number(c.amount), 0);

      const monthlyGrowth = previousMonthEarnings > 0 
        ? Math.round(((currentMonthEarnings - previousMonthEarnings) / previousMonthEarnings) * 100)
        : currentMonthEarnings > 0 ? 100 : 0;

      setStats({
        totalEarned,
        pendingAmount,
        activeArtisans: totalArtisans,
        monthlyGrowth: Math.max(monthlyGrowth, 0) // Ensure non-negative growth
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading commission data:', error);
      toast({
        title: "Error",
        description: "Failed to load commission data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold">₦{stats.totalEarned.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">₦{stats.pendingAmount.toLocaleString()}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Artisans</p>
                <p className="text-2xl font-bold">{stats.activeArtisans}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Growth</p>
                <p className="text-2xl font-bold">+{stats.monthlyGrowth}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commission Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commissions.length > 0 ? (
              commissions.slice(0, 10).map((commission: any) => (
                <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {commission.artisan_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium">{commission.artisan_name}</h4>
                      <p className="text-sm text-muted-foreground">{commission.artisan_service}</p>
                      <p className="text-xs text-muted-foreground">
                        {commission.booking_count} booking{commission.booking_count !== 1 ? 's' : ''} • {commission.commission_rate}% commission
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">₦{commission.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(commission.status)}
                      <Badge variant="secondary" className={getStatusColor(commission.status)}>
                        {commission.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {commission.date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Commission Data</h3>
                <p className="text-gray-500">Start onboarding artisans to see commission activity here.</p>
                <Button className="mt-4" onClick={loadCommissionData}>
                  Refresh Data
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionTracker;