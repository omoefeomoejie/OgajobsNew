import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  HelpCircle, 
  Phone, 
  Mail, 
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Book,
  Shield,
  CreditCard,
  Star,
  Users,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HelpCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const categories = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of using OgaJobs",
      count: 12
    },
    {
      icon: CreditCard,
      title: "Payments & Billing",
      description: "Payment methods, refunds, and billing",
      count: 8
    },
    {
      icon: Shield,
      title: "Safety & Trust",
      description: "Security, verification, and safety tips",
      count: 10
    },
    {
      icon: Star,
      title: "Reviews & Ratings",
      description: "How reviews and ratings work",
      count: 6
    },
    {
      icon: Users,
      title: "For Artisans",
      description: "Artisan-specific help and guidance",
      count: 15
    },
    {
      icon: MessageCircle,
      title: "Communication",
      description: "Messaging and communication features",
      count: 7
    }
  ];

  const faqs = [
    {
      category: "General",
      question: "How does OgaJobs work?",
      answer: "OgaJobs connects you with verified artisans in your area. Simply post your job request, receive quotes from qualified professionals, choose your preferred artisan, and pay securely through our platform."
    },
    {
      category: "Payments",
      question: "When do I pay for services?",
      answer: "Payment is held in escrow when you book a service. The artisan only receives payment after you approve the completed work, ensuring quality and satisfaction."
    },
    {
      category: "Safety",
      question: "How do you verify artisans?",
      answer: "All artisans undergo a comprehensive verification process including identity verification, skill assessment, background checks, and reference validation before joining our platform."
    },
    {
      category: "Booking",
      question: "Can I cancel a booking?",
      answer: "Yes, you can cancel bookings according to our cancellation policy. Cancellations made at least 24 hours before the scheduled service are fully refundable."
    },
    {
      category: "Quality",
      question: "What if I'm not satisfied with the work?",
      answer: "We have a satisfaction guarantee. If you're not happy with the work, contact our support team within 24 hours. We'll work with you and the artisan to resolve the issue or provide a refund."
    },
    {
      category: "Pricing",
      question: "How is pricing determined?",
      answer: "Artisans set their own rates based on their expertise and market conditions. You'll receive multiple quotes for comparison, ensuring competitive and fair pricing."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    searchQuery === '' || 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary-light to-accent py-16 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                How Can We Help?
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Find answers to common questions or get in touch with our support team
              </p>
              
              {/* Search Bar */}
              <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search for help articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 text-base"
                    />
                  </div>
                  <Button size="lg" className="px-8 h-12">
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Get Support</h2>
              <p className="text-muted-foreground">Choose the best way to reach us</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Call Us</h3>
                <p className="text-muted-foreground mb-4">
                  Speak directly with our support team
                </p>
                <p className="font-semibold text-primary mb-4">+234 803 123 4567</p>
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  24/7 Available
                </Badge>
              </Card>

              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
                <p className="text-muted-foreground mb-4">
                  Chat with our support agents in real-time
                </p>
                <Button className="mb-4">Start Chat</Button>
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  Response within minutes
                </Badge>
              </Card>

              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Email Support</h3>
                <p className="text-muted-foreground mb-4">
                  Send us a detailed message
                </p>
                <p className="font-semibold text-primary mb-4">support@ogajobs.com</p>
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  Response within 2 hours
                </Badge>
              </Card>
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
              <p className="text-muted-foreground">Find help articles organized by topic</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                          <IconComponent className="w-6 h-6 text-primary group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {category.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">{category.description}</p>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {category.count} articles
                          </Badge>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Quick answers to common questions</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {filteredFaqs.map((faq, index) => (
                <Card key={index} className="cursor-pointer">
                  <CardHeader 
                    className="pb-4"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {faq.category}
                        </Badge>
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                      </div>
                      {expandedFaq === index ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  
                  {expandedFaq === index && (
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-6">
                  Try different keywords or browse our help categories
                </p>
                <Button onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Still Need Help */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you 24/7.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8">
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Live Chat
              </Button>
              <Button size="lg" variant="outline" className="px-8">
                <Mail className="w-5 h-5 mr-2" />
                Email Support
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}