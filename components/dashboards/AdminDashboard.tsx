'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { donationService, reliefFundService, beneficiaryFundService } from '@/lib/firebase/services/index';
import MetricCard from '@/components/ui/MetricCard';
import DonationVerification from '@/components/admin/DonationVerification';
import FundManagement from '@/components/admin/FundManagement';
import FundDistribution from '@/components/admin/FundDistribution';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import {
  Wallet,
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { formatEther } from 'ethers';

type Tab = 'overview' | 'verification' | 'funds' | 'distribution' | 'analytics';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { address, provider } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [metrics, setMetrics] = useState({
    walletBalance: '0.00',
    totalFundsDistributed: '0.00',
    activeBeneficiaries: 0,
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
      const [donations, funds, beneficiaryFunds] = await Promise.all([
        donationService.getAll().catch(() => []),
        reliefFundService.getAll().catch(() => []),
        beneficiaryFundService.getAll().catch(() => []),
      ]);

      const totalDistributed = funds.reduce(
        (sum, f) => sum + parseFloat(f.distributedAmount.toString()) / 1e18,
        0
      );

      const pendingDonations = donations.filter((d) => d.status === 'pending').length;
      const activeBeneficiaries = beneficiaryFunds.filter(
        (bf) => parseFloat(bf.remainingAmount.toString()) / 1e18 > 0
      ).length;

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
        activeBeneficiaries,
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
    { id: 'verification' as Tab, label: 'Verification', icon: CheckCircle },
    { id: 'funds' as Tab, label: 'Funds', icon: DollarSign },
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
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage donations, funds, and relief distribution</p>
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
              icon={DollarSign}
              subtitle="Total distributed to beneficiaries"
            />
            <MetricCard
              title="Active Beneficiaries"
              value={metrics.activeBeneficiaries}
              icon={Users}
              subtitle="With available funds"
            />
            <MetricCard
              title="Pending Requests"
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
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'verification' && <DonationVerification />}
        {activeTab === 'funds' && <FundManagement />}
        {activeTab === 'distribution' && <FundDistribution />}
        {activeTab === 'analytics' && <AdminAnalytics />}
      </div>
    </div>
  );
}
