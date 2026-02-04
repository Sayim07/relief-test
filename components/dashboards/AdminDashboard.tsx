'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { reliefPartnerAssignmentService, userService, donationService } from '@/lib/firebase/services/index';
import MetricCard from '@/components/ui/MetricCard';
import Loader from '@/components/ui/Loader';
import DonationVerification from '@/components/admin/DonationVerification';
import PartnerVerification from '@/components/admin/PartnerVerification';
import {
  Users,
  CheckCircle,
  Clock,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

type Tab = 'overview' | 'verification' | 'partners';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [metrics, setMetrics] = useState({
    activePartners: 0,
    pendingRequests: 0,
    lastActivity: 'Never',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      // Load data
      const donations = await donationService.getAll().catch(() => []);
      const allUsers = await userService.getAll();

      const pendingDonations = donations.filter((d) => d.status === 'pending').length;

      // Calculate active partners (those with assignments)
      const assignments = await reliefPartnerAssignmentService.getAll().catch(() => []);
      const activePartners = new Set(assignments.filter(a => a.status === 'active').map(a => a.reliefPartnerId)).size;

      // Get last activity
      const allActivities = [
        ...donations.map((d) => d.createdAt),
      ];
      const lastActivity = allActivities.length > 0
        ? new Date(Math.max(...allActivities.map((d) => d.getTime())))
        : null;

      setMetrics({
        activePartners: activePartners,
        pendingRequests: pendingDonations,
        lastActivity: lastActivity
          ? new Date(lastActivity).toLocaleDateString()
          : 'Never',
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
    { id: 'verification' as Tab, label: 'Donations', icon: CheckCircle },
    { id: 'partners' as Tab, label: 'Partners', icon: Users },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2 font-light">Manage donations and verify relief partners</p>
      </div>

      {/* Overview Tab - Metrics Grid */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Pending Donations"
              value={metrics.pendingRequests}
              icon={Clock}
              subtitle="Awaiting verification"
            />
            <MetricCard
              title="Active Partners"
              value={metrics.activePartners}
              icon={Users}
              subtitle="With active operations"
            />
            <MetricCard
              title="Last Activity"
              value={metrics.lastActivity}
              icon={TrendingUp}
              subtitle="Most recent activity"
            />
          </div>
        </>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-white/10">
        <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-4 border-b-2 font-bold text-[10px] uppercase tracking-[0.2em] transition-all
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-500 bg-blue-500/5'
                    : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'verification' && <DonationVerification />}
        {activeTab === 'partners' && <PartnerVerification />}
      </div>
    </div>
  );
}
