'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { reliefFundService, reliefPartnerAssignmentService, userService, donationService, reliefRequestService } from '@/lib/firebase/services/index';
import MetricCard from '@/components/ui/MetricCard';
import DonationVerification from '@/components/admin/DonationVerification';
import FundManagement from '@/components/admin/FundManagement';
import FundDistribution from '@/components/admin/FundDistribution';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import {
  Wallet,
  IndianRupee,
  Users,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { formatEther } from 'ethers';

type Tab = 'overview' | 'verification' | 'partners' | 'funds' | 'distribution' | 'analytics';

import PartnerVerification from '@/components/admin/PartnerVerification';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { address, provider } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [metrics, setMetrics] = useState({
    walletBalance: '0.00',
    totalFundsDistributed: '0.00',
    activePartners: 0,
    pendingRequests: 0,
    totalTransactions: 0,
    lastActivity: 'Never',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [address, provider]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      // Load wallet balance
      let balance = '0.00';
      if (provider && address) {
        try {
          const balanceWei = await provider.getBalance(address);
          balance = parseFloat(formatEther(balanceWei)).toFixed(4);
        } catch (error) {
          console.error('Error loading balance:', error);
        }
      }

      // Load donation and fund data
      const [donations, funds] = await Promise.all([
        donationService.getAll().catch(() => []),
        reliefFundService.getAll().catch(() => []),
      ]);
      const allUsers = await userService.getAll();
      const verifiedPartners = allUsers.filter(u => u.role === 'relief_partner' && u.verified);

      const totalDistributed = funds.reduce(
        (sum, f) => sum + parseFloat(f.distributedAmount.toString()) / 1e18,
        0
      );

      const pendingDonations = donations.filter((d) => d.status === 'pending').length;

      // Calculate active partners (those with assignments)
      const assignments = await reliefPartnerAssignmentService.getAll().catch(() => []);
      const activePartners = new Set(assignments.filter(a => a.status === 'active').map(a => a.reliefPartnerId)).size;

      // Get last activity
      const allActivities = [
        ...donations.map((d) => d.createdAt),
        ...funds.map((f) => f.createdAt),
      ];
      const lastActivity = allActivities.length > 0
        ? new Date(Math.max(...allActivities.map((d) => d.getTime())))
        : null;

      setMetrics({
        walletBalance: balance,
        totalFundsDistributed: totalDistributed.toFixed(2),
        activePartners: activePartners,
        pendingRequests: pendingDonations,
        totalTransactions: donations.length + funds.length,
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
    { id: 'funds' as Tab, label: 'Funds', icon: IndianRupee },
    { id: 'distribution' as Tab, label: 'Distribution', icon: ArrowRight },
    { id: 'analytics' as Tab, label: 'Analytics', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2 font-light">Manage donations, partners, funds, and relief distribution</p>
      </div>

      {/* Overview Tab - Metrics Grid */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Wallet Balance"
              value={`${metrics.walletBalance} ETH`}
              icon={Wallet}
              subtitle="Connected wallet"
            />
            <MetricCard
              title="Funds Distributed"
              value={`$${metrics.totalFundsDistributed}`}
              icon={IndianRupee}
              subtitle="Total distributed to partners"
            />
            <MetricCard
              title="Active Partners"
              value={metrics.activePartners}
              icon={Users}
              subtitle="With active operations"
            />
            <MetricCard
              title="Pending Donations"
              value={metrics.pendingRequests}
              icon={Clock}
              subtitle="Awaiting verification"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Total Transactions"
              value={metrics.totalTransactions}
              icon={FileText}
              subtitle="All time"
            />
            <MetricCard
              title="Last Activity"
              value={metrics.lastActivity}
              icon={TrendingUp}
              subtitle="Most recent transaction"
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
        {activeTab === 'funds' && <FundManagement />}
        {activeTab === 'distribution' && <FundDistribution />}
        {activeTab === 'analytics' && <AdminAnalytics />}
      </div>
    </div>
  );
}
