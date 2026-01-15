'use client';

import { AuthGuard } from '@/lib/middleware/withAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { donationService, receiptService } from '@/lib/firebase/services/index';
import { useState, useEffect } from 'react';
import { Receipt, ExternalLink, Loader2 } from 'lucide-react';

export default function TransactionsPage() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.uid) {
      loadTransactions();
    }
  }, [profile]);

  const loadTransactions = async () => {
    if (!profile?.uid) return;
    try {
      setLoading(true);
      const [donations, receipts] = await Promise.all([
        donationService.getByDonor(profile.uid).catch(() => []),
        receiptService.getByPayer(profile.uid).catch(() => []),
      ]);

      // Combine and sort by date
      const all = [
        ...donations.map((d) => ({ ...d, type: 'donation' })),
        ...receipts.map((r) => ({ ...r, type: 'receipt' })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setTransactions(all);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Transactions</h1>
            <p className="text-gray-400 mt-2">View your transaction history</p>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-12 text-center">
              <Receipt className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Transactions</h3>
              <p className="text-gray-400">You haven't made any transactions yet.</p>
            </div>
          ) : (
            <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1a1a2e]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Transaction
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#0a0a1a] divide-y divide-[#392e4e]">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#1a1a2e] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-900/30 text-blue-400 border border-blue-500/30">
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          ${tx.amountDisplay || '0.00'} {tx.currency || 'USDT'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`
                            px-2 py-1 text-xs font-medium rounded-full border
                            ${tx.status === 'verified' || tx.status === 'pending'
                              ? 'bg-green-900/30 text-green-400 border-green-500/30'
                              : tx.status === 'rejected'
                                ? 'bg-red-900/30 text-red-400 border-red-500/30'
                                : 'bg-gray-800/50 text-gray-400 border-gray-700/50'
                            }
                          `}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {tx.transactionHash ? (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${tx.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              View
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-gray-600">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
