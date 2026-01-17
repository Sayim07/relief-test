'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import {
  userService,
  categoryService,
  transactionService,
  reliefRequestService
} from '@/lib/firebase/services';
import MetricCard from '@/components/ui/MetricCard';
import type { ReliefRequest, Transaction } from '@/lib/firebase/services';
import type { UserProfile } from '@/lib/firebase/services';
import {
  Heart,
  IndianRupee,
  FileText,
  TrendingUp,
  Wallet,
  CheckCircle,
  MapPin,
  ShieldCheck,
  Users,
  Search,
  ArrowRight,
  Zap,
  Globe,
  HandHeart,
  ExternalLink
} from 'lucide-react';
import { formatEther, parseEther } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalSpotlight } from '@/components/MagicBento';
import { format } from 'date-fns';

export default function DonorDashboard() {
  const { profile } = useAuth();
  const { address, provider, isConnected, signer } = useWallet();
  const [metrics, setMetrics] = useState({
    totalDonated: '0.00',
    directDonations: 0,
    mediatedDonations: 0,
    walletBalance: '0.00',
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Funding Flow State
  const [fundingPath, setFundingPath] = useState<'A' | 'B' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [partners, setPartners] = useState<UserProfile[]>([]);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<UserProfile | null>(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<UserProfile | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // MagicBento Ref
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.uid) {
      loadDashboardData();
    }
  }, [profile, address, provider]);

  useEffect(() => {
    if (selectedCategory) {
      loadPartners(selectedCategory);
    }
  }, [selectedCategory]);

  const loadDashboardData = async () => {
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

      const [cats, benes, txs] = await Promise.all([
        categoryService.getAll(),
        userService.getByRole('beneficiary'),
        transactionService.getAll()
      ]);

      const userTxs = txs.filter((t: Transaction) => t.from.toLowerCase() === address?.toLowerCase());
      const totalDonated = userTxs.reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      setCategories(cats);
      setBeneficiaries(benes);
      setTransactions(userTxs);

      setMetrics({
        totalDonated: totalDonated.toFixed(2),
        directDonations: userTxs.filter((t: Transaction) => t.route === 'direct').length,
        mediatedDonations: userTxs.filter((t: Transaction) => t.route === 'mediated').length,
        walletBalance: balance,
        totalTransactions: userTxs.length,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPartners = async (cat: string) => {
    try {
      setPartnerLoading(true);
      const data = await userService.getVerifiedPartnersByCategory(cat);
      setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setPartnerLoading(false);
    }
  };

  const handleDonateOptionA = async () => {
    if (!signer || !selectedPartner || !donationAmount) return;

    try {
      setIsProcessing(true);
      const tx = await signer.sendTransaction({
        to: selectedPartner.walletAddress,
        value: parseEther(donationAmount)
      });

      await transactionService.log({
        from: (await signer.getAddress()).toLowerCase(),
        to: selectedPartner.walletAddress!.toLowerCase(),
        amount: parseFloat(donationAmount),
        category: selectedCategory,
        reliefPartnerKey: selectedPartner.reliefPartnerKey || 'UNKNOWN',
        txHash: tx.hash,
        route: 'direct',
        status: 'verified'
      });

      alert('Direct donation completed successfully!');
      resetFlow();
      await loadDashboardData();
    } catch (error) {
      console.error('Donation A failed:', error);
      alert('Donation failed. Check MetaMask.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDonateOptionB = async () => {
    if (!signer || !selectedBeneficiary || !donationAmount) return;

    try {
      setIsProcessing(true);
      const tx = await signer.sendTransaction({
        to: selectedBeneficiary.walletAddress,
        value: parseEther(donationAmount)
      });

      await transactionService.log({
        from: (await signer.getAddress()).toLowerCase(),
        to: selectedBeneficiary.walletAddress!.toLowerCase(),
        amount: parseFloat(donationAmount),
        category: 'mediated_pool',
        reliefPartnerKey: 'PENDING_BENEFICIARY_CHOICE',
        txHash: tx.hash,
        route: 'mediated',
        status: 'verified'
      });

      alert('Mediated donation sent to beneficiary wallet!');
      resetFlow();
      await loadDashboardData();
    } catch (error) {
      console.error('Donation B failed:', error);
      alert('Donation failed. Check MetaMask.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFlow = () => {
    setFundingPath(null);
    setSelectedCategory('');
    setSelectedPartner(null);
    setSelectedBeneficiary(null);
    setDonationAmount('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-[0_0_20px_rgba(37,99,235,0.2)]" />
        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Accessing Donor Records...</p>
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
          <h1 className="text-4xl font-black text-white tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white">Donor Portal</h1>
          <p className="text-gray-400 mt-1 font-medium italic">Transparency First • No Admin Custody • P2P Philanthropy</p>
        </div>
        <div className="flex items-center gap-4 bg-[#0a0a1a]/50 p-2 rounded-2xl border border-[#392e4e]">
          <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Connected Wallet</p>
            <p className="text-xs font-mono text-blue-400 font-bold">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
          <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</p>
            <p className="text-xs font-mono text-green-400 font-bold">{metrics.walletBalance} ETH</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Philanthropy" value={`₹${metrics.totalDonated}`} icon={HandHeart} subtitle="Accumulated Impact" />
        <MetricCard title="Direct Paths" value={metrics.directDonations} icon={Zap} subtitle="Direct Agency Support" />
        <MetricCard title="Mediated Paths" value={metrics.mediatedDonations} icon={Users} subtitle="Beneficiary Empowerment" />
        <MetricCard title="Global Rank" value="#124" icon={Globe} subtitle="Contribution Leaderboard" />
      </div>

      {/* Donation Flow Portal */}
      <div className="bg-[#0a0a1a]/50 backdrop-blur-3xl border border-[#392e4e] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full -mr-48 -mt-48" />

        {!fundingPath ? (
          <div className="space-y-12 relative z-10">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl font-black text-white">Choose Your Funding Path</h2>
              <p className="text-gray-400 font-medium">Select a methodology for your contribution. All funds go directly to wallets without platform custody.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.button
                whileHover={{ scale: 1.02, translateY: -5 }}
                onClick={() => setFundingPath('A')}
                className="group relative p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] text-left hover:border-blue-500/50 transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8">
                  <Zap className="w-12 h-12 text-blue-500/20 group-hover:text-blue-500/40 transition-colors" />
                </div>
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2">Option A: Direct Support</h3>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">
                      Fund verified relief organizations directly based on their operational categories. Maximum speed, full agency accountability.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest">
                    SELECT PATH <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, translateY: -5 }}
                onClick={() => setFundingPath('B')}
                className="group relative p-8 bg-purple-600/5 border border-purple-500/20 rounded-[2.5rem] text-left hover:border-purple-500/50 transition-all"
              >
                <div className="absolute top-0 right-0 p-8">
                  <Users className="w-12 h-12 text-purple-500/20 group-hover:text-purple-500/40 transition-colors" />
                </div>
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center shadow-[0_0_30_rgba(147,51,234,0.3)]">
                    <HandHeart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2">Option B: Beneficiary Power</h3>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">
                      Empower verified beneficiaries by sending funds to their wallet. They will select a verified agency for precise aid delivery.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest">
                    SELECT PATH <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 relative z-10"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={resetFlow}
                className="px-4 py-2 text-gray-500 font-black text-xs uppercase hover:text-white transition-colors flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" /> Change Funding Path
              </button>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${fundingPath === 'A' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'}`}>
                Option {fundingPath} Selection
              </div>
            </div>

            {fundingPath === 'A' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Select Crisis Sector</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedPartner(null);
                      }}
                      className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-6 py-4 text-white font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    >
                      <option value="">Choose a category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedCategory && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Verified Relief Agencies</label>
                      {partnerLoading ? (
                        <div className="text-center py-8 bg-black/30 rounded-2xl border border-dashed border-[#392e4e]">
                          <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
                        </div>
                      ) : partners.length === 0 ? (
                        <div className="p-8 text-center bg-black/30 rounded-2xl border border-dashed border-[#392e4e]">
                          <p className="text-xs text-gray-600 font-bold uppercase">No Verified Agencies in this Sector</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {partners.map(partner => (
                            <button
                              key={partner.uid}
                              onClick={() => setSelectedPartner(partner)}
                              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${selectedPartner?.uid === partner.uid ? 'bg-blue-600 border-blue-500' : 'bg-black/50 border-[#392e4e] hover:border-blue-500/50'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedPartner?.uid === partner.uid ? 'bg-white/20' : 'bg-blue-500/10'}`}>
                                  <ShieldCheck className={selectedPartner?.uid === partner.uid ? 'text-white' : 'text-blue-500'} />
                                </div>
                                <div>
                                  <p className={`font-black text-sm ${selectedPartner?.uid === partner.uid ? 'text-white' : 'text-white/90'}`}>{partner.organization}</p>
                                  <p className={`text-[10px] font-medium ${selectedPartner?.uid === partner.uid ? 'text-white/70' : 'text-gray-500'}`}>ID: {partner.reliefPartnerKey}</p>
                                </div>
                              </div>
                              {selectedPartner?.uid === partner.uid && <CheckCircle className="w-5 h-5 text-white" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-black/30 border border-[#392e4e] rounded-[2.5rem] p-8 space-y-8 h-fit">
                  <div className="space-y-4 text-center">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                      <Wallet className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-black text-white">Finalize Donation</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Contribution Amount (ETH)</label>
                      <input
                        type="number"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        placeholder="0.1"
                        className="w-full bg-[#0a0a1a] border border-[#392e4e] rounded-2xl px-6 py-5 text-2xl font-black text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-800"
                      />
                    </div>

                    <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Target Wallet</span>
                        <span className="text-[10px] font-mono text-blue-400 font-bold">{selectedPartner?.walletAddress ? `${selectedPartner.walletAddress.slice(0, 8)}...${selectedPartner.walletAddress.slice(-6)}` : 'AWAITING SELECTION'}</span>
                      </div>
                      <button
                        disabled={!selectedPartner || !donationAmount || isProcessing}
                        onClick={handleDonateOptionA}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black shadow-xl shadow-blue-900/40 transition-all active:scale-95"
                      >
                        {isProcessing ? 'PROCESSING...' : 'CONFIRM ON METAMASK'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Active Beneficiaries</label>
                    <div className="grid grid-cols-1 gap-3">
                      {beneficiaries.map(bene => (
                        <button
                          key={bene.uid}
                          onClick={() => setSelectedBeneficiary(bene)}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${selectedBeneficiary?.uid === bene.uid ? 'bg-purple-600 border-purple-500' : 'bg-black/50 border-[#392e4e] hover:border-purple-500/50'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedBeneficiary?.uid === bene.uid ? 'bg-white/20' : 'bg-purple-500/10'}`}>
                              <Users className={selectedBeneficiary?.uid === bene.uid ? 'text-white' : 'text-purple-500'} />
                            </div>
                            <div>
                              <p className={`font-black text-sm ${selectedBeneficiary?.uid === bene.uid ? 'text-white' : 'text-white/90'}`}>{bene.displayName}</p>
                              <p className={`text-[10px] font-medium ${selectedBeneficiary?.uid === bene.uid ? 'text-white/70' : 'text-gray-500'}`}>{bene.location || 'Location Unspecified'}</p>
                            </div>
                          </div>
                          {selectedBeneficiary?.uid === bene.uid && <CheckCircle className="w-5 h-5 text-white" />}
                        </button>
                      ))}
                      {beneficiaries.length === 0 && (
                        <div className="p-12 text-center bg-black/30 rounded-2xl border border-dashed border-[#392e4e]">
                          <p className="text-sm text-gray-600 font-bold uppercase">No Beneficiaries Registered</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 border border-[#392e4e] rounded-[2.5rem] p-8 space-y-8 h-fit">
                  <div className="space-y-4 text-center">
                    <div className="w-20 h-20 bg-purple-600/10 rounded-full flex items-center justify-center mx-auto">
                      <HandHeart className="w-10 h-10 text-purple-500" />
                    </div>
                    <h3 className="text-2xl font-black text-white">Empower Beneficiary</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Transfer Amount (ETH)</label>
                      <input
                        type="number"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        placeholder="0.05"
                        className="w-full bg-[#0a0a1a] border border-[#392e4e] rounded-2xl px-6 py-5 text-2xl font-black text-white focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-gray-800"
                      />
                    </div>

                    <div className="p-6 bg-purple-900/10 border border-purple-500/20 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Target Beneficiary</span>
                        <span className="text-[10px] font-mono text-purple-400 font-bold">{selectedBeneficiary?.walletAddress ? `${selectedBeneficiary.walletAddress.slice(0, 8)}...${selectedBeneficiary.walletAddress.slice(-6)}` : 'AWAITING SELECTION'}</span>
                      </div>
                      <button
                        disabled={!selectedBeneficiary || !donationAmount || isProcessing}
                        onClick={handleDonateOptionB}
                        className="w-full py-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-2xl font-black shadow-xl shadow-purple-900/40 transition-all active:scale-95"
                      >
                        {isProcessing ? 'AUTHORIZING...' : 'TRANSFER TO BENEFICIARY'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-[#0a0a1a]/50 backdrop-blur-xl border border-[#392e4e] rounded-[3rem] p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-500" /> Transaction Ledger
          </h2>
          <div className="px-4 py-1.5 bg-black/50 border border-[#392e4e] rounded-xl text-[10px] font-black text-gray-500 uppercase">
            Real-Time Chain Updates
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#392e4e] rounded-[2rem]">
            <FileText className="w-12 h-12 text-gray-800 mx-auto mb-4" />
            <p className="text-gray-500 font-black uppercase text-xs tracking-widest">No Registered Transactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map(tx => (
              <div key={tx.id} className="group bg-black/40 border border-[#392e4e] p-6 rounded-[2rem] hover:border-blue-500/30 transition-all flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6 flex-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tx.route === 'direct' ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-purple-600/10 border border-purple-500/20'}`}>
                    {tx.route === 'direct' ? <Zap className="w-6 h-6 text-blue-500" /> : <Users className="w-6 h-6 text-purple-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${tx.route === 'direct' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {tx.route}
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold">{format(tx.createdAt, 'PPp')}</span>
                    </div>
                    <p className="text-lg font-black text-white">{tx.amount} ETH</p>
                    <p className="text-xs text-gray-500 font-mono flex items-center gap-2 mt-1">
                      <ArrowRight className="w-3 h-3 text-blue-500/50" /> {tx.to.slice(0, 10)}...{tx.to.slice(-8)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-[#392e4e] pt-6 md:pt-0 md:pl-8">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Partner Key</p>
                    <p className="text-sm font-mono text-blue-400 font-bold">{tx.reliefPartnerKey}</p>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group/link"
                  >
                    <ExternalLink className="w-5 h-5 text-gray-400 group-hover/link:text-white" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
