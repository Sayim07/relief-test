'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DonationVerification from './admin/DonationVerification';
import FundManagement from './admin/FundManagement';
import FundDistribution from './admin/FundDistribution';
import AdminAnalytics from './admin/AdminAnalytics';
import {
  CheckCircle,
  IndianRupee,
  ArrowRight,
  BarChart3,
  Users,
  Wallet
} from 'lucide-react';

type Tab = 'verification' | 'funds' | 'distribution' | 'analytics';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('verification');

  const tabs = [
    { id: 'verification' as Tab, label: 'Donation Verification', icon: CheckCircle },
    { id: 'funds' as Tab, label: 'Fund Management', icon: IndianRupee },
    { id: 'distribution' as Tab, label: 'Fund Distribution', icon: ArrowRight },
    { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome, {profile?.displayName || 'Admin'}!
            </h2>
            <p className="text-blue-100">
              Manage donations, funds, and relief distribution from this dashboard
            </p>
          </div>
          <div className="hidden md:block">
            <Users className="w-16 h-16 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-[#0a0a1a] rounded-lg shadow-lg border border-[#392e4e] mb-6">
        <div className="flex border-b border-[#392e4e] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-500 bg-blue-900/20'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a2e]'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-[#0a0a1a] rounded-lg shadow-lg p-6 border border-[#392e4e]">
        {activeTab === 'verification' && <DonationVerification />}
        {activeTab === 'funds' && <FundManagement />}
        {activeTab === 'distribution' && <FundDistribution />}
        {activeTab === 'analytics' && <AdminAnalytics />}
      </div>
    </div>
  );
}
