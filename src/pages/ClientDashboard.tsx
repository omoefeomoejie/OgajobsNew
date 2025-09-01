import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Search, 
  Calendar, 
  MessageSquare, 
  User, 
  Settings,
  LogOut,
  CreditCard,
  Star,
  Shield,
  Clock,
  MapPin,
  Wrench,
  Heart,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BookingTimeline } from '@/components/dashboard/BookingTimeline';
import { PaymentOverview } from '@/components/dashboard/PaymentOverview';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ClientDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Client Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {profile?.email}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <Button asChild className="h-16 flex flex-col items-center justify-center gap-2">
                  <Link to="/services">
                    <Search className="h-4 w-4" />
                    Find Services
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
                  <Link to="/bookings">
                    <Calendar className="h-4 w-4" />
                    My Bookings
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
                  <Link to="/messages">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
                  <Link to="/favorites">
                    <Heart className="h-4 w-4" />
                    Favorites
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
                  <Link to="/reviews">
                    <Star className="h-4 w-4" />
                    Reviews
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
                  <Link to="/verification">
                    <Shield className="h-4 w-4" />
                    Verification
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
                  <Link to="/profile">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex flex-col items-center justify-center gap-2">
                  <Link to="/settings">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-6">
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
      </div>
    </AppLayout>
  );
}