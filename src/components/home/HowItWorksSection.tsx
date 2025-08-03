import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Users, 
  MessageSquare, 
  CreditCard,
  CheckCircle,
  Shield,
  Clock,
  ArrowRight,
  Smartphone,
  Bell
} from 'lucide-react';

export const HowItWorksSection = () => {
  const clientSteps = [
    {
      step: 1,
      icon: Search,
      title: 'Describe Your Need',
      description: 'Tell us what service you need, where, and when. Be as specific as possible.',
      details: ['Choose service category', 'Add job description', 'Set your location', 'Pick preferred time'],
      color: 'bg-blue-500'
    },
    {
      step: 2,
      icon: Users,
      title: 'Get Matched Instantly',
      description: 'Our AI instantly matches you with 3-5 verified artisans in your area.',
      details: ['Instant matching', 'View profiles & ratings', 'See pricing estimates', 'Check availability'],
      color: 'bg-primary'
    },
    {
      step: 3,
      icon: MessageSquare,
      title: 'Choose & Communicate',
      description: 'Review profiles, chat directly with artisans, and select the best fit.',
      details: ['Compare quotes', 'Chat in real-time', 'Check reviews', 'Schedule appointment'],
      color: 'bg-accent'
    },
    {
      step: 4,
      icon: CreditCard,
      title: 'Secure Payment',
      description: 'Pay only when satisfied. Your money is held safely until job completion.',
      details: ['Payment held in escrow', 'Track job progress', 'Rate the service', 'Release payment'],
      color: 'bg-success'
    }
  ];

  const artisanSteps = [
    {
      step: 1,
      icon: Smartphone,
      title: 'Get Verified',
      description: 'Complete our 5-layer verification process to join our trusted network.',
      details: ['Upload ID documents', 'Skills assessment', 'Background check', 'Reference verification'],
      color: 'bg-trust'
    },
    {
      step: 2,
      icon: Bell,
      title: 'Receive Job Alerts',
      description: 'Get notified instantly when clients need your services in your area.',
      details: ['Smart job matching', 'Location-based alerts', 'Service preferences', 'Instant notifications'],
      color: 'bg-warning'
    },
    {
      step: 3,
      icon: MessageSquare,
      title: 'Submit Proposals',
      description: 'Send quotes, communicate with clients, and win the job.',
      details: ['Submit competitive quotes', 'Showcase your work', 'Chat with clients', 'Build relationships'],
      color: 'bg-primary'
    },
    {
      step: 4,
      icon: CheckCircle,
      title: 'Complete & Get Paid',
      description: 'Do great work, get rated, and receive payment instantly upon completion.',
      details: ['Complete the job', 'Get client approval', 'Receive instant payment', 'Build your reputation'],
      color: 'bg-success'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Clock className="w-4 h-4 mr-2" />
            Simple Process
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            How OgaJobs Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We've made hiring services as simple as ordering food. Here's how it works for both clients and artisans.
          </p>
        </div>

        {/* Client Journey */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">For Clients</h3>
            <p className="text-muted-foreground">Get your job done in 4 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {clientSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Connection Line */}
                  {index < clientSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-1 bg-gradient-to-r from-muted to-transparent z-0"></div>
                  )}
                  
                  <Card className="relative z-10 border-2 hover:border-primary transition-colors">
                    <CardContent className="p-6 text-center">
                      {/* Step Number & Icon */}
                      <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 relative`}>
                        <IconComponent className="w-8 h-8 text-white" />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-sm font-bold">
                          {step.step}
                        </div>
                      </div>

                      {/* Content */}
                      <h4 className="text-lg font-bold mb-3">{step.title}</h4>
                      <p className="text-muted-foreground text-sm mb-4">{step.description}</p>

                      {/* Details */}
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-success" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Artisan Journey */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">For Artisans</h3>
            <p className="text-muted-foreground">Start earning with our trusted platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {artisanSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Connection Line */}
                  {index < artisanSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-1 bg-gradient-to-r from-muted to-transparent z-0"></div>
                  )}
                  
                  <Card className="relative z-10 border-2 hover:border-primary transition-colors">
                    <CardContent className="p-6 text-center">
                      {/* Step Number & Icon */}
                      <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 relative`}>
                        <IconComponent className="w-8 h-8 text-white" />
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-sm font-bold">
                          {step.step}
                        </div>
                      </div>

                      {/* Content */}
                      <h4 className="text-lg font-bold mb-3">{step.title}</h4>
                      <p className="text-muted-foreground text-sm mb-4">{step.description}</p>

                      {/* Details */}
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-success" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust Guarantee Section */}
        <div className="bg-muted/50 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">100% Satisfaction Guarantee</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              If you're not completely satisfied with the service, we'll make it right. 
              Your money is protected every step of the way.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8">
              Book a Service Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              Become an Artisan
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};