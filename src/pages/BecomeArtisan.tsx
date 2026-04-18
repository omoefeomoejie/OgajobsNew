import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationSelector } from '@/components/ui/LocationSelector';
import { SERVICE_CATEGORIES } from '@/lib/nigeria';
import {
  CheckCircle,
  Star,
  TrendingUp,
  Shield,
  Clock,
  Users,
  DollarSign,
  ArrowRight,
  Phone,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';

export default function BecomeArtisan() {
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [artisanSubmitting, setArtisanSubmitting] = useState(false);
  const [artisanForm, setArtisanForm] = useState({
    fullName: '',
    phone: '',
    category: '',
    city: '',
  });

  const handleArtisanRegister = async () => {
    if (!user?.email) {
      navigate('/auth?tab=register&role=artisan');
      return;
    }
    setArtisanSubmitting(true);
    try {
      await supabase.from('artisans').upsert({
        email: user.email,
        full_name: artisanForm.fullName,
        phone: artisanForm.phone,
        category: artisanForm.category,
        city: artisanForm.city,
        skill: artisanForm.category,
      }, { onConflict: 'email' });

      await supabase.from('profiles')
        .update({ available_as_artisan: true })
        .eq('id', user.id);

      await refreshProfile();

      toast({
        title: 'Profile Complete',
        description: 'You are now registered as an artisan. Welcome to OgaJobs!',
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setArtisanSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: DollarSign,
      title: "Flexible Earnings",
      description: `Set your own rates and work on your schedule. Top artisans earn ${settings.stat_avg_monthly_earnings} monthly.`
    },
    {
      icon: Users,
      title: "Instant Customer Base",
      description: "Connect with thousands of verified customers actively seeking your services."
    },
    {
      icon: Shield,
      title: "Payment Protection",
      description: "Secure escrow system ensures you get paid for completed work. No more chasing payments."
    },
    {
      icon: Star,
      title: "Build Your Reputation",
      description: "Customer reviews and ratings help you build credibility and attract more clients."
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Sign Up & Verify",
      description: "Create your profile and verify your identity, skills, and certifications.",
      time: "5 minutes"
    },
    {
      step: "2", 
      title: "Complete Your Profile",
      description: "Add your skills, experience, work samples, and service areas.",
      time: "15 minutes"
    },
    {
      step: "3",
      title: "Get Approved",
      description: "Our team reviews your application and approves qualified artisans.",
      time: "24-48 hours"
    },
    {
      step: "4",
      title: "Start Earning",
      description: "Browse job requests, submit quotes, and start completing jobs.",
      time: "Immediately"
    }
  ];

  const requirements = [
    "Valid Nigerian ID (NIN, Driver's License, or Passport)",
    "Relevant skills and experience in your trade",
    "Basic tools and equipment for your services",
    "Smartphone with internet access",
    "Professional attitude and reliability"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary-light to-accent py-16 md:py-24 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="bg-white/20 text-white border-white/30 mb-6">
                <TrendingUp className="w-4 h-4 mr-2" />
                Join {settings.stat_artisan_count} Verified Artisans
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Turn Your Skills Into
                <br />
                <span className="text-accent">Steady Income</span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Join Nigeria's largest trusted service platform and connect with customers 
                who need your expertise.
              </p>
              
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="px-8"
                  onClick={() => navigate('/auth?tab=register&role=artisan')}
                >
                  Start Your Application
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-8 text-white border-white hover:bg-white hover:text-primary"
                  onClick={() => navigate('/how-it-works')}
                >
                  Learn How It Works
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Why Choose OgaJobs?
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We've built the platform that puts artisans first. Here's how we help you grow your business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <Card key={index} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                        <p className="text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">{settings.stat_avg_monthly_earnings}</div>
                <div className="text-muted-foreground">Average Monthly Earnings</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">{settings.stat_satisfaction_rating}</div>
                <div className="text-muted-foreground">Artisan Satisfaction</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">{settings.stat_approval_time}</div>
                <div className="text-muted-foreground">Average Approval Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-muted-foreground">Support Available</div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Join Steps */}
        <section className="py-16 md:py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                How to Join
              </h2>
              <p className="text-xl text-muted-foreground">
                Get started in just 4 simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <Card key={index} className="relative">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">
                      {step.step}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {step.time}
                    </Badge>
                  </CardContent>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  What You Need to Get Started
                </h2>
                <p className="text-xl text-muted-foreground">
                  Basic requirements to become a verified artisan
                </p>
              </div>

              <Card className="p-8">
                <div className="space-y-4">
                  {requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span>{requirement}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Join thousands of successful artisans who have transformed their skills into sustainable income.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                variant="secondary" 
                className="px-8"
                onClick={() => navigate('/auth?tab=register&role=artisan')}
              >
                Apply Now - It's Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 justify-center items-center text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>Need help? Call: {settings.support_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{settings.artisan_email}</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Artisan Registration Form */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-lg mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-2">Complete Your Artisan Profile</h2>
          <p className="text-muted-foreground text-center mb-8">
            Tell us your skill and location so we can match you with the right jobs.
          </p>
          <div className="space-y-4 bg-background p-6 rounded-xl shadow-sm border">
            <div className="space-y-2">
              <Label htmlFor="artisan-name">Full Name</Label>
              <Input
                id="artisan-name"
                placeholder="Enter your full name"
                value={artisanForm.fullName}
                onChange={(e) => setArtisanForm(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artisan-phone">Phone Number</Label>
              <Input
                id="artisan-phone"
                placeholder="e.g. 08012345678"
                value={artisanForm.phone}
                onChange={(e) => setArtisanForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Your Skill / Trade</Label>
              <Select
                value={artisanForm.category}
                onValueChange={(val) => setArtisanForm(prev => ({ ...prev, category: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your skill" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Your City</Label>
              <LocationSelector
                value={artisanForm.city}
                onChange={(val) => setArtisanForm(prev => ({ ...prev, city: val }))}
                placeholder="Select your city"
              />
            </div>
            <Button
              className="w-full"
              disabled={artisanSubmitting || !artisanForm.fullName || !artisanForm.category || !artisanForm.city}
              onClick={handleArtisanRegister}
            >
              {artisanSubmitting ? 'Saving...' : 'Complete Registration'}
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}