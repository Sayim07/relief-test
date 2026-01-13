'use client';

import { useState, useEffect } from 'react';
import { donationService, reliefFundService, beneficiaryFundService, receiptService } from '@/lib/firebase/services/index';
import { Donation, ReliefFund, BeneficiaryFund, Receipt } from '@/lib/types/database';
import { TrendingUp, DollarSign, Users, FileText, CheckCircle, Clock, XCircle, Activity } from 'lucide-react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    verifiedDonations: 0,
    pendingDonations: 0,
    rejectedDonations: 0,
    totalFunds: 0,
    distributedFunds: 0,
    activeBeneficiaries: 0,
    totalReceipts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [recentFunds, setRecentFunds] = useState<ReliefFund[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [allDonations, allFunds, allBeneficiaryFunds, allReceipts] = await Promise.all([
        donationService.getByStatus('verified').catch(() => []),
        reliefFundService.getAll().catch(() => []),
        beneficiaryFundService.getActive().catch(() => []),
        receiptService.getByStatus('verified').catch(() => []),
      ]);

      const pending = await donationService.getByStatus('pending').catch(() => []);
      const rejected = await donationService.getByStatus('rejected').catch(() => []);

      const totalAmount = allDonations.reduce((sum, d) => sum + parseFloat(d.amountDisplay || '0'), 0);
      const distributedAmount = allFunds.reduce((sum, f) => sum + parseFloat(f.distributedAmount.toString()) / 1e18, 0);

      setStats({
        totalDonations: allDonations.length + pending.length + rejected.length,
        totalAmount,
        verifiedDonations: allDonations.length,
        pendingDonations: pending.length,
        rejectedDonations: rejected.length,
        totalFunds: allFunds.reduce((sum, f) => sum + parseFloat(f.totalAmount.toString()) / 1e18, 0),
        distributedFunds: distributedAmount,
        activeBeneficiaries: allBeneficiaryFunds.length,
        totalReceipts: allReceipts.length,
      });

      // Get recent items
      const recent = [...allDonations, ...pending].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5);
      setRecentDonations(recent);

      const recentFundsList = allFunds.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5);
      setRecentFunds(recentFundsList);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            ${stats.totalAmount.toFixed(2)}
          </h3>
          <p className="text-sm text-gray-600">Total Donations</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {stats.verifiedDonations}
          </h3>
          <p className="text-sm text-gray-600">Verified Donations</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {stats.pendingDonations}
          </h3>
          <p className="text-sm text-gray-600">Pending Review</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {stats.activeBeneficiaries}
          </h3>
          <p className="text-sm text-gray-600">Active Beneficiaries</p>
        </div>
      </div>

      {/* Fund Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Funds</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalFunds.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Distributed</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.distributedFunds.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Verified Receipts</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalReceipts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Donations</h3>
          {recentDonations.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent donations</p>
          ) : (
            <div className="space-y-3">
              {recentDonations.map((donation) => (
                <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {donation.amountDisplay} {donation.currency}
                    </p>
                    <p className="text-xs text-gray-500">
                      {donation.donorName || donation.donorEmail}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    donation.status === 'verified' ? 'bg-green-100 text-green-800' :
                    donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {donation.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Funds</h3>
          {recentFunds.length === 0 ? (
            <p className="text-gray-500 text-sm">No relief funds created</p>
          ) : (
            <div className="space-y-3">
              {recentFunds.map((fund) => (
                <div key={fund.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-1">{fund.name}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      ${fund.totalAmountDisplay}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      fund.status === 'active' ? 'bg-green-100 text-green-800' :
                      fund.status === 'distributed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {fund.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
