'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import {
  beneficiaryFundService,
  categoryService,
  reliefPartnerAssignmentService,
  userService,
  transactionService
} from '@/lib/firebase/services';
import type {
  BeneficiaryFund,
  ReliefPartnerAssignment,
  Transaction
} from '@/lib/firebase/services';
import type { UserProfile } from '@/lib/firebase/services';
import MetricCard from '@/components/ui/MetricCard';
import {
  Wallet,
  FileText,
  AlertCircle,
  IndianRupee,
  ShoppingCart,
  Users,
  ArrowRightCircle,
  ShieldCheck,
  Zap,
  Target,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { formatEther, parseEther } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalSpotlight } from '@/components/MagicBento';
import { format } from 'date-fns';

export default function BeneficiaryDashboard() {
  const { profile } = useAuth();
  const { address, provider, isConnected, signer } = useWallet();
  const gridRef = useRef<HTMLDivElement>(null);

  const [metrics, setMetrics] = useState({
    fundsReceived: '0.00',
    remainingAllowance: '0.00',
    totalAllocated: 0,
    walletBalance: '0.00',
    totalTransactions: 0,
  });

  const [beneficiaryFunds, setBeneficiaryFunds] = useState<BeneficiaryFund[]>([]);
  const [reliefPartners, setReliefPartners] = useState<UserProfile[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [assignmentForm, setAssignmentForm] = useState({
    beneficiaryFundId: '',
    reliefPartnerId: '',
    amount: '',
    category: '',
    purpose: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedFund = beneficiaryFunds.find((bf) => bf.id === assignmentForm.beneficiaryFundId);
  const selectedPartner = reliefPartners.find((p) => p.uid === assignmentForm.reliefPartnerId);

  useEffect(() => {
    if (isConnected && address && profile?.uid) {
      loadDashboard();
    }
  }, [isConnected, address, profile]);

  const loadDashboard = async () => {
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

      const [funds, cats, txs, partners] = await Promise.all([
        beneficiaryFundService.getByBeneficiary(profile.uid).catch(() => []),
        categoryService.getAll().catch(() => []),
        transactionService.getAll().catch(() => []),
        userService.getByRole('relief_partner').catch(() => []),
      ]);

      // Filter only VERIFIED partners
      const verifiedPartners = partners.filter((p: UserProfile) => p.verified === true);

      const totalReceived = funds.reduce((sum: number, bf: BeneficiaryFund) => sum + (bf.amount || 0), 0);
      const remaining = funds.reduce((sum: number, bf: BeneficiaryFund) => sum + (bf.remainingAmount || 0), 0);

      const userTxs = txs.filter((t: Transaction) => t.from.toLowerCase() === address?.toLowerCase());

      setMetrics({
        fundsReceived: totalReceived.toFixed(2),
        remainingAllowance: remaining.toFixed(2),
        totalAllocated: funds.reduce((sum: number, bf: BeneficiaryFund) => sum + (bf.distributedAmount || 0), 0),
        walletBalance: balance,
        totalTransactions: userTxs.length,
      });

      setBeneficiaryFunds(funds);
      setCategories(cats);
      setTransactions(userTxs);
      setReliefPartners(verifiedPartners);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enforce Phase 4: Category mismatch is NOT allowed & Hide unverified partners
  useEffect(() => {
    if (assignmentForm.category) {
      setFilteredPartners(reliefPartners.filter(p => p.reliefCategories?.includes(assignmentForm.category)));
    } else {
      setFilteredPartners([]);
    }
  }, [assignmentForm.category, reliefPartners]);

  const handleCreateAssignment = async () => {
    if (!signer || !selectedPartner || !assignmentForm.amount || !assignmentForm.category) return;

    const numericAmount = parseFloat(assignmentForm.amount);

    // Strict checks
    if (!selectedPartner.verified) {
      alert('CRITICAL: Cannot send funds to unverified partners.');
      return;
    }

    if (!selectedPartner.reliefCategories?.includes(assignmentForm.category)) {
      alert('CRITICAL: Category mismatch detected. Agency is not authorized for this sector.');
      return;
    }

    try {
      setSubmitting(true);

      // Phase 3 OPTION B Step 4: Beneficiary sends ETH to Relief Partner
      const tx = await signer.sendTransaction({
        to: selectedPartner.walletAddress,
        value: parseEther(assignmentForm.amount)
      });

      // Log second leg of mediated transaction
      await transactionService.log({
        from: (await signer.getAddress()).toLowerCase(),
        to: selectedPartner.walletAddress!.toLowerCase(),
        amount: numericAmount,
        category: assignmentForm.category,
        reliefPartnerKey: selectedPartner.reliefPartnerKey || 'UNKNOWN',
        txHash: tx.hash,
        route: 'mediated',
        status: 'verified'
      });

      alert('Funds successfully transferred to Relief Partner!');
      loadDashboard();
      setAssignmentForm({
        beneficiaryFundId: '',
        reliefPartnerId: '',
        amount: '',
        category: '',
        purpose: '',
      });
    } catch (error) {
      console.error('Mediated transfer failed:', error);
      alert('Transfer failed. Check MetaMask.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin shadow-[0_0_20px_rgba(147,51,234,0.2)]" />
        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Accessing Beneficiary Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 bento-section" ref={gridRef}>
      <div className="fixed inset-0 pointer-events-none z-100">
        <GlobalSpotlight gridRef={gridRef} />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white">Mediator Portal</h1>
          <p className="text-gray-400 mt-1 font-medium italic">Empowered Aid Distribution • No Admin Lock • Direct Agency Liaison</p>
        </div>
        <div className="flex items-center gap-4 bg-[#0a0a1a]/50 p-2 rounded-2xl border border-[#392e4e]">
          <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Wallet</p>
            <p className="text-xs font-mono text-purple-400 font-bold">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
          <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Received ETH</p>
            <p className="text-xs font-mono text-green-400 font-bold">{metrics.walletBalance} ETH</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Gross Impact" value={`₹${metrics.fundsReceived}`} icon={IndianRupee} subtitle="Donations Directed to You" />
        <MetricCard title="Available to Act" value={`${metrics.walletBalance} ETH`} icon={Wallet} subtitle="Ready for Distribution" />
        <MetricCard title="Agency Liaisons" value={metrics.totalTransactions} icon={Users} subtitle="Verified Partners Funded" />
        <MetricCard title="Sector Reach" value={categories.length} icon={Target} subtitle="Impact Categories" />
      </div>

      {/* Mediation Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0a0a1a]/50 backdrop-blur-3xl border border-[#392e4e] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full -mr-48 -mt-48" />

            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Direct Path Mediation</h2>
                  <p className="text-gray-400 text-sm mt-1">Assign received funds to specialized relief agencies.</p>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                  <ArrowRightCircle className="w-6 h-6 text-purple-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Select Purpose Sector</label>
                  <select
                    value={assignmentForm.category}
                    onChange={(e) => setAssignmentForm(v => ({ ...v, category: e.target.value, reliefPartnerId: '' }))}
                    className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-6 py-4 text-white font-bold focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                  >
                    <option value="">Choose sector...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Amount to Distribute (ETH)</label>
                  <input
                    type="number"
                    value={assignmentForm.amount}
                    onChange={(e) => setAssignmentForm(v => ({ ...v, amount: e.target.value }))}
                    placeholder="0.05"
                    className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-6 py-4 text-white font-bold focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Authorized Relief Agencies (Filtered)</label>
                  <span className="text-[10px] text-purple-500 font-black uppercase tracking-tighter">Verified Keys Only</span>
                </div>

                {!assignmentForm.category ? (
                  <div className="p-10 text-center bg-black/30 border border-dashed border-[#392e4e] rounded-[2rem]">
                    <Target className="w-10 h-10 text-gray-800 mx-auto mb-4" />
                    <p className="text-gray-600 font-black uppercase text-[10px] tracking-widest">Select a Sector to View Authorized Agencies</p>
                  </div>
                ) : filteredPartners.length === 0 ? (
                  <div className="p-10 text-center bg-black/30 border border-dashed border-[#392e4e] rounded-[2rem]">
                    <ShieldCheck className="w-10 h-10 text-gray-800 mx-auto mb-4" />
                    <p className="text-gray-600 font-black uppercase text-[10px] tracking-widest">No Verified Agencies Authorized for this Sector</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPartners.map(partner => (
                      <button
                        key={partner.uid}
                        onClick={() => setAssignmentForm(v => ({ ...v, reliefPartnerId: partner.uid }))}
                        className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden group ${assignmentForm.reliefPartnerId === partner.uid ? 'bg-purple-600 border-purple-500' : 'bg-black/50 border-[#392e4e] hover:border-purple-500/50'}`}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${assignmentForm.reliefPartnerId === partner.uid ? 'bg-white/20' : 'bg-purple-500/10'}`}>
                            <ShieldCheck className={assignmentForm.reliefPartnerId === partner.uid ? 'text-white' : 'text-purple-500'} />
                          </div>
                          <div>
                            <p className={`font-black text-sm uppercase tracking-tight ${assignmentForm.reliefPartnerId === partner.uid ? 'text-white' : 'text-white/90'}`}>{partner.organization}</p>
                            <p className={`text-[10px] font-mono ${assignmentForm.reliefPartnerId === partner.uid ? 'text-white/70' : 'text-gray-500'}`}>{partner.reliefPartnerKey}</p>
                          </div>
                        </div>
                        {assignmentForm.reliefPartnerId === partner.uid && <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-[#392e4e]">
                <button
                  disabled={!assignmentForm.reliefPartnerId || !assignmentForm.amount || submitting}
                  onClick={handleCreateAssignment}
                  className="w-full py-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-[1.5rem] font-black shadow-xl shadow-purple-900/40 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {submitting ? 'DISTRIBUTING AID...' : (
                    <>
                      <Zap className="w-5 h-5" /> EXECUTE AID DELIVERY
                    </>
                  )}
                </button>
                <p className="text-[9px] text-center text-gray-600 mt-4 italic">
                  * This action directly transfers ETH from your wallet to the selected agency. ReliefChain platform maintains zero custody.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#0a0a1a]/50 border border-[#392e4e] rounded-[3rem] p-8">
            <h3 className="text-xl font-black text-white mb-6">Impact Verification</h3>
            <div className="space-y-4">
              {transactions.map(tx => (
                <div key={tx.id} className="p-4 bg-black/40 border border-[#392e4e] rounded-2xl flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                      <Zap className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{tx.amount} ETH</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{tx.category}</p>
                    </div>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white" />
                  </a>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center py-10 opacity-30 italic font-medium text-gray-500 text-xs">
                  No ledger entries yet.
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-[3rem] p-8 space-y-6">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/40">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">Trust Assurance</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                You can only send funds to agencies verified by the ReliefChain Council. The network prevents category mismatch to ensure specialized aid reaches the right destination.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-black/50 border border-purple-500/30 rounded-full text-[9px] font-black text-purple-400 uppercase tracking-widest">Verified-Only</span>
              <span className="px-3 py-1 bg-black/50 border border-blue-500/30 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest">Match-Locked</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
