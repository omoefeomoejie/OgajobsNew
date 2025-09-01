import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Phone, User, CreditCard } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useWelcomeEmail } from '@/hooks/useWelcomeEmail';

const AgentRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendWelcomeEmail } = useWelcomeEmail();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    location: '',
    state: '',
    lga: '',
    address: '',
    bankAccount: '',
    bankCode: '',
    accountName: '',
    experience: '',
  });

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
    'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
    'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  const nigerianBanks = [
    // Traditional Banks
    { name: 'Access Bank', code: '044' },
    { name: 'Citibank Nigeria', code: '023' },
    { name: 'Ecobank Nigeria', code: '050' },
    { name: 'Fidelity Bank', code: '070' },
    { name: 'First Bank of Nigeria', code: '011' },
    { name: 'First City Monument Bank', code: '214' },
    { name: 'Guaranty Trust Bank', code: '058' },
    { name: 'Heritage Bank', code: '030' },
    { name: 'Keystone Bank', code: '082' },
    { name: 'Polaris Bank', code: '076' },
    { name: 'Providus Bank', code: '101' },
    { name: 'Stanbic IBTC Bank', code: '221' },
    { name: 'Standard Chartered Bank', code: '068' },
    { name: 'Sterling Bank', code: '232' },
    { name: 'SunTrust Bank', code: '100' },
    { name: 'Union Bank of Nigeria', code: '032' },
    { name: 'United Bank for Africa', code: '033' },
    { name: 'Unity Bank', code: '215' },
    { name: 'Wema Bank', code: '035' },
    { name: 'Zenith Bank', code: '057' },
    
    // Digital Banks
    { name: 'Carbon (Formerly One Finance)', code: '565' },
    { name: 'Kuda Bank', code: '50211' },
    { name: 'ALAT by Wema', code: '035A' },
    { name: 'VFD Microfinance Bank', code: '566' },
    { name: 'Mint MFB', code: '50515' },
    { name: 'Rubies MFB', code: '125' },
    { name: 'Eyowo', code: '50126' },
    
    // Microfinance Banks
    { name: 'LAPO Microfinance Bank', code: '50563' },
    { name: 'AB Microfinance Bank', code: '51204' },
    { name: 'Accion Microfinance Bank', code: '51336' },
    { name: 'Advans La Fayette Microfinance Bank', code: '51244' },
    { name: 'Amju Unique MFB', code: '50926' },
    { name: 'Bainescredit MFB', code: '51229' },
    { name: 'CEMCS Microfinance Bank', code: '50823' },
    { name: 'Esan Microfinance Bank', code: '50126' },
    { name: 'Firmus MFB', code: '51314' },
    { name: 'Fortis Microfinance Bank', code: '501' },
    { name: 'Ibile Microfinance Bank', code: '51244' },
    { name: 'Infinity MFB', code: '50457' },
    { name: 'NPF Microfinance Bank', code: '552' },
    { name: 'Page MFiBank', code: '50746' },
    { name: 'Petra Mircofinance Bank', code: '50746' },
    { name: 'Rephidim Microfinance Bank', code: '50994' },
    { name: 'Safetrust Microfinance Bank', code: '403' },
    { name: 'Stellas MFB', code: '51253' },
    { name: 'Trustfund Microfinance Bank', code: '51269' },
    
    // Payment Service Banks & Fintechs
    { name: 'OPay Digital Services', code: '999992' },
    { name: 'PalmPay', code: '999991' },
    { name: 'MoniePoint MFB', code: '50515' },
    { name: 'FairMoney Microfinance Bank', code: '51318' },
    { name: 'Flutterwave Technology Solutions', code: '50211' },
    { name: 'Paystack', code: '50211' },
    { name: 'Interswitch', code: '50211' },
    
    // Islamic Banking
    { name: 'Jaiz Bank', code: '301' },
    { name: 'Taj Bank', code: '302' },
    
    // Others
    { name: 'Globus Bank', code: '00103' },
    { name: 'PremiumTrust Bank', code: '105' },
    { name: 'Parallex Bank', code: '104' },
    { name: 'Titan Trust Bank', code: '102' }
  ].sort((a, b) => a.name.localeCompare(b.name));

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateAgentCode = () => {
    return 'POS' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const locationData = {
        state: formData.state,
        lga: formData.lga,
        address: formData.address
      };

      const agentCode = generateAgentCode();

      // Get user profile for email
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profileFetchError) throw profileFetchError;

      // Update profile role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'pos_agent'
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create POS agent record
      const posAgentData = {
        user_id: user.id,
        agent_code: agentCode,
        phone: formData.phone,
        location: locationData,
        bank_account_number: formData.bankAccount,
        bank_code: formData.bankCode,
        account_name: formData.accountName,
        status: 'active',
        commission_rate: 10.0, // Default 10% commission
        total_artisans_onboarded: 0,
        total_commission_earned: 0
      };

      const { error: posAgentError } = await supabase
        .from('pos_agents')
        .insert([posAgentData]);

      if (posAgentError) throw posAgentError;

      // Send welcome email
      try {
        await sendWelcomeEmail({
          userId: user.id,
          email: profile?.email || user.email!,
          fullName: user.email!.split('@')[0], // Use email username as name
          role: 'pos_agent',
          agentCode: agentCode
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }

      toast({
        title: "Registration Successful",
        description: `Welcome! Your agent code is: ${agentCode}. Check your email for more details.`,
      });

      navigate('/agent-dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper title="Become a POS Agent">
      <div className="bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Become a POS Agent</CardTitle>
              <CardDescription>
                Join our network and earn commissions by onboarding artisans in your community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Contact Information
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 XXX XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                      className="pl-10"
                    />
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Select onValueChange={(value) => handleInputChange('state', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {nigerianStates.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lga">Local Government Area</Label>
                      <Input
                        id="lga"
                        placeholder="Enter LGA"
                        value={formData.lga}
                        onChange={(e) => handleInputChange('lga', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter your complete address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Banking Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Banking Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Account Number</Label>
                      <Input
                        id="bankAccount"
                        placeholder="Account number"
                        value={formData.bankAccount}
                        onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        placeholder="Account holder name"
                        value={formData.accountName}
                        onChange={(e) => handleInputChange('accountName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bankCode">Bank</Label>
                    <Select onValueChange={(value) => handleInputChange('bankCode', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
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
                </div>

                {/* Experience */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience">Why do you want to become a POS agent?</Label>
                    <Textarea
                      id="experience"
                      placeholder="Tell us about your experience with artisans in your community and why you'd be a good agent"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AgentRegistration;