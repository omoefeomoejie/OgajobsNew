import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar, MessageSquare, TrendingUp, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BookingTimeline } from '@/components/dashboard/BookingTimeline';
import { PaymentOverview } from '@/components/dashboard/PaymentOverview';

export default function ClientDashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Book, track, and trust - your control center for all services
          </p>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get things done faster</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button asChild className="h-16 flex-col">
              <Link to="/services">
                <Search className="h-6 w-6 mb-2" />
                Book Service
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 flex-col">
              <Link to="/bookings">
                <Calendar className="h-6 w-6 mb-2" />
                Track Jobs
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 flex-col">
              <Link to="/messages">
                <MessageSquare className="h-6 w-6 mb-2" />
                Messages
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 flex-col">
              <Link to="/favorites">
                <TrendingUp className="h-6 w-6 mb-2" />
                Favorites
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <CardDescription>Your protection and peace of mind</CardDescription>
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
                <Button variant="outline" className="w-full justify-start">
                  View Artisan Badges
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Start Dispute Resolution
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Safety Guidelines
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Experience Enhancing Features */}
          <Card>
            <CardHeader>
              <CardTitle>Smart Suggestions</CardTitle>
              <CardDescription>Personalized recommendations for you</CardDescription>
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