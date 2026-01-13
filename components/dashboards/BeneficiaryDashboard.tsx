'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { beneficiaryFundService, categoryService } from '@/lib/firebase/services/index';
import MetricCard from '@/components/ui/MetricCard';
import {
  Wallet,
  TrendingDown,
  FileText,
  AlertCircle,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';
import { formatEther } from 'ethers';

export default function BeneficiaryDashboard() {
  const { profile } = useAuth();
  const { address, provider, isConnected } = useWallet();
  const [metrics, setMetrics] = useState({
    fundsReceived: '0.00',
    remainingAllowance: '0.00',
    spendHistory: 0,
    categoryLimits: 0,
    walletBalance: '0.00',
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address && profile?.uid) {
      loadMetrics();
    }
  }, [isConnected, address, profile]);

  const loadMetrics = async () => {
    if (!profile?.uid) return;

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

      // Load beneficiary funds
      const beneficiaryFunds = await beneficiaryFundService.getByBeneficiary(profile.uid).catch(() => []);
      
      const totalReceived = beneficiaryFunds.reduce(
        (sum, bf) => sum + parseFloat(bf.allocatedAmount.toString()) / 1e18,
        0
      );

      const remaining = beneficiaryFunds.reduce(
        (sum, bf) => sum + parseFloat(bf.remainingAmount.toString()) / 1e18,
        0
      );

      // Load categories
      const categories = await categoryService.getAll().catch(() => []);

      setMetrics({
        fundsReceived: totalReceived.toFixed(2),
        remainingAllowance: remaining.toFixed(2),
        spendHistory: beneficiaryFunds.length,
        categoryLimits: categories.length,
        walletBalance: balance,
        totalTransactions: beneficiaryFunds.length,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h3>
        <p className="text-gray-600">Please connect your MetaMask wallet to view your dashboard.</p>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Beneficiary Dashboard</h1>
        <p className="text-gray-600 mt-2">View your funds, spending limits, and transaction history</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Funds Received"
          value={`$${metrics.fundsReceived}`}
          icon={DollarSign}
          subtitle="Total allocated funds"
        />
        <MetricCard
          title="Remaining Allowance"
          value={`$${metrics.remainingAllowance}`}
          icon={Wallet}
          subtitle="Available to spend"
        />
        <MetricCard
          title="Spend History"
          value={metrics.spendHistory}
          icon={ShoppingCart}
          subtitle="Total transactions"
        />
        <MetricCard
          title="Category Limits"
          value={metrics.categoryLimits}
          icon={FileText}
          subtitle="Active spending categories"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Wallet Balance"
          value={`${metrics.walletBalance} ETH`}
          icon={Wallet}
          subtitle="Connected wallet"
        />
        <MetricCard
          title="Total Transactions"
          value={metrics.totalTransactions}
          icon={FileText}
          subtitle="All time"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Spend Funds
          </button>
          <button className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            Request More Funds
          </button>
          <button className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            View Transaction History
          </button>
        </div>
      </div>
    </div>
  );
}
