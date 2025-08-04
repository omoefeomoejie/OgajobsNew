import React, { useState, useEffect } from 'react';
import { Users, DollarSign, UserPlus, TrendingUp, Eye, Search, Filter, Plus, MoreVertical, Check, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import OnboardingModal from './OnboardingModal';

const POSAgentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [agentStats, setAgentStats] = useState({
    totalArtisans: 0,
    monthlyCommission: 0,
    pendingCommission: 0,
    totalEarnings: 0
  });
  const [recentArtisans, setRecentArtisans] = useState([]);
  const [commissionHistory, setCommissionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock data for now - will be replaced with real Supabase data later
      setAgentStats({
        totalArtisans: 47,
        monthlyCommission: 125400,
        pendingCommission: 23600,
        totalEarnings: 892300
      });

      setRecentArtisans([
        { id: 1, name: 'Ibrahim Musa', service: 'Plumbing', status: 'pending', joinDate: '2024-08-01', commission: 5000 },
        { id: 2, name: 'Fatima Hassan', service: 'Tailoring', status: 'verified', joinDate: '2024-07-28', commission: 3500 },
        { id: 3, name: 'John Okoro', service: 'Electrical', status: 'active', joinDate: '2024-07-25', commission: 7200 },
        { id: 4, name: 'Amina Bello', service: 'Catering', status: 'pending', joinDate: '2024-08-02', commission: 2800 },
      ]);

      setCommissionHistory([
        { month: 'July 2024', amount: 89200, artisans: 12, status: 'paid' },
        { month: 'June 2024', amount: 76800, artisans: 10, status: 'paid' },
        { month: 'May 2024', amount: 92500, artisans: 14, status: 'paid' },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    const icons = {
      active: <Check className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />,
      verified: <Check className="w-3 h-3" />,
      rejected: <AlertCircle className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleOnboardingSuccess = () => {
    loadDashboardData(); // Refresh data after successful onboarding
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">POS Agent Dashboard</h1>
            <p className="text-gray-600">Manage your artisan network and track commissions</p>
          </div>
          <button 
            onClick={() => setShowOnboardingModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Onboard Artisan
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Artisans</p>
                <p className="text-2xl font-bold text-gray-900">{agentStats.totalArtisans}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Commission</p>
                <p className="text-2xl font-bold text-gray-900">₦{agentStats.monthlyCommission.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Commission</p>
                <p className="text-2xl font-bold text-gray-900">₦{agentStats.pendingCommission.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₦{agentStats.totalEarnings.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {['overview', 'artisans', 'commissions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-medium border-b-2 capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {recentArtisans.slice(0, 3).map((artisan) => (
                      <div key={artisan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {artisan.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{artisan.name}</p>
                            <p className="text-sm text-gray-600">{artisan.service}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={artisan.status} />
                          <p className="text-sm text-gray-600 mt-1">₦{artisan.commission.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'artisans' && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search artisans..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>

                <div className="space-y-3">
                  {recentArtisans.map((artisan) => (
                    <div key={artisan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {artisan.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium">{artisan.name}</h4>
                          <p className="text-sm text-gray-600">{artisan.service}</p>
                          <p className="text-xs text-gray-500">Joined {artisan.joinDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <StatusBadge status={artisan.status} />
                          <p className="text-sm text-gray-600 mt-1">₦{artisan.commission.toLocaleString()}</p>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'commissions' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Commission History</h3>
                <div className="space-y-3">
                  {commissionHistory.map((commission, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{commission.month}</h4>
                        <p className="text-sm text-gray-600">{commission.artisans} artisans active</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₦{commission.amount.toLocaleString()}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="w-3 h-3" />
                          Paid
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showOnboardingModal && (
        <OnboardingModal 
          onClose={() => setShowOnboardingModal(false)}
          onSuccess={handleOnboardingSuccess}
        />
      )}
    </div>
  );
};

export default POSAgentDashboard;
