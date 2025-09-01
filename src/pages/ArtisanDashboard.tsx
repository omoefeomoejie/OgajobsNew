import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EarningsOverview } from '@/components/dashboard/EarningsOverview';
import { ActiveJobsPanel } from '@/components/dashboard/ActiveJobsPanel';
import { ReputationScore } from '@/components/dashboard/ReputationScore';

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
  const { profile } = useAuth();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Artisan Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.email}</p>
      </div>

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
  );
}