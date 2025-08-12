import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  DollarSign, 
  Users, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  MapPin,
  Clock,
  Star,
  Shield,
  Zap,
  Network,
  CreditCard,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function POSPartnership() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: DollarSign,
      title: "Extra Income Stream",
      description: "Earn commission on every service booking facilitated through your POS terminal.",
      stats: "Up to ₦50,000+ monthly"
    },
    {
      icon: Users,
      title: "Expand Customer Base",
      description: "Attract new customers who need services beyond traditional POS transactions.",
      stats: "3x more foot traffic"
    },
    {
      icon: Network,
      title: "Community Hub",
      description: "Become the go-to service connection point in your neighborhood.",
      stats: "Trusted local partner"
    },
    {
      icon: Smartphone,
      title: "Tech Integration",
      description: "Seamlessly integrate service bookings with your existing POS operations.",
      stats: "Zero additional hardware"
    }
  ];

  const artisanBenefits = [
    {
      icon: MapPin,
      title: "Local Presence",
      description: "Get discovered by customers in your immediate vicinity through POS agent networks."
    },
    {
      icon: CreditCard,
      title: "Easy Payments",
      description: "Customers can pay for services at their local POS agent, making bookings more accessible."
    },
    {
      icon: Clock,
      title: "Faster Bookings",
      description: "Quick service requests through POS agents who understand local needs."
    },
    {
      icon: Shield,
      title: "Verified Clients",
      description: "Work with pre-verified customers through trusted POS agent relationships."
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Customer Visits POS",
      description: "Customer approaches your POS terminal for regular services or specifically for OgaJobs bookings.",
      actor: "Customer"
    },
    {
      step: "2",
      title: "Service Request",
      description: "You help the customer browse services, select an artisan, and place the booking using our POS integration.",
      actor: "POS Agent"
    },
    {
      step: "3",
      title: "Payment Processing",
      description: "Customer pays for the service through your POS terminal. Funds are held in escrow.",
      actor: "POS Agent"
    },
    {
      step: "4",
      title: "Service Delivery",
      description: "Artisan receives the job notification and completes the service for the customer.",
      actor: "Artisan"
    },
    {
      step: "5",
      title: "Commission Earned",
      description: "You earn your commission once the service is completed and payment is released.",
      actor: "POS Agent"
    }
  ];

  const requirements = [
    "Active POS terminal with reliable internet",
    "Valid business registration or license",
    "Smartphone with OgaJobs agent app",
    "Basic customer service skills",
    "Commitment to helping customers"
  ];

  const features = [
    {
      icon: Zap,
      title: "Instant Integration",
      description: "Quick setup with your existing POS system"
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Track your earnings and commission in real-time"
    },
    {
      icon: Star,
      title: "Quality Assurance",
      description: "All artisans are verified and rated"
    },
    {
      icon: Phone,
      title: "24/7 Support",
      description: "Dedicated support for POS partners"
    }
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
                <Network className="w-4 h-4 mr-2" />
                POS Partnership Program
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Turn Your POS Into a
                <br />
                <span className="text-accent">Service Hub</span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Partner with OgaJobs to offer service bookings through your POS terminal 
                and earn extra income while serving your community.
              </p>
              
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="px-8"
                  onClick={() => navigate('/agent-registration')}
                >
                  Become a POS Partner
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-8 text-white border-white hover:bg-white hover:text-primary"
                  onClick={() => navigate('/how-it-works')}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits for POS Agents */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Benefits for POS Agents
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Transform your POS terminal into a comprehensive service hub and unlock new revenue streams.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <Card key={index} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                        <p className="text-muted-foreground mb-3">{benefit.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {benefit.stats}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits for Artisans */}
        <section className="py-16 md:py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Benefits for Artisans
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Reach customers through trusted POS agents in every neighborhood.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {artisanBenefits.map((benefit, index) => {
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
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                How POS Partnership Works
              </h2>
              <p className="text-xl text-muted-foreground">
                Simple process that benefits customers, POS agents, and artisans
              </p>
            </div>

            <div className="space-y-8">
              {howItWorks.map((step, index) => (
                <Card key={index} className="max-w-4xl mx-auto">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground text-lg">{step.description}</p>
                      </div>
                      <Badge 
                        variant={step.actor === 'POS Agent' ? 'default' : 'secondary'} 
                        className="px-4 py-2"
                      >
                        {step.actor}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Partnership Features
              </h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to succeed as a POS partner
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="text-center p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Partnership Requirements
                </h2>
                <p className="text-xl text-muted-foreground">
                  Simple requirements to join our POS partnership program
                </p>
              </div>

              <Card className="p-8">
                <div className="space-y-4">
                  {requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-lg">{requirement}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">2,000+</div>
                <div className="text-white/80">Active POS Partners</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">₦5M+</div>
                <div className="text-white/80">Commission Paid</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50k+</div>
                <div className="text-white/80">Services Facilitated</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">4.8/5</div>
                <div className="text-white/80">Partner Satisfaction</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Partner With Us?
            </h2>
            <p className="text-xl mb-8 text-muted-foreground max-w-2xl mx-auto">
              Join thousands of POS agents who are earning extra income while serving their communities better.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="px-8"
                onClick={() => navigate('/agent-registration')}
              >
                Apply for Partnership
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8"
                onClick={() => navigate('/help-center')}
              >
                Have Questions?
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 justify-center items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>Partnership Support: +234 803 123 4567</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}