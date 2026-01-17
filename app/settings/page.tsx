'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/lib/middleware/withAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { User, Shield, Tag, Save } from 'lucide-react';
import { userService } from '@/lib/firebase/services';

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const categories = ['Food', 'Medical', 'Shelter', 'Education', 'Water', 'Clothing', 'Other'];

  useEffect(() => {
    if (profile?.reliefCategories) {
      setSelectedCategories(profile.reliefCategories);
    } else if ((profile as any)?.reliefCategory) {
      setSelectedCategories([(profile as any).reliefCategory]);
    }
  }, [profile]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSaveCategories = async () => {
    if (!profile?.uid) return;
    try {
      setIsSaving(true);
      await userService.update(profile.uid, {
        reliefCategories: selectedCategories
      });
      if (refreshProfile) await refreshProfile();
      alert('Categories updated successfully!');
    } catch (error) {
      console.error('Error saving categories:', error);
      alert('Failed to save categories');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Settings</h1>
            <p className="text-gray-400 mt-1 font-medium italic">Manage your profile, security, and operational preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Section */}
            <div className="bg-[#0a0a1a]/50 backdrop-blur-xl rounded-[2.5rem] border border-[#392e4e] p-8 sm:p-10 shadow-2xl space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                  <User className="w-6 h-6 text-blue-500" />
                </div>
                <h2 className="text-2xl font-black text-white">Profile Identity</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profile?.displayName || ''}
                    disabled
                    className="w-full px-5 py-4 border border-[#392e4e] rounded-2xl bg-black/40 text-gray-400 font-bold outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">
                    Verified Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-5 py-4 border border-[#392e4e] rounded-2xl bg-black/40 text-gray-400 font-bold outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">
                    System Role
                  </label>
                  <div className="flex items-center gap-3 px-5 py-4 border border-[#392e4e] rounded-2xl bg-black/40">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-blue-400 font-black uppercase tracking-tighter text-sm">
                      {profile?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Relief Partner Specialties */}
            {profile?.role === 'relief_partner' && (
              <div className="bg-[#0a0a1a]/50 backdrop-blur-xl rounded-[2.5rem] border border-[#392e4e] p-8 sm:p-10 shadow-2xl space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                      <Tag className="w-6 h-6 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white">Relief Expertise</h2>
                  </div>
                  <button
                    onClick={handleSaveCategories}
                    disabled={isSaving}
                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <p className="text-gray-400 text-sm font-medium leading-relaxed italic">
                  Select the categories you specialize in. You will only receive fund transfers matching these categories.
                </p>

                <div className="flex flex-wrap gap-3">
                  {categories.map(cat => (
                    <label
                      key={cat}
                      className={`group flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all cursor-pointer select-none ${selectedCategories.includes(cat)
                          ? 'bg-blue-600/10 border-blue-500/50 text-white shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                          : 'bg-black/40 border-[#392e4e] text-gray-500 hover:border-gray-500'
                        }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                      />
                      <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center ${selectedCategories.includes(cat) ? 'bg-blue-600 border-blue-600' : 'border-[#392e4e] group-hover:border-gray-500'
                        }`}>
                        {selectedCategories.includes(cat) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span className="font-bold text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Security Section */}
            <div className={`bg-[#0a0a1a]/50 backdrop-blur-xl rounded-[2.5rem] border border-[#392e4e] p-8 sm:p-10 shadow-2xl space-y-8 ${profile?.role === 'relief_partner' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                  <Shield className="w-6 h-6 text-blue-500" />
                </div>
                <h2 className="text-2xl font-black text-white">System Security</h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="flex flex-col gap-2 p-6 bg-black/40 border border-[#392e4e] rounded-3xl hover:border-blue-500/30 transition-all text-left group">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-blue-400">Credentials</span>
                  <span className="text-white font-bold">Change Password</span>
                </button>
                <button className="flex flex-col gap-2 p-6 bg-black/40 border border-[#392e4e] rounded-3xl hover:border-blue-500/30 transition-all text-left group">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-blue-400">Authentication</span>
                  <span className="text-white font-bold">Two-Factor Auth</span>
                </button>
                <button className="flex flex-col gap-2 p-6 bg-black/40 border border-[#392e4e] rounded-3xl hover:border-blue-500/30 transition-all text-left group">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-blue-400">Blockchain</span>
                  <span className="text-white font-bold">Connected Wallets</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
