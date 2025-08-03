import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, MapPin, User, Briefcase, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const cities = [
  'Lagos',
  'Abuja', 
  'Benin City',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Kaduna'
];

const serviceTypes = [
  'Plumbing',
  'Electrical',
  'Carpentry', 
  'Painting',
  'Cleaning',
  'Garden',
  'HVAC',
  'Roofing',
  'Other'
];

export default function BookingRequest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    workType: searchParams.get('service') || '',
    city: '',
    preferredDate: null as Date | null,
    description: '',
    urgency: 'normal',
    budget: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const preselectedArtisan = searchParams.get('artisan');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      toast({
        title: "Authentication required",
        description: "Please log in to make a booking request.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        client_email: user.email,
        work_type: formData.workType,
        city: formData.city,
        preferred_date: formData.preferredDate?.toISOString().split('T')[0],
        artisan_email: preselectedArtisan,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('bookings')
        .insert(bookingData);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Booking request submitted!",
        description: "We'll match you with the best artisan for your needs.",
      });

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/bookings');
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit booking request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AppLayout>
        <div className="p-6 max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Booking Request Submitted!</h2>
              <p className="text-muted-foreground mb-4">
                We're now matching you with the best artisan for your needs.
              </p>
              <p className="text-sm text-muted-foreground">
                You'll receive updates via email and can track progress in your dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Request a Service</h1>
          <p className="text-muted-foreground">
            Tell us what you need and we'll connect you with the right artisan
          </p>
        </div>

        {preselectedArtisan && (
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              You're requesting a service from {preselectedArtisan}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
            <CardDescription>
              Provide details about the service you need
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Type */}
              <div className="space-y-2">
                <Label htmlFor="workType">Service Type *</Label>
                <Select 
                  value={formData.workType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, workType: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select 
                  value={formData.city} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Date */}
              <div className="space-y-2">
                <Label>Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.preferredDate ? (
                        format(formData.preferredDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.preferredDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, preferredDate: date }))}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what work you need done..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Urgency */}
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select 
                  value={formData.urgency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Can wait a week</SelectItem>
                    <SelectItem value="normal">Normal - Within a few days</SelectItem>
                    <SelectItem value="high">High - ASAP</SelectItem>
                    <SelectItem value="emergency">Emergency - Today</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget">Estimated Budget (₦)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g. 50000"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  Optional: This helps us match you with artisans in your price range
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              What happens next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">1</div>
              <div>
                <h4 className="font-medium">We review your request</h4>
                <p className="text-sm text-muted-foreground">Our team verifies the details and requirements</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">2</div>
              <div>
                <h4 className="font-medium">Artisan assignment</h4>
                <p className="text-sm text-muted-foreground">We match you with the best available artisan</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">3</div>
              <div>
                <h4 className="font-medium">Direct contact</h4>
                <p className="text-sm text-muted-foreground">You'll receive the artisan's contact details</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}