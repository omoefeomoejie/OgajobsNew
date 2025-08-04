import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, CreditCard, AlertCircle } from 'lucide-react';

interface CommissionWithdrawalProps {
  availableBalance: number;
  onWithdrawalSuccess: () => void;
}

const CommissionWithdrawal: React.FC<CommissionWithdrawalProps> = ({
  availableBalance,
  onWithdrawalSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });

  const nigerianBanks = [
    { code: '044', name: 'Access Bank' },
    { code: '014', name: 'Afribank' },
    { code: '023', name: 'Citibank' },
    { code: '050', name: 'Ecobank' },
    { code: '011', name: 'First Bank' },
    { code: '214', name: 'First City Monument Bank' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '058', name: 'Guaranty Trust Bank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '301', name: 'Jaiz Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '076', name: 'Polaris Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '068', name: 'Standard Chartered' },
    { code: '232', name: 'Sterling Bank' },
    { code: '032', name: 'Union Bank' },
    { code: '033', name: 'United Bank for Africa' },
    { code: '215', name: 'Unity Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '057', name: 'Zenith Bank' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const withdrawalAmount = parseFloat(formData.amount);
      
      if (withdrawalAmount <= 0 || withdrawalAmount > availableBalance) {
        throw new Error('Invalid withdrawal amount');
      }

      if (withdrawalAmount < 1000) {
        throw new Error('Minimum withdrawal amount is ₦1,000');
      }

      // Create withdrawal request (simplified for now)
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          artisan_id: user.id, // Using artisan_id field for agent withdrawals for now
          amount: withdrawalAmount,
          bank_code: formData.bankCode,
          bank_account_number: formData.accountNumber,
          account_name: formData.accountName,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Withdrawal Request Submitted",
        description: `Your withdrawal request for ₦${withdrawalAmount.toLocaleString()} has been submitted and will be processed within 1-3 business days.`,
      });

      onWithdrawalSuccess();
      
      // Reset form
      setFormData({
        amount: '',
        bankCode: '',
        accountNumber: '',
        accountName: '',
      });
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Commission Withdrawal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">Available Balance</span>
          </div>
          <p className="text-2xl font-bold text-green-700 mt-1">
            ₦{availableBalance.toLocaleString()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount (min ₦1,000)"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              min="1000"
              max={availableBalance}
              required
            />
            <p className="text-xs text-gray-500">
              Minimum withdrawal: ₦1,000
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankCode">Bank</Label>
            <Select onValueChange={(value) => handleInputChange('bankCode', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                {nigerianBanks.map((bank) => (
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
              placeholder="Enter your account number"
              value={formData.accountNumber}
              onChange={(e) => handleInputChange('accountNumber', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              placeholder="Enter account holder name"
              value={formData.accountName}
              onChange={(e) => handleInputChange('accountName', e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Withdrawal Information</p>
                <ul className="mt-1 text-xs space-y-1">
                  <li>• Processing time: 1-3 business days</li>
                  <li>• No fees for withdrawals above ₦5,000</li>
                  <li>• ₦50 fee for withdrawals below ₦5,000</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !formData.amount || parseFloat(formData.amount) > availableBalance}
          >
            {loading ? 'Processing...' : 'Request Withdrawal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CommissionWithdrawal;