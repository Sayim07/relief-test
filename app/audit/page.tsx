'use client';

import { useState, useEffect } from 'react';
import { transactionService } from '@/lib/firebase/services';
import { Shield, TrendingUp, Users, Wallet, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getProvider } from '@/lib/web3/provider';
import { getReliefTokenContractReadOnly } from '@/lib/contracts/reliefToken';
import { ethers } from 'ethers';
import PageLoader from '@/components/ui/PageLoader';

interface Transaction {
  id: string;
  txHash: string;
  from: string;
  to: string;
  amount: string;
  category: string;
  description?: string;
  timestamp: any;
  status?: 'verified' | 'pending';
  confirmed?: boolean;
  type?: 'donation' | 'distribution';
}

export default function AuditPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonated: 0,
    totalDistributed: 0,
    transactionCount: 0,
    verifiedCount: 0,
  });

  useEffect(() => {
    const initializeAuditData = async () => {
      try {
        setLoading(true);

        // Step 1: Load Firestore history
        const firestoreTxs = await loadFirestoreHistory();

        // Step 2: Load blockchain events
        const blockchainTxs = await loadBlockchainHistory();

        // Step 3: Merge and deduplicate
        const merged = mergeAndDeduplicateTransactions(firestoreTxs, blockchainTxs);

        // Step 4: Update UI
        updateTransactions(merged);

        // Step 5: Set up real-time listeners
        setupRealtimeListeners();

        setLoading(false);
      } catch (error) {
        console.error('Error initializing audit data:', error);
        setLoading(false);
      }
    };

    initializeAuditData();
  }, []);

  const loadFirestoreHistory = async (): Promise<Transaction[]> => {
    try {
      const txs = await transactionService.getAll();
      return txs.map((tx: any) => ({
        id: tx.id || tx.txHash,
        txHash: tx.txHash || '',
        from: tx.from || '',
        to: tx.to || '',
        amount: tx.amount?.toString() || '0',
        category: tx.category || 'General',
        description: tx.description || '',
        timestamp: tx.timestamp,
        status: tx.status || 'pending',
        confirmed: tx.confirmed || false,
        type: tx.type || 'donation',
      }));
    } catch (error) {
      console.error('Error loading Firestore history:', error);
      return [];
    }
  };

  const loadBlockchainHistory = async (): Promise<Transaction[]> => {
    try {
      const provider = getProvider();
      if (!provider) {
        console.warn('Provider not available for blockchain history');
        return [];
      }

      const contract = getReliefTokenContractReadOnly(provider);
      const blockchainTxs: Transaction[] = [];

      // Query DonationRecorded events
      try {
        const donationFilter = contract.filters.DonationRecorded?.();
        if (donationFilter) {
          const donationEvents = await contract.queryFilter(donationFilter, 0, 'latest');
          donationEvents.forEach((event: any) => {
            blockchainTxs.push({
              id: event.transactionHash,
              txHash: event.transactionHash,
              from: event.args?.donor || '',
              to: event.args?.recipient || '',
              amount: event.args?.amount?.toString() || '0',
              category: event.args?.category || 'General',
              timestamp: new Date(event.blockNumber * 1000),
              status: 'verified',
              confirmed: true,
              type: 'donation',
            });
          });
        }
      } catch (err) {
        console.warn('Error querying DonationRecorded events:', err);
      }

      // Query ReliefDistributed events
      try {
        const distributionFilter = contract.filters.ReliefDistributed?.();
        if (distributionFilter) {
          const distributionEvents = await contract.queryFilter(distributionFilter, 0, 'latest');
          distributionEvents.forEach((event: any) => {
            blockchainTxs.push({
              id: event.transactionHash,
              txHash: event.transactionHash,
              from: '',
              to: event.args?.to || '',
              amount: event.args?.amount?.toString() || '0',
              category: event.args?.category || 'General',
              timestamp: new Date(event.blockNumber * 1000),
              status: 'verified',
              confirmed: true,
              type: 'distribution',
            });
          });
        }
      } catch (err) {
        console.warn('Error querying ReliefDistributed events:', err);
      }

      return blockchainTxs;
    } catch (error) {
      console.error('Error loading blockchain history:', error);
      return [];
    }
  };

  const mergeAndDeduplicateTransactions = (
    firestoreTxs: Transaction[],
    blockchainTxs: Transaction[]
  ): Transaction[] => {
    const txMap = new Map<string, Transaction>();

    // Add all Firestore transactions
    firestoreTxs.forEach((tx) => {
      if (tx.txHash) {
        txMap.set(tx.txHash.toLowerCase(), tx);
      }
    });

    // Merge blockchain transactions and update status
    blockchainTxs.forEach((blockTx) => {
      const key = blockTx.txHash.toLowerCase();
      if (txMap.has(key)) {
        // Update existing Firestore tx with blockchain data
        const existing = txMap.get(key)!;
        existing.status = 'verified';
        existing.confirmed = true;
      } else {
        // Add new blockchain transaction
        txMap.set(key, blockTx);
      }
    });

    // Convert to array and sort by timestamp (newest first)
    return Array.from(txMap.values()).sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() || new Date(a.timestamp).getTime() || 0;
      const bTime = b.timestamp?.toMillis?.() || new Date(b.timestamp).getTime() || 0;
      return bTime - aTime;
    });
  };

  const updateTransactions = (txs: Transaction[]) => {
    setTransactions(txs);

    // Calculate stats
    let totalDonated = 0;
    let totalDistributed = 0;
    let verifiedCount = 0;

    txs.forEach((tx) => {
      const amount = parseFloat(tx.amount) || 0;
      if (tx.type === 'donation') {
        totalDonated += amount;
      } else if (tx.type === 'distribution') {
        totalDistributed += amount;
      }
      if (tx.status === 'verified' || tx.confirmed) {
        verifiedCount += 1;
      }
    });

    setStats({
      totalDonated,
      totalDistributed,
      transactionCount: txs.length,
      verifiedCount,
    });
  };

  const setupRealtimeListeners = () => {
    // Real-time Firestore listener
    if (transactionService.onSnapshot) {
      const firestoreUnsubscribe = transactionService.onSnapshot((newTxs: any[]) => {
        const formattedTxs = newTxs.map((tx: any) => ({
          id: tx.id || tx.txHash,
          txHash: tx.txHash || '',
          from: tx.from || '',
          to: tx.to || '',
          amount: tx.amount?.toString() || '0',
          category: tx.category || 'General',
          description: tx.description || '',
          timestamp: tx.timestamp,
          status: tx.status || 'pending',
          confirmed: tx.confirmed || false,
          type: tx.type || 'donation',
        }));
        updateTransactions(formattedTxs);
      });

      return () => firestoreUnsubscribe();
    }
  };

  const formatAddress = (address: string) => {
    if (!address || address === '') return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      let date;
      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      return date.toLocaleString();
    } catch (err) {
      return 'N/A';
    }
  };

  const formatAmount = (amount: any) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusBadge = (tx: Transaction) => {
    const isVerified = tx.status === 'verified' || tx.confirmed;
    return isVerified ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/50 animate-in fade-in">
        <CheckCircle className="w-4 h-4" />
        Verified
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-500/50 animate-pulse">
        <Clock className="w-4 h-4" />
        Pending
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Shield className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold text-white">ReliefChain</span>
          </Link>
          <Link
            href="/auth"
            className="text-slate-300 hover:text-white font-medium transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-5xl font-black text-white">
                ReliefChain Public Audit Trail
              </h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-emerald-400">Live</span>
              </div>
            </div>
            <p className="text-xl text-slate-400">
              Every donation and fund transfer is publicly verifiable on the blockchain
            </p>
            <p className="text-sm text-slate-500 mt-2">
              🔗 Connected to blockchain & Firestore • Auto-updating in real-time
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-linear-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50 hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-6 h-6 text-blue-500" />
                <span className="text-xs font-semibold text-blue-400">TOTAL DONATED</span>
              </div>
              <div className="text-3xl font-black text-white">₹{formatAmount(stats.totalDonated)}</div>
              <p className="text-sm text-slate-400 mt-2">Verified donations</p>
            </div>

            <div className="bg-linear-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50 hover:border-green-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <Wallet className="w-6 h-6 text-green-500" />
                <span className="text-xs font-semibold text-green-400">DISTRIBUTED</span>
              </div>
              <div className="text-3xl font-black text-white">₹{formatAmount(stats.totalDistributed)}</div>
              <p className="text-sm text-slate-400 mt-2">Relief funds delivered</p>
            </div>

            <div className="bg-linear-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50 hover:border-purple-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-6 h-6 text-purple-500" />
                <span className="text-xs font-semibold text-purple-400">TRANSACTIONS</span>
              </div>
              <div className="text-3xl font-black text-white">{stats.transactionCount}</div>
              <p className="text-sm text-slate-400 mt-2">Total on-chain txs</p>
            </div>

            <div className="bg-linear-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-400">VERIFIED</span>
              </div>
              <div className="text-3xl font-black text-white">{stats.verifiedCount}</div>
              <p className="text-sm text-slate-400 mt-2">Blockchain confirmed</p>
            </div>
          </div>

          {/* Transactions Table */}
          {loading && <PageLoader />}
          {!loading && transactions.length === 0 ? (
            <div className="bg-slate-800/50 rounded-xl border border-slate-600/50 p-12 text-center">
              <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                No transactions recorded yet. New transactions will appear here automatically.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-slate-400">
                Displaying <span className="text-blue-400 font-semibold">{transactions.length}</span> blockchain transactions • Auto-updating
              </div>
              <div className="bg-slate-800/50 border border-slate-600/50 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900/50 border-b border-slate-600/50">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Transaction Hash
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          From
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          To
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600/30">
                      {transactions.map((tx, idx) => (
                        <tr
                          key={tx.id || idx}
                          className="hover:bg-slate-700/30 transition-colors border-slate-600/20"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm text-blue-400 hover:text-blue-300 cursor-pointer">
                              {tx.txHash ? formatAddress(tx.txHash) : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm text-slate-300">{formatAddress(tx.from)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm text-slate-300">{formatAddress(tx.to)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-white">
                              ₹{formatAmount(tx.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-slate-700 text-slate-200 rounded-md text-xs font-medium">
                              {tx.category || 'General'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(tx)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {formatDate(tx.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Footer Info */}
          <div className="mt-12 bg-linear-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-8">
            <h3 className="text-lg font-semibold text-white mb-2">🔗 On-Chain Transparency</h3>
            <p className="text-slate-300 mb-4">
              All ReliefChain transactions are recorded on the blockchain and can be independently verified.
              This audit trail ensures complete transparency and accountability in disaster relief operations.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Immutable records</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Public verification</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Real-time settlement</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Role-based access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
