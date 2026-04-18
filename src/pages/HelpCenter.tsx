import { PageNavigation } from '@/components/layout/PageNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Phone, Mail, Search, HelpCircle, Book, Users } from 'lucide-react';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';

export default function HelpCenter() {
  const { settings } = usePlatformSettings();
  const faqs = [
    {
      question: "How do I book an artisan?",
      answer: "Simply browse our service categories, select an artisan based on ratings and reviews, and click 'Book Now'. You can specify your requirements and schedule a convenient time."
    },
    {
      question: "How does payment work?",
      answer: "We use an escrow system - your payment is held securely until you're satisfied with the work. Only then is the payment released to the artisan."
    },
    {
      question: "What if I'm not satisfied with the work?",
      answer: "If you're not satisfied, you can raise a dispute within 24 hours. Our support team will review and help resolve the issue fairly."
    },
    {
      question: "How are artisans verified?",
      answer: "All artisans go through a comprehensive verification process including ID verification, skill assessment, and background checks."
    },
    {
      question: "Can I cancel a booking?",
      answer: "Yes, you can cancel a booking up to 2 hours before the scheduled time. Cancellation policies may vary based on the service type."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageNavigation title="Help Center" />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">How can we help you?</h1>
          <p className="text-lg text-muted-foreground mb-8">Find answers to common questions or get in touch with our support team</p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search for help..." 
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <MessageCircle className="w-8 h-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Live Chat</CardTitle>
              <CardDescription>Get instant help from our support team</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start Chat</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Phone className="w-8 h-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Call Us</CardTitle>
              <CardDescription>Speak directly with our support team</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">{settings.support_phone}</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Mail className="w-8 h-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Email Support</CardTitle>
              <CardDescription>Send us your questions via email</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">{settings.support_email}</Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <HelpCircle className="w-6 h-6 text-primary mb-2" />
              <CardTitle className="text-lg">Getting Started</CardTitle>
              <CardDescription>Learn the basics of using OgaJobs</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Book className="w-6 h-6 text-primary mb-2" />
              <CardTitle className="text-lg">Booking Services</CardTitle>
              <CardDescription>How to find and book artisans</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Users className="w-6 h-6 text-primary mb-2" />
              <CardTitle className="text-lg">For Artisans</CardTitle>
              <CardDescription>Guide for service providers</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-16 p-8 bg-muted rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Our support team is here to help you 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Live Chat
            </Button>
            <Button variant="outline" size="lg">
              <Mail className="w-4 h-4 mr-2" />
              Email Us
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}