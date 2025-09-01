import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookingTimeline } from '@/components/dashboard/BookingTimeline';
import { PaymentOverview } from '@/components/dashboard/PaymentOverview';
import { 
  Search, 
  Star, 
  Shield, 
  Clock, 
  MapPin, 
  Phone,
  CreditCard,
  MessageSquare,
  Calendar,
  Heart,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClientDashboard() {
  const { profile } = useAuth();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Enhanced Header with Capabilities */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100">Client Dashboard</h1>
            <p className="text-blue-700 dark:text-blue-300 mt-2">Book trusted artisans for your projects</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Welcome back, {profile?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/service-directory">
                <Search className="w-4 h-4 mr-2" />
                Find Services
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Client Capabilities */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Verified Artisans</span>
          </div>
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm">24/7 Support</span>
          </div>
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Star className="w-4 h-4" />
            <span className="text-sm">Rate & Review</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button variant="outline" className="justify-start h-auto p-4" asChild>
          <Link to="/service-directory">
            <div className="text-left">
              <Search className="w-5 h-5 mb-2" />
              <div className="font-medium">Find Services</div>
              <div className="text-xs text-muted-foreground">Browse artisans</div>
            </div>
          </Link>
        </Button>
        
        <Button variant="outline" className="justify-start h-auto p-4" asChild>
          <Link to="/my-bookings">
            <div className="text-left">
              <Calendar className="w-5 h-5 mb-2" />
              <div className="font-medium">My Bookings</div>
              <div className="text-xs text-muted-foreground">Track requests</div>
            </div>
          </Link>
        </Button>
        
        <Button variant="outline" className="justify-start h-auto p-4" asChild>
          <Link to="/favorites">
            <div className="text-left">
              <Heart className="w-5 h-5 mb-2" />
              <div className="font-medium">Favorites</div>
              <div className="text-xs text-muted-foreground">Saved artisans</div>
            </div>
          </Link>
        </Button>
        
        <Button variant="outline" className="justify-start h-auto p-4" asChild>
          <Link to="/messages">
            <div className="text-left">
              <MessageSquare className="w-5 h-5 mb-2" />
              <div className="font-medium">Messages</div>
              <div className="text-xs text-muted-foreground">Chat with artisans</div>
            </div>
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Bookings */}
        <div className="space-y-6">
          <BookingTimeline />
        </div>

        {/* Right Column - Payments & Trust */}
        <div className="space-y-6">
          <PaymentOverview />
          
          {/* Trust & Safety Card */}
          <Card>
            <CardHeader>
              <CardTitle>Trust & Safety</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">98%</div>
                  <p className="text-xs text-green-600">Verified Artisans</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">24/7</div>
                  <p className="text-xs text-blue-600">Support Available</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  View Artisan Badges
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Start Dispute Resolution
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Safety Guidelines
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Smart Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Smart Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Rehire Previous Artisan</p>
                <p className="text-xs text-muted-foreground">Book John again for plumbing work</p>
                <Button size="sm" className="mt-2">Quick Book</Button>
              </div>
              
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium">Suggested Service</p>
                <p className="text-xs text-muted-foreground">Based on your history: Water tank cleaning</p>
                <Button size="sm" variant="outline" className="mt-2">Get Quote</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}