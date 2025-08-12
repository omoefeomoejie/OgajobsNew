import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  Eye,
  Phone,
  Camera,
  CreditCard,
  Users,
  MapPin,
  Clock,
  Star,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SafetyGuidelines() {
  const navigate = useNavigate();

  const safetyFeatures = [
    {
      icon: Shield,
      title: "Identity Verification",
      description: "All artisans undergo comprehensive identity verification including NIN, BVN, and address confirmation."
    },
    {
      icon: Eye,
      title: "Background Checks",
      description: "We conduct thorough background screenings and reference checks for all service providers."
    },
    {
      icon: Lock,
      title: "Secure Payments",
      description: "Your payments are protected with bank-level encryption and held in escrow until work is completed."
    },
    {
      icon: Star,
      title: "Review System",
      description: "Transparent rating and review system helps you make informed decisions based on real experiences."
    }
  ];

  const clientSafetyTips = [
    {
      icon: CheckCircle,
      title: "Verify Before Booking",
      tips: [
        "Check artisan's profile, ratings, and reviews",
        "Verify their identity badge and certifications",
        "Read recent reviews from other customers",
        "Ensure they have insurance coverage"
      ]
    },
    {
      icon: MapPin,
      title: "During the Service",
      tips: [
        "Be present when the artisan arrives",
        "Verify their identity matches the profile",
        "Keep the work area well-lit and accessible",
        "Take photos of work progress if needed"
      ]
    },
    {
      icon: CreditCard,
      title: "Payment Safety",
      tips: [
        "Never pay cash or outside the platform",
        "Only release payment after work is completed",
        "Report any requests for upfront payment",
        "Use the escrow system for protection"
      ]
    },
    {
      icon: Phone,
      title: "Communication",
      tips: [
        "Keep all communication on the platform",
        "Share your contact details cautiously",
        "Report inappropriate behavior immediately",
        "Save important conversations"
      ]
    }
  ];

  const artisanSafetyTips = [
    {
      icon: Users,
      title: "Client Interaction",
      tips: [
        "Confirm client identity and location",
        "Maintain professional boundaries",
        "Report suspicious client behavior",
        "Trust your instincts about safety"
      ]
    },
    {
      icon: Camera,
      title: "Work Documentation",
      tips: [
        "Take before and after photos",
        "Document any existing issues",
        "Get client approval in writing",
        "Keep detailed work records"
      ]
    },
    {
      icon: Clock,
      title: "Time Management",
      tips: [
        "Arrive at scheduled times",
        "Inform clients of any delays",
        "Set clear work boundaries",
        "Complete work within agreed timeframe"
      ]
    },
    {
      icon: FileText,
      title: "Legal Protection",
      tips: [
        "Use written agreements for all work",
        "Understand your insurance coverage",
        "Keep proper work licenses updated",
        "Follow local safety regulations"
      ]
    }
  ];

  const reportingSteps = [
    {
      step: "1",
      title: "Document the Issue",
      description: "Take screenshots, photos, or notes about the safety concern or incident."
    },
    {
      step: "2",
      title: "Report Immediately",
      description: "Contact our safety team through the app, website, or emergency hotline."
    },
    {
      step: "3",
      title: "Provide Details",
      description: "Share all relevant information including user profiles, messages, and evidence."
    },
    {
      step: "4",
      title: "Follow Up",
      description: "Our team will investigate and keep you updated on actions taken."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary-light to-accent py-16 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="bg-white/20 text-white border-white/30 mb-6">
                <Shield className="w-4 h-4 mr-2" />
                Your Safety is Our Priority
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Safety Guidelines
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Comprehensive safety measures and guidelines to ensure secure interactions for everyone on OgaJobs
              </p>
            </div>
          </div>
        </section>

        {/* Safety Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                How We Keep You Safe
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Multiple layers of security and verification to protect all users
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {safetyFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Client Safety Guidelines */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Safety Tips for Clients
              </h2>
              <p className="text-xl text-muted-foreground">
                Essential guidelines to ensure safe service experiences
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {clientSafetyTips.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {category.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Artisan Safety Guidelines */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Safety Tips for Artisans
              </h2>
              <p className="text-xl text-muted-foreground">
                Best practices to protect yourself while providing services
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {artisanSafetyTips.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {category.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Warning Signs */}
        <section className="py-16 bg-red-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4 text-red-900">
                  Warning Signs to Watch For
                </h2>
                <p className="text-red-700">
                  Be alert to these red flags and report them immediately
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-900">For Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-red-800">
                      <li>• Requests for payment outside the platform</li>
                      <li>• Artisan arrives without proper identification</li>
                      <li>• Demands for upfront cash payments</li>
                      <li>• Aggressive or inappropriate behavior</li>
                      <li>• Refusal to show credentials or insurance</li>
                      <li>• Pressure to make immediate decisions</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-900">For Artisans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-red-800">
                      <li>• Client refuses to verify identity</li>
                      <li>• Requests for personal banking details</li>
                      <li>• Inappropriate personal questions or behavior</li>
                      <li>• Unsafe working conditions</li>
                      <li>• Pressure to work outside platform terms</li>
                      <li>• Reluctance to discuss project details clearly</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Reporting Process */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                How to Report Safety Concerns
              </h2>
              <p className="text-xl text-muted-foreground">
                Quick and easy reporting process for any safety issues
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {reportingSteps.map((step, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 mx-auto">
                      {step.step}
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-red-900 mb-3">
                  Emergency Situations
                </h3>
                <p className="text-red-800 mb-4">
                  If you're in immediate danger, call local emergency services first
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <Button variant="destructive" size="lg">
                    <Phone className="w-5 h-5 mr-2" />
                    Emergency: 199
                  </Button>
                  <Button variant="outline" size="lg">
                    <Phone className="w-5 h-5 mr-2" />
                    OgaJobs Safety: +234 803 123 4567
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Questions About Safety?
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Our safety team is available 24/7 to address your concerns and ensure a secure experience.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="px-8"
                onClick={() => navigate('/help-center')}
              >
                <Shield className="w-5 h-5 mr-2" />
                Contact Safety Team
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 text-white border-white hover:bg-white hover:text-primary"
                onClick={() => navigate('/disputes')}
              >
                Report an Issue
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}