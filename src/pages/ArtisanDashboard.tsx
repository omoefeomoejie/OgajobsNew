import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EarningsOverview } from '@/components/dashboard/EarningsOverview';
import { ActiveJobsPanel } from '@/components/dashboard/ActiveJobsPanel';
import { ReputationScore } from '@/components/dashboard/ReputationScore';
import { 
  Briefcase, 
  Star, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Users,
  MessageSquare,
  Camera,
  CheckCircle,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ArtisanDashboard() {
  const { profile } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 overflow-x-hidden">
      {/* Enhanced Header with Capabilities */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-900 dark:text-green-100">Artisan Dashboard</h1>
            <p className="text-green-700 dark:text-green-300 mt-2">Manage your services and grow your business</p>
            <p className="text-sm text-green-600 dark:text-green-400">Welcome back, {profile?.full_name || profile?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/portfolio">
                <Camera className="w-4 h-4 mr-2" />
                Portfolio
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Artisan Capabilities */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm">Accept Jobs</span>
          </div>
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Track Earnings</span>
          </div>
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Users className="w-4 h-4" />
            <span className="text-sm">Build Reputation</span>
          </div>
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Get Verified</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button variant="outline" className="justify-start h-auto p-4" asChild>
          <Link to="/portfolio">
            <div className="text-left">
              <Camera className="w-5 h-5 mb-2" />
              <div className="font-medium">Portfolio</div>
              <div className="text-xs text-muted-foreground">Showcase work</div>
            </div>
          </Link>
        </Button>
        
        <Button variant="outline" className="justify-start h-auto p-4" asChild>
          <Link to="/calendar">
            <div className="text-left">
              <Calendar className="w-5 h-5 mb-2" />
              <div className="font-medium">Availability</div>
              <div className="text-xs text-muted-foreground">Set schedule</div>
            </div>
          </Link>
        </Button>
        
        <Button variant="outline" className="justify-start h-auto p-4" asChild>
          <Link to="/verification">
            <div className="text-left">
              <CheckCircle className="w-5 h-5 mb-2" />
              <div className="font-medium">Verification</div>
              <div className="text-xs text-muted-foreground">Get verified</div>
            </div>
          </Link>
        </Button>
        
        <Button variant="outline" className="justify-start h-auto p-4" asChild>
          <Link to="/messages">
            <div className="text-left">
              <MessageSquare className="w-5 h-5 mb-2" />
              <div className="font-medium">Messages</div>
              <div className="text-xs text-muted-foreground">Client chat</div>
            </div>
          </Link>
        </Button>
      </div>

      {/* Artisan-Specific Features */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <EarningsOverview />
          
          {/* Availability Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Availability Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Available for new jobs</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/calendar">Update Schedule</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ActiveJobsPanel />
        </div>

        <div className="space-y-6">
          <ReputationScore />
          
          {/* Performance Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm font-medium">Complete identity verification</p>
                <p className="text-xs text-muted-foreground">Boost trust score by 30%</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm font-medium">Upload portfolio photos</p>
                <p className="text-xs text-muted-foreground">Increase booking rate by 45%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}