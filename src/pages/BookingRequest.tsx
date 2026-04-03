import { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Briefcase, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SERVICE_CATEGORIES } from '@/lib/nigeria';
import { LocationSelector } from '@/components/ui/LocationSelector';

export default function BookingRequest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const preselectedArtisan = searchParams.get('artisan');

  const [workType, setWorkType] = useState(searchParams.get('service') || '');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to make a booking request.',
        variant: 'destructive',
      });
      return;
    }

    if (!workType || !city) {
      toast({
        title: 'Missing fields',
        description: 'Please select a service type and city.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: booking, error } = await supabase.from('bookings').insert({
        client_email: user.email,
        work_type: workType,
        city,
        description: description || null,
        urgency,
        budget: budget ? parseFloat(budget) : null,
        artisan_email: preselectedArtisan || null,
        status: 'pending',
        payment_status: 'unpaid',
        created_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;

      // Attempt automatic artisan matching in the background
      if (booking?.id) {
        try {
          await supabase.rpc('auto_assign_artisans', {
            booking_id_param: booking.id,
            max_assignments: 5,
          });
        } catch (matchError) {
          console.error('Auto-match attempted:', matchError);
        }
      }

      setSubmitted(true);
      toast({
        title: 'Booking request submitted!',
        description: "We're finding the best artisans for your job.",
      });

      setTimeout(() => {
        navigate('/my-bookings');
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting booking:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit booking request. Please try again.',
        variant: 'destructive',
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
              <div className="space-y-2">
                <Label htmlFor="workType">Service Type *</Label>
                <Select value={workType} onValueChange={setWorkType}>
                  <SelectTrigger id="workType">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <LocationSelector value={city} onChange={setCity} placeholder="Select your area" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what work you need done..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger id="urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent (within 24h)</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Estimated Budget (₦)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g. 50000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min="0"
                />
                <p className="text-sm text-muted-foreground">
                  Optional: This helps us match you with artisans in your price range
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </CardContent>
        </Card>

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
