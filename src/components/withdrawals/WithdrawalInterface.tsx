import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, CreditCard, History, AlertCircle, CheckCircle } from 'lucide-react';

const NIGERIAN_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "014", name: "Afribank" },
  { code: "023", name: "Citibank" },
  { code: "050", name: "Ecobank" },
  { code: "011", name: "First Bank" },
  { code: "214", name: "First City Monument Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "030", name: "Heritage Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "068", name: "Standard Chartered" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "Suntrust Bank" },
  { code: "032", name: "Union Bank" },
  { code: "033", name: "United Bank for Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" }
];

interface WithdrawalData {
  availableBalance: number;
  totalEarnings: number;
  pendingWithdrawals: number;
  withdrawnAmount: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  created_at: string;
  processed_at?: string;
  transaction_reference?: string;
}

export const WithdrawalInterface: React.FC = () => {
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData>({
    availableBalance: 0,
    totalEarnings: 0,
    pendingWithdrawals: 0,
    withdrawnAmount: 0
  });
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchWithdrawalData();
    fetchWithdrawalHistory();
  }, []);

  const fetchWithdrawalData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get artisan balance
      const { data: balanceData, error } = await supabase
        .rpc('get_artisan_balance_v2', { artisan_id_param: user.id });

      if (error) throw error;

      if (balanceData && balanceData.length > 0) {
        const balance = balanceData[0];
        setWithdrawalData({
          availableBalance: balance.available_balance || 0,
          totalEarnings: balance.total_earnings || 0,
          pendingWithdrawals: balance.pending_withdrawals || 0,
          withdrawnAmount: balance.withdrawn_amount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching withdrawal data:', error);
      toast({
        title: "Error",
        description: "Failed to load withdrawal data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('withdrawal_requests_v2')
        .select('*')
        .eq('artisan_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setWithdrawalHistory(data || []);
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedBank || !accountNumber || !accountName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const withdrawalAmount = parseFloat(amount);

      // Validate withdrawal
      const { data: validationData, error: validationError } = await supabase
        .rpc('validate_withdrawal_request_v2', {
          artisan_id_param: user.id,
          amount_param: withdrawalAmount
        });

      if (validationError) throw validationError;

      if (validationData && validationData.length > 0 && !validationData[0].is_valid) {
        toast({
          title: "Withdrawal Error",
          description: validationData[0].error_message,
          variant: "destructive"
        });
        return;
      }

      // Create withdrawal request
      const { error: insertError } = await supabase
        .from('withdrawal_requests_v2')
        .insert({
          artisan_id: user.id,
          amount: withdrawalAmount,
          bank_name: NIGERIAN_BANKS.find(bank => bank.code === selectedBank)?.name || '',
          bank_code: selectedBank,
          account_number: accountNumber,
          account_name: accountName,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully"
      });

      // Reset form and refresh data
      setAmount('');
      setSelectedBank('');
      setAccountNumber('');
      setAccountName('');
      fetchWithdrawalData();
      fetchWithdrawalHistory();

    } catch (error: any) {
      console.error('Error submitting withdrawal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "default" as const, icon: AlertCircle },
      processing: { variant: "secondary" as const, icon: CreditCard },
      completed: { variant: "default" as const, icon: CheckCircle },
      failed: { variant: "destructive" as const, icon: AlertCircle },
      cancelled: { variant: "outline" as const, icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Withdrawals</h1>
        <Badge variant="outline" className="text-sm">
          Available: ₦{withdrawalData.availableBalance.toLocaleString()}
        </Badge>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{withdrawalData.availableBalance.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{withdrawalData.totalEarnings.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₦{withdrawalData.pendingWithdrawals.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{withdrawalData.withdrawnAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="withdraw" className="space-y-4">
        <TabsList>
          <TabsTrigger value="withdraw">New Withdrawal</TabsTrigger>
          <TabsTrigger value="history">Withdrawal History</TabsTrigger>
        </TabsList>

        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Withdrawal Amount (₦)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1000"
                    max={withdrawalData.availableBalance}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum withdrawal: ₦1,000 | Available: ₦{withdrawalData.availableBalance.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank">Bank</Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIAN_BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    maxLength={10}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    type="text"
                    placeholder="Enter account name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || withdrawalData.availableBalance < 1000}
                  className="w-full"
                >
                  {submitting ? "Processing..." : "Submit Withdrawal Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Withdrawal History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawalHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No withdrawal requests yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawalHistory.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          {new Date(withdrawal.requestedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          ₦{withdrawal.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{withdrawal.bankName}</TableCell>
                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {withdrawal.transactionReference || 'Pending'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};