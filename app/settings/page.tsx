'use client';

import { AuthGuard } from '@/lib/middleware/withAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Settings as SettingsIcon, User, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { profile } = useAuth();

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-2">Manage your account settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Profile</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profile?.displayName || ''}
                    disabled
                    className="w-full px-3 py-2 border border-[#392e4e] rounded-lg bg-[#1a1a2e] text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-[#392e4e] rounded-lg bg-[#1a1a2e] text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profile?.role?.replace('_', ' ').toUpperCase() || ''}
                    disabled
                    className="w-full px-3 py-2 border border-[#392e4e] rounded-lg bg-[#1a1a2e] text-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Security</h2>
              </div>
              <div className="space-y-4">
                <button className="w-full px-4 py-2 bg-[#1a1a2e] text-gray-300 rounded-lg hover:bg-[#2a2a3e] transition-colors text-left border border-[#392e4e]">
                  Change Password
                </button>
                <button className="w-full px-4 py-2 bg-[#1a1a2e] text-gray-300 rounded-lg hover:bg-[#2a2a3e] transition-colors text-left border border-[#392e4e]">
                  Two-Factor Authentication
                </button>
                <button className="w-full px-4 py-2 bg-[#1a1a2e] text-gray-300 rounded-lg hover:bg-[#2a2a3e] transition-colors text-left border border-[#392e4e]">
                  Connected Wallets
                </button>
              </div>
            </div>

            <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
              </div>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300">Email Notifications</span>
                  <input type="checkbox" className="rounded border-gray-600 bg-[#1a1a2e] text-blue-600 focus:ring-blue-500" defaultChecked />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300">Transaction Alerts</span>
                  <input type="checkbox" className="rounded border-gray-600 bg-[#1a1a2e] text-blue-600 focus:ring-blue-500" defaultChecked />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300">Weekly Reports</span>
                  <input type="checkbox" className="rounded border-gray-600 bg-[#1a1a2e] text-blue-600 focus:ring-blue-500" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
