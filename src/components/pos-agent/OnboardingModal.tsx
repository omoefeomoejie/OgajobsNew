import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    serviceCategory: '',
    location: '',
  });

  const serviceCategories = [
    'Plumbing', 'Electrical', 'Carpentry', 'Tailoring', 'Catering',
    'Hair Styling', 'Makeup', 'Cleaning', 'Painting', 'Welding',
    'Auto Mechanic', 'Phone Repair', 'Appliance Repair'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call to onboard artisan
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Artisan Onboarded Successfully",
        description: `${formData.fullName} has been added to your network.`,
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Onboarding Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative pb-3">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
          <CardTitle>Onboard New Artisan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter artisan's full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234 XXX XXX XXXX"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="artisan@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceCategory">Service Category</Label>
              <Select onValueChange={(value) => handleInputChange('serviceCategory', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service category" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, State"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Onboarding...' : 'Onboard Artisan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingModal;