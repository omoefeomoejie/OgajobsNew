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
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg mb-6">
        <h1 className="text-3xl font-bold text-green-900 dark:text-green-100">Artisan Dashboard</h1>
        <p className="text-green-700 dark:text-green-300 mt-2">Manage your services and grow your business</p>
        <p className="text-sm text-green-600 dark:text-green-400">Welcome back, {profile?.email}</p>
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