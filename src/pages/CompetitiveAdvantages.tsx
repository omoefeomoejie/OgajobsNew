import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Clock, 
  DollarSign, 
  Star, 
  CheckCircle, 
  Award,
  Lock,
  Users,
  Smartphone,
  TrendingUp,
  Zap,
  Heart
} from 'lucide-react';

export default function CompetitiveAdvantages() {
  const advantages = [
    {
      title: "Trust-First Infrastructure",
      icon: Shield,
      description: "Built from the ground up with trust as the foundation",
      features: [
        "Multi-layer verification (NIN, BVN, Skills, Portfolio)",
        "Escrow payment protection - pay only when satisfied",
        "Real-time background checks",
        "Comprehensive insurance coverage"
      ],
      vs: "Others rely on basic reviews and ratings"
    },
    {
      title: "Nigerian-Centric Design",
      icon: Users,
      description: "Designed specifically for Nigerian market needs",
      features: [
        "Local payment methods (Bank Transfer, Mobile Money)",
        "Nigerian verification systems integration",
        "Yoruba, Igbo, Hausa language support",
        "Understanding of local service culture"
      ],
      vs: "International platforms adapted poorly for Nigeria"
    },
    {
      title: "Instant Matching Technology",
      icon: Zap,
      description: "AI-powered matching in under 5 minutes",
      features: [
        "Smart location-based matching",
        "Skill and availability optimization",
        "Price prediction and fairness",
        "Real-time availability tracking"
      ],
      vs: "Others take hours or days to find matches"
    },
    {
      title: "Transparent Pricing",
      icon: DollarSign,
      description: "No hidden fees, fair pricing for everyone",
      features: [
        "Upfront pricing with no surprises",
        "Price protection guarantees",
        "Bulk booking discounts",
        "Loyalty rewards program"
      ],
      vs: "Competitors charge hidden platform fees"
    },
    {
      title: "Quality Assurance",
      icon: Award,
      description: "Rigorous quality control at every step",
      features: [
        "Pre-work briefings and expectations",
        "In-progress monitoring and support",
        "Post-work quality verification",
        "Continuous artisan development"
      ],
      vs: "Others only handle complaints after problems occur"
    },
    {
      title: "Mobile-First Experience",
      icon: Smartphone,
      description: "Optimized for smartphone usage",
      features: [
        "Offline booking capability",
        "SMS and WhatsApp integration",
        "Low data usage optimization",
        "Works on any phone type"
      ],
      vs: "Competitors built for desktop, mobile afterthought"
    }
  ];

  const trustStats = [
    { label: "Response Time", value: "< 5 mins", description: "Industry average: 2-4 hours" },
    { label: "Success Rate", value: "98.5%", description: "Industry average: 78%" },
    { label: "Payment Security", value: "100%", description: "Escrow protection guarantee" },
    { label: "Customer Satisfaction", value: "4.9/5", description: "Based on verified reviews" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary-light to-accent py-16 md:py-24">
          <div className="container mx-auto px-4 text-center text-white">
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 mb-6">
              <Shield className="w-4 h-4 mr-2" />
              Nigeria's Most Trusted Platform
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Why OgaJobs is 
              <span className="text-accent block">Different</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              We didn't just build another service marketplace. 
              We built Nigeria's first <strong>trust infrastructure</strong> for services.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              {trustStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-white/80 mb-1">{stat.label}</div>
                  <div className="text-xs text-white/60">{stat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Advantages */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The OgaJobs Advantage
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Every feature designed to solve real Nigerian service challenges
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {advantages.map((advantage, index) => {
                const IconComponent = advantage.icon;
                return (
                  <Card key={index} className="h-full">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{advantage.title}</CardTitle>
                        </div>
                      </div>
                      <CardDescription className="text-base">
                        {advantage.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        {advantage.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">
                          <strong>vs Competitors:</strong> {advantage.vs}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust Technology */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Built on Trust Technology
              </h2>
              <p className="text-xl text-muted-foreground mb-12">
                While others rely on ratings, we built comprehensive trust infrastructure
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card>
                  <CardHeader className="text-center">
                    <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
                    <CardTitle>Before Work Starts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Identity verification</li>
                      <li>• Skill certification</li>
                      <li>• Background screening</li>
                      <li>• Insurance confirmation</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                    <CardTitle>During Work</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Real-time progress tracking</li>
                      <li>• Quality checkpoints</li>
                      <li>• Client communication</li>
                      <li>• Issue resolution support</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                    <CardTitle>After Completion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Work quality verification</li>
                      <li>• Payment protection</li>
                      <li>• Warranty coverage</li>
                      <li>• Continuous improvement</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Experience the Difference Today
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands who've discovered stress-free, reliable services
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="px-8" onClick={() => window.location.href = '/'}>
                <TrendingUp className="w-5 h-5 mr-2" />
                Book a Service Now
              </Button>
              <Button size="lg" variant="outline" className="px-8 text-white border-white hover:bg-white hover:text-primary" onClick={() => window.location.href = '/become-artisan'}>
                Become a Verified Artisan
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}