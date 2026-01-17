'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/lib/middleware/withAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { userService } from '@/lib/firebase/services';
import type { UserProfile } from '@/lib/types/user';
import {
  Users,
  ShieldCheck,
  AlertCircle,
  Search,
  Building2,
  Wallet,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Key
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
  const [partners, setPartners] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unverified' | 'verified'>('unverified');
  const [searchTerm, setSearchTerm] = useState('');

  // Verification Modal State
  const [verifyingPartner, setVerifyingPartner] = useState<UserProfile | null>(null);
  const [partnerKey, setPartnerKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await userService.getByRole('relief_partner');
      setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyingPartner || !partnerKey) return;

    try {
      setIsVerifying(true);
      await userService.verify(verifyingPartner.uid, partnerKey);
      setVerifyingPartner(null);
      setPartnerKey('');
      await loadPartners();
    } catch (error) {
      console.error('Error verifying partner:', error);
      alert('Failed to verify partner');
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredPartners = partners.filter(p => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unverified' && !p.verified) ||
      (filter === 'verified' && p.verified);

    const matchesSearch =
      p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white">Admin Dashboard</h1>
              <p className="text-gray-400 mt-1 font-medium italic underline decoration-blue-500/30">Partner Verification Hub</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search NGOs or organizations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-[#0a0a1a] border border-[#392e4e] rounded-2xl pl-12 pr-6 py-3 text-sm focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-white outline-none w-full sm:w-64"
                />
              </div>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as any)}
                className="bg-[#0a0a1a] border border-[#392e4e] rounded-2xl px-6 py-3 text-sm text-white font-black outline-none cursor-pointer hover:border-[#4a3e5e] transition-colors"
              >
                <option value="unverified">Pending Audit</option>
                <option value="verified">Authorized Key Only</option>
                <option value="all">Global Roster</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-[0_0_20px_rgba(37,99,235,0.2)]" />
              <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Accessing Secure Records...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredPartners.map(partner => (
                <div
                  key={partner.uid}
                  className="bg-[#0a0a1a]/50 backdrop-blur-xl border border-[#392e4e] p-8 rounded-[2rem] hover:border-blue-500/30 transition-all group relative overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-8">
                    <div className="space-y-6 flex-1">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${partner.verified ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-yellow-500 animate-pulse'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {partner.verified ? 'Authenticated Access' : 'Awaiting Audit'}
                          </span>
                          {partner.verified && partner.verificationTimestamp && (
                            <span className="text-[9px] text-gray-600 font-bold">
                              Authorized on {format(partner.verificationTimestamp, 'PPP')}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <h3 className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors">
                            {partner.displayName || 'Relief Agent'}
                          </h3>
                          <p className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                            <Building2 className="w-4 h-4 text-blue-500/50" /> {partner.organization || 'Independent Enterprise'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <Wallet className="w-3 h-3 text-blue-500" /> Settled Wallet
                            </p>
                            <div className="bg-black/50 p-3 rounded-xl border border-[#392e4e] font-mono text-[10px] text-gray-300 break-all">
                              {partner.walletAddress || 'No Wallet Synced'}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <Tag className="w-3 h-3 text-blue-500" /> Authorized Roles
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {partner.reliefCategories && partner.reliefCategories.length > 0 ? (
                                partner.reliefCategories.map(cat => (
                                  <span key={cat} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                                    {cat}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-600 italic">No sectors assigned</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col justify-end items-center lg:items-end gap-4 min-w-[200px] border-t lg:border-t-0 lg:border-l border-[#392e4e] pt-6 lg:pt-0 lg:pl-10">
                      {!partner.verified ? (
                        <button
                          onClick={() => setVerifyingPartner(partner)}
                          className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-900/20 active:scale-95 group/btn"
                        >
                          <ShieldCheck className="w-5 h-5 group-hover/btn:scale-125 transition-transform" /> START AUDIT
                        </button>
                      ) : (
                        <div className="text-right space-y-4">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Master Partner Key</p>
                            <p className="text-sm font-mono text-green-400 bg-green-500/5 px-3 py-1.5 rounded-lg border border-green-500/20 inline-block font-bold">
                              {partner.reliefPartnerKey}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 justify-end text-green-500 font-black text-[10px] uppercase tracking-widest">
                            <CheckCircle2 className="w-4 h-4" /> VERIFIED ACTIVE
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredPartners.length === 0 && (
                <div className="text-center py-32 bg-[#0a0a1a]/50 border-2 border-dashed border-[#392e4e] rounded-[3rem]">
                  <AlertCircle className="w-16 h-16 text-gray-800 mx-auto mb-6" />
                  <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Secure Vault Empty</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* Verification Modal */}
      <AnimatePresence>
        {verifyingPartner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVerifyingPartner(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a1a] border border-[#392e4e] rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20">
                    <ShieldCheck className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Security Clearing</h2>
                    <p className="text-xs text-gray-500 uppercase font-black tracking-widest mt-1">Ecosystem Onboarding for {verifyingPartner.displayName}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-black/50 border border-[#392e4e] rounded-2xl space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase">Agency Profile</p>
                      <p className="text-lg font-bold text-white tracking-tight">{verifyingPartner.displayName}</p>
                      <p className="text-xs text-gray-400 font-medium italic">{verifyingPartner.organization}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Key className="w-3 h-3" /> Issue Active Relief Key
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={partnerKey}
                          onChange={e => setPartnerKey(e.target.value.toUpperCase())}
                          className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-6 py-4 text-white font-mono font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-700"
                          placeholder="RP-NGO-CODE-2026"
                        />
                      </div>
                      <p className="text-[9px] text-gray-600 italic ml-1">* This key enables on-chain fund distribution for the agency.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setVerifyingPartner(null)}
                      className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black transition-all"
                    >
                      REJECT
                    </button>
                    <button
                      disabled={!partnerKey || isVerifying}
                      onClick={handleVerify}
                      className="flex-[2] py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? 'WHITELISTING...' : 'AUTHORIZE PARTNER'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthGuard>
  );
}
