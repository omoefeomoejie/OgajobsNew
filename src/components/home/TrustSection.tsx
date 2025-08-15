import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  CreditCard, 
  Clock, 
  CheckCircle,
  Phone,
  Users,
  Star,
  MapPin,
  ArrowRight
} from 'lucide-react';

export const TrustSection = () => {
  const trustFeatures = [
    {
      icon: Shield,
      title: '5-Layer Verification',
      description: 'Every artisan goes through ID verification, skill assessment, background checks, reference validation, and in-person interviews.',
      features: ['NIN/Voters Card verification', 'Skills certification', 'Background screening', 'Reference checks', 'In-person assessment']
    },
    {
      icon: CreditCard,
      title: 'Secure Payment Protection',
      description: 'Your money is held safely until you confirm the job is done to your satisfaction. No upfront payments, no surprises.',
      features: ['Payment held in escrow', 'Release only when satisfied', 'Dispute resolution', 'Full refund guarantee', 'Transparent pricing']
    },
    {
      icon: Clock,
      title: 'Instant Response Guarantee',
      description: 'Get matched with verified artisans within 5 minutes. Track their location, communicate directly, and get real-time updates.',
      features: ['< 5 minute matching', 'Real-time tracking', 'Direct communication', 'Live job updates', '24/7 availability']
    }
  ];

  const trustStats = [
    {
      icon: Users,
      label: 'Active Artisans',
      value: '5,000+',
      description: 'Verified professionals ready to serve'
    },
    {
      icon: CheckCircle,
      label: 'Success Rate',
      value: '98.5%',
      description: 'Jobs completed to satisfaction'
    },
    {
      icon: Star,
      label: 'Average Rating',
      value: '4.9/5',
      description: 'From thousands of reviews'
    },
    {
      icon: Phone,
      label: 'Response Time',
      value: '< 2 mins',
      description: 'Average customer support response'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Shield className="w-4 h-4 mr-2" />
            Trust Infrastructure
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Built on Trust,
            <br />
            <span className="text-primary">Powered by Technology</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We've eliminated every point of friction and anxiety from hiring services. 
            From verification to payment, every step is designed for your peace of mind.
          </p>
        </div>

        {/* Trust Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {trustFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="relative overflow-hidden border-2 hover:border-primary transition-colors">
                <CardContent className="p-8">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>

                  {/* Features List */}
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Decorative Background */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/5 rounded-full"></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {trustStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="font-semibold mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </div>
            );
          })}
        </div>

        {/* Nigerian Context */}
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-white text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-6">
            Built for Nigeria, By Nigerians
          </h3>
          <p className="text-lg text-white/90 mb-8 max-w-3xl mx-auto">
            We understand the unique challenges of finding reliable service providers in Nigeria. 
            That's why we've built solutions specifically for our market - from POS agent partnerships 
            to NIN verification and mobile money integration.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="flex items-center gap-3 justify-center">
              <MapPin className="w-6 h-6" />
              <span>Lagos • Abuja • Benin City</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Shield className="w-6 h-6" />
              <span>NIN/BVN Verification</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <Phone className="w-6 h-6" />
              <span>Mobile Money Integration</span>
            </div>
          </div>

          <Button variant="secondary" size="lg" className="px-8" onClick={() => window.location.href = '/competitive-advantages'}>
            See How We're Different
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};