import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  Calculator,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Filter,
  Eye,
  Banknote,
  PiggyBank,
  CreditCard,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface FinancialData {
  overview: {
    totalRevenue: number;
    platformFees: number;
    artisanEarnings: number;
    escrowHeld: number;
    pendingPayouts: number;
    monthlyGrowth: number;
    profitMargin: number;
  };
  revenueBreakdown: {
    daily: Array<{
      date: string;
      revenue: number;
      platformFee: number;
      transactions: number;
    }>;
    monthly: Array<{
      month: string;
      revenue: number;
      platformFee: number;
      artisanEarnings: number;
      growth: number;
    }>;
  };
  transactionData: Array<{
    id: string;
    date: string;
    amount: number;
    platformFee: number;
    artisanEarnings: number;
    status: string;
    bookingId: string;
    paymentMethod: string;
  }>;
  escrowData: Array<{
    id: string;
    amount: number;
    artisanAmount: number;
    platformFee: number;
    status: string;
    createdAt: string;
    releaseDate: string;
    bookingId: string;
  }>;
  payoutData: Array<{
    id: string;
    artisanId: string;
    amount: number;
    status: string;
    processedAt: string;
    bankDetails: string;
  }>;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  platformFee: {
    label: "Platform Fee",
    color: "hsl(var(--chart-2))",
  },
  artisanEarnings: {
    label: "Artisan Earnings",
    color: "hsl(var(--chart-3))",
  },
  transactions: {
    label: "Transactions",
    color: "hsl(var(--chart-4))",
  },
};

