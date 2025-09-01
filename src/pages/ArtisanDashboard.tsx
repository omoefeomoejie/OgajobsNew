import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, 
  DollarSign, 
  Star, 
  Calendar,
  MessageSquare,
  Settings,
  TrendingUp,
  Award,
  Search,
  LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EarningsOverview } from '@/components/dashboard/EarningsOverview';
import { ActiveJobsPanel } from '@/components/dashboard/ActiveJobsPanel';
import { ReputationScore } from '@/components/dashboard/ReputationScore';
import { AppLayout } from '@/components/layout/AppLayout';

interface Assignment {
  id: string;
  work_type: string;
  preferred_date: string;
  city: string;
  client_email: string;
  artisan_email: string;
  statcreated_atus: string;
}

export default function ArtisanDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Artisan Dashboard</h1>
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

        <div className="p-6 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Power features for your business</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Button asChild className="h-16 flex-col">
                  <Link to="/bookings">
                    <Search className="h-6 w-6 mb-2" />
                    Find Jobs
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col">
                  <Link to="/calendar">
                    <Calendar className="h-6 w-6 mb-2" />
                    Calendar
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col">
                  <Link to="/messages">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    Messages
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col">
                  <Link to="/portfolio">
                    <Award className="h-6 w-6 mb-2" />
                    Portfolio
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col">
                  <Link to="/profile">
                    <Settings className="h-6 w-6 mb-2" />
                    Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Earnings */}
            <div className="space-y-6">
              <EarningsOverview />
            </div>

            {/* Middle Column - Jobs */}
            <div className="space-y-6">
              <ActiveJobsPanel />
            </div>

            {/* Right Column - Reputation */}
            <div className="space-y-6">
              <ReputationScore />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}