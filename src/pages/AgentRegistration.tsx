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

const AgentRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

      // Create agent profile in profiles table for now
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'pos_agent'
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Registration Successful",
        description: "Your POS agent application has been submitted for review.",
      });

      navigate('/agent-dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
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
                      <SelectItem value="044">Access Bank</SelectItem>
                      <SelectItem value="014">Afribank</SelectItem>
                      <SelectItem value="023">Citibank</SelectItem>
                      <SelectItem value="050">Ecobank</SelectItem>
                      <SelectItem value="011">First Bank</SelectItem>
                      <SelectItem value="214">First City Monument Bank</SelectItem>
                      <SelectItem value="070">Fidelity Bank</SelectItem>
                      <SelectItem value="058">Guaranty Trust Bank</SelectItem>
                      <SelectItem value="030">Heritage Bank</SelectItem>
                      <SelectItem value="301">Jaiz Bank</SelectItem>
                      <SelectItem value="082">Keystone Bank</SelectItem>
                      <SelectItem value="076">Polaris Bank</SelectItem>
                      <SelectItem value="221">Stanbic IBTC Bank</SelectItem>
                      <SelectItem value="068">Standard Chartered</SelectItem>
                      <SelectItem value="232">Sterling Bank</SelectItem>
                      <SelectItem value="032">Union Bank</SelectItem>
                      <SelectItem value="033">United Bank for Africa</SelectItem>
                      <SelectItem value="215">Unity Bank</SelectItem>
                      <SelectItem value="035">Wema Bank</SelectItem>
                      <SelectItem value="057">Zenith Bank</SelectItem>
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
  );
};

export default AgentRegistration;