export function FinancialReporting() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');

  const handleExport = () => {
    if (!data) return;
    const rows = [
      ['Date', 'Revenue', 'Platform Fee', 'Transactions'],
      ...(data.revenueBreakdown.daily || []).map(d => [d.date, d.revenue, d.platformFee, d.transactions]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      const daysBack = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Fetch financial data — capture errors individually so one failure doesn't block others
      const [
        { data: transactions, error: txError },
        { data: escrowPayments, error: escrowError },
        { data: withdrawals, error: wdError },
        { data: bookings, error: bookingsError }
      ] = await Promise.all([
        supabase
          .from('payment_transactions')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('escrow_payments')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('withdrawal_requests')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('bookings')
          .select('*')
          .gte('created_at', startDate.toISOString())
      ]);

      if (txError) console.warn('payment_transactions fetch error:', txError.message);
      if (escrowError) console.warn('escrow_payments fetch error:', escrowError.message);
      if (wdError) console.warn('withdrawal_requests fetch error:', wdError.message);
      if (bookingsError) console.warn('bookings fetch error:', bookingsError.message);

      // Calculate overview metrics
      const totalRevenue = transactions?.reduce((sum, t) => 
        sum + (t.payment_status === 'completed' ? Number(t.amount) : 0), 0) || 0;
      
      const platformFees = transactions?.reduce((sum, t) => 
        sum + (t.payment_status === 'completed' ? Number(t.platform_fee || 0) : 0), 0) || 0;
      
      const artisanEarnings = transactions?.reduce((sum, t) => 
        sum + (t.payment_status === 'completed' ? Number(t.artisan_earnings || 0) : 0), 0) || 0;
      
      const escrowHeld = escrowPayments?.reduce((sum, e) => 
        sum + (e.status === 'held' ? Number(e.amount) : 0), 0) || 0;
      
      const pendingPayouts = withdrawals?.reduce((sum, w) => 
        sum + (w.status === 'pending' ? Number(w.amount) : 0), 0) || 0;

      // Calculate growth rate
      const previousPeriodStart = new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000);
      const { data: previousTransactions } = await supabase
        .from('payment_transactions')
        .select('amount')
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', startDate.toISOString())
        .eq('payment_status', 'completed');

      const previousRevenue = previousTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const monthlyGrowth = previousRevenue ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Generate daily revenue breakdown
      const dailyBreakdown = Array.from({ length: daysBack }, (_, i) => {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTransactions = transactions?.filter(t => 
          t.created_at?.startsWith(dateStr) && t.payment_status === 'completed'
        ) || [];
        
        const dayRevenue = dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const dayPlatformFee = dayTransactions.reduce((sum, t) => sum + Number(t.platform_fee || 0), 0);

        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue,
          platformFee: dayPlatformFee,
          transactions: dayTransactions.length
        };
      });

      // Generate monthly breakdown (last 6 months)
      const monthlyRaw = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const monthStr = date.toISOString().substring(0, 7);

        const monthTransactions = transactions?.filter(t =>
          t.created_at?.startsWith(monthStr) && t.payment_status === 'completed'
        ) || [];

        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
          platformFee: monthTransactions.reduce((sum, t) => sum + Number(t.platform_fee || 0), 0),
          artisanEarnings: monthTransactions.reduce((sum, t) => sum + Number(t.artisan_earnings || 0), 0),
        };
      });

      const monthlyBreakdown = monthlyRaw.map((data, i) => {
        const prevRevenue = i > 0 ? monthlyRaw[i - 1].revenue : 0;
        const growth = prevRevenue > 0
          ? Number(((data.revenue - prevRevenue) / prevRevenue * 100).toFixed(1))
          : 0;
        return { ...data, growth };
      });

      // Format transaction data
      const transactionData = transactions?.slice(0, 20).map(t => ({
        id: t.id,
        date: new Date(t.created_at).toLocaleDateString(),
        amount: Number(t.amount),
        platformFee: Number(t.platform_fee || 0),
        artisanEarnings: Number(t.artisan_earnings || 0),
        status: t.payment_status,
        bookingId: t.booking_id || 'N/A',
        paymentMethod: t.transaction_type || 'card'
      })) || [];

      // Format escrow data
      const escrowData = escrowPayments?.slice(0, 20).map(e => ({
        id: e.id,
        amount: Number(e.amount),
        artisanAmount: Number(e.artisan_amount),
        platformFee: Number(e.platform_fee),
        status: e.status,
        createdAt: new Date(e.created_at).toLocaleDateString(),
        releaseDate: e.release_date ? new Date(e.release_date).toLocaleDateString() : 'Pending',
        bookingId: e.booking_id || 'N/A'
      })) || [];

      // Format payout data
      const payoutData = withdrawals?.slice(0, 20).map(w => ({
        id: w.id,
        artisanId: w.artisan_id,
        amount: Number(w.amount),
        status: w.status,
        processedAt: w.processed_at ? new Date(w.processed_at).toLocaleDateString() : 'Pending',
        bankDetails: `${w.bank_code} - ${w.account_name}`
      })) || [];

      setData({
        overview: {
          totalRevenue,
          platformFees,
          artisanEarnings,
          escrowHeld,
          pendingPayouts,
          monthlyGrowth,
          profitMargin: totalRevenue ? (platformFees / totalRevenue) * 100 : 0
        },
        revenueBreakdown: {
          daily: dailyBreakdown,
          monthly: monthlyBreakdown
        },
        transactionData,
        escrowData,
        payoutData
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">💰 Financial Reporting</h1>
          <p className="text-muted-foreground">Revenue tracking, commission analysis & financial insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">₦{data.overview.totalRevenue.toLocaleString()}</div>
            <Badge variant={data.overview.monthlyGrowth > 0 ? "default" : "destructive"} className="mt-1">
              {data.overview.monthlyGrowth > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {Math.abs(data.overview.monthlyGrowth).toFixed(1)}% vs last period
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees (10%)</CardTitle>
            <Percent className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">₦{data.overview.platformFees.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">
              {data.overview.profitMargin.toFixed(1)}% profit margin
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Artisan Earnings (90%)</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">₦{data.overview.artisanEarnings.toLocaleString()}</div>
            <p className="text-xs text-purple-600 mt-1">
              Distributed to service providers
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escrow Held</CardTitle>
            <PiggyBank className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">₦{data.overview.escrowHeld.toLocaleString()}</div>
            <p className="text-xs text-orange-600 mt-1">
              Awaiting job completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Reports Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="escrow">Escrow Management</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="analytics">Financial Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <AreaChart data={data.revenueBreakdown.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      dataKey="revenue" 
                      fill="var(--color-revenue)" 
                      stroke="var(--color-revenue)"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <BarChart data={data.revenueBreakdown.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="platformFee" fill="var(--color-platformFee)" radius={[4, 4, 0, 0]} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Commission Split</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <LineChart data={data.revenueBreakdown.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--color-revenue)" 
                    strokeWidth={3}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="artisanEarnings" 
                    stroke="var(--color-artisanEarnings)" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="platformFee" 
                    stroke="var(--color-platformFee)" 
                    strokeWidth={2}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Platform Fee</TableHead>
                    <TableHead>Artisan Earnings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.transactionData.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell className="font-medium">₦{transaction.amount.toLocaleString()}</TableCell>
                      <TableCell>₦{transaction.platformFee.toLocaleString()}</TableCell>
                      <TableCell>₦{transaction.artisanEarnings.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' : 
                          transaction.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{transaction.bookingId}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escrow" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Escrow Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Held:</span>
                    <span className="font-semibold">₦{data.overview.escrowHeld.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending Release:</span>
                    <span className="font-semibold text-orange-600">{data.escrowData.filter(e => e.status === 'held').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Auto-Release Soon:</span>
                    <span className="font-semibold text-blue-600">
                      {data.escrowData.filter(e => e.releaseDate !== 'Pending').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Release Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" size="sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Release All Due
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Review Pending
                </Button>
                <Button variant="destructive" className="w-full" size="sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Dispute Resolution
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Hold Time:</span>
                    <span className="font-semibold">3.2 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Dispute Rate:</span>
                    <span className="font-semibold text-red-600">1.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Auto-Release Rate:</span>
                    <span className="font-semibold text-green-600">94.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Escrow Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Platform Fee</TableHead>
                    <TableHead>Artisan Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Release Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.escrowData.map((escrow) => (
                    <TableRow key={escrow.id}>
                      <TableCell>{escrow.createdAt}</TableCell>
                      <TableCell className="font-medium">₦{escrow.amount.toLocaleString()}</TableCell>
                      <TableCell>₦{escrow.platformFee.toLocaleString()}</TableCell>
                      <TableCell>₦{escrow.artisanAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          escrow.status === 'released' ? 'default' : 
                          escrow.status === 'held' ? 'secondary' : 'destructive'
                        }>
                          {escrow.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{escrow.releaseDate}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payout Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <span className="font-medium">Pending Payouts</span>
                    <span className="text-lg font-bold">₦{data.overview.pendingPayouts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="font-medium">Processed Today</span>
                    <span className="text-lg font-bold text-green-600">₦{(data.overview.pendingPayouts * 0.3).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="font-medium">Success Rate</span>
                    <span className="text-lg font-bold text-blue-600">97.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payout Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Pending Payouts
                </Button>
                <Button variant="outline" className="w-full">
                  <Receipt className="w-4 h-4 mr-2" />
                  Generate Payout Report
                </Button>
                <Button variant="outline" className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Batch Payouts
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artisan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed Date</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.payoutData.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono text-sm">{payout.artisanId.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium">₦{payout.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          payout.status === 'completed' ? 'default' : 
                          payout.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{payout.processedAt}</TableCell>
                      <TableCell className="text-sm">{payout.bankDetails}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Financial Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600">A+</div>
                    <p className="text-sm text-muted-foreground">Revenue Growth</p>
                    <p className="text-xs text-green-600">+{data.overview.monthlyGrowth.toFixed(1)}% MoM</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">A</div>
                    <p className="text-sm text-muted-foreground">Cash Flow</p>
                    <p className="text-xs text-blue-600">Healthy liquidity</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">B+</div>
                    <p className="text-sm text-muted-foreground">Risk Management</p>
                    <p className="text-xs text-yellow-600">Low dispute rate</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600">A</div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <p className="text-xs text-green-600">Excellent performance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Financial Ratios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Platform Commission Rate</span>
                    <span className="font-semibold">{data.overview.profitMargin.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Revenue Per Transaction</span>
                    <span className="font-semibold">₦{(data.overview.totalRevenue / Math.max(data.transactionData.length, 1)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Escrow Turnover Rate</span>
                    <span className="font-semibold">3.2 days avg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Payout Success Rate</span>
                    <span className="font-semibold text-green-600">97.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Growth Rate</span>
                    <span className={`font-semibold ${data.overview.monthlyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.overview.monthlyGrowth > 0 ? '+' : ''}{data.overview.monthlyGrowth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}