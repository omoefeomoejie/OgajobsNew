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
import { LocationSelector } from '@/components/ui/LocationSelector';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useWelcomeEmail } from '@/hooks/useWelcomeEmail';
import { NIGERIAN_BANKS, NIGERIAN_STATES_LIST } from '@/lib/nigeria';

const AgentRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendWelcomeEmail } = useWelcomeEmail();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    location: '',
    lga: '',
    address: '',
    bankAccount: '',
    bankCode: '',
    accountName: '',
    experience: '',
  });


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
        area: formData.location,
        lga: formData.lga,
        address: formData.address,
        ...(formData.experience ? { notes: formData.experience } : {})
      };

      const agentCode = generateAgentCode();

      // Fetch commission rate from platform settings
      const { data: commissionSetting } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'commission_rate')
        .maybeSingle();
      const agentCommissionRate = commissionSetting?.value ? parseFloat(commissionSetting.value) : 10.0;

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
        commission_rate: agentCommissionRate,
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
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+234 XXX XXX XXXX"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
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
                      <Label>Location</Label>
                      <LocationSelector
                        value={formData.location || ''}
                        onChange={(val) => handleInputChange('location', val)}
                        placeholder="Select your area"
                      />
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
                          {NIGERIAN_BANKS.map((bank) => (
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