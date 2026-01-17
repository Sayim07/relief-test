'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import {
  beneficiaryFundService,
  categoryService,
  reliefPartnerAssignmentService,
  userService,
} from '@/lib/firebase/services/index';
import type {
  BeneficiaryFund,
  ReliefPartnerAssignment,
} from '@/lib/types/database';
import type { UserProfile } from '@/lib/types/user';
import MetricCard from '@/components/ui/MetricCard';
import {
  Wallet,
  FileText,
  AlertCircle,
  IndianRupee,
  ShoppingCart,
  Users,
  ArrowRightCircle,
} from 'lucide-react';
import { formatEther } from 'ethers';
import { getReliefTokenContract, reliefTokenFunctions } from '@/lib/contracts/reliefToken';

interface MetricsState {
  fundsReceived: string;
  remainingAllowance: string;
  spendHistory: number;
  categoryLimits: number;
  walletBalance: string;
  totalTransactions: number;
}

interface AssignmentFormState {
  beneficiaryFundId: string;
  reliefPartnerId: string;
  amount: string;
  category?: string;
  purpose: string;
}

export default function BeneficiaryDashboard() {
  const { profile } = useAuth();
  const { address, provider, isConnected, signer } = useWallet();

  const [metrics, setMetrics] = useState<MetricsState>({
    fundsReceived: '0.00',
    remainingAllowance: '0.00',
    spendHistory: 0,
    categoryLimits: 0,
    walletBalance: '0.00',
    totalTransactions: 0,
  });
  const [beneficiaryFunds, setBeneficiaryFunds] = useState<BeneficiaryFund[]>([]);
  const [assignments, setAssignments] = useState<ReliefPartnerAssignment[]>([]);
  const [reliefPartners, setReliefPartners] = useState<UserProfile[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormState>({
    beneficiaryFundId: '',
    reliefPartnerId: '',
    amount: '',
    category: '',
    purpose: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedFund = beneficiaryFunds.find((bf) => bf.id === assignmentForm.beneficiaryFundId);

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

      const [beneficiaryFunds, categories, assignments, partners] = await Promise.all([
        beneficiaryFundService.getByBeneficiary(profile.uid).catch(() => []),
        categoryService.getAll().catch(() => []),
        reliefPartnerAssignmentService.getByBeneficiary(profile.uid).catch(() => []),
        userService.getByRole('relief_partner').catch(() => []),
      ]);

      const totalReceived = beneficiaryFunds.reduce(
        (sum, bf) => sum + (typeof bf.amount === 'number' ? bf.amount : 0),
        0
      );

      const remaining = beneficiaryFunds.reduce(
        (sum, bf) => sum + (typeof bf.remainingAmount === 'number' ? bf.remainingAmount : 0),
        0
      );

      setMetrics({
        fundsReceived: totalReceived.toFixed(2),
        remainingAllowance: remaining.toFixed(2),
        spendHistory: assignments.length,
        categoryLimits: categories.length,
        walletBalance: balance,
        totalTransactions: assignments.length,
      });

      setBeneficiaryFunds(beneficiaryFunds);
      setAssignments(assignments);
      setReliefPartners(partners);
      setCategories(categories);
    } catch (error) {
      console.error('Error loading beneficiary dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const selectedFund = beneficiaryFunds.find(f => f.id === assignmentForm.beneficiaryFundId);
    if (selectedFund?.category) {
      setFilteredPartners(reliefPartners.filter(p =>
        p.reliefCategories?.includes(selectedFund.category!) ||
        (p as any).reliefCategory === selectedFund.category
      ));
    } else {
      setFilteredPartners(reliefPartners);
    }
  }, [assignmentForm.beneficiaryFundId, beneficiaryFunds, reliefPartners]);

  const partnerStats = useMemo(() => {
    const stats: Record<
      string,
      {
        partner: UserProfile | undefined;
        totalAssigned: number;
        totalSpent: number;
        totalRemaining: number;
        assignments: ReliefPartnerAssignment[];
      }
    > = {};

    for (const assignment of assignments) {
      const key = assignment.reliefPartnerId;
      if (!stats[key]) {
        stats[key] = {
          partner: reliefPartners.find((p) => p.uid === key),
          totalAssigned: 0,
          totalSpent: 0,
          totalRemaining: 0,
          assignments: [],
        };
      }
      stats[key].totalAssigned += assignment.amount || 0;
      stats[key].totalSpent += assignment.spentAmount || 0;
      stats[key].totalRemaining += assignment.remainingAmount || 0;
      stats[key].assignments.push(assignment);
    }

    return Object.values(stats);
  }, [assignments, reliefPartners]);

  const handleCreateAssignment = async () => {
    if (!profile?.uid) return;
    const { beneficiaryFundId, reliefPartnerId, amount, category, purpose } = assignmentForm;

    const selectedPartner = reliefPartners.find((p) => p.uid === reliefPartnerId);

    if (!selectedFund || !selectedPartner) {
      alert('Please select a fund and a relief partner');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (numericAmount > selectedFund.remainingAmount) {
      alert('Amount exceeds remaining beneficiary fund balance');
      return;
    }

    try {
      setSubmitting(true);

      // 1. On-chain assignment if wallet is connected
      let transactionHash: string | undefined;
      if (signer && isConnected && address) {
        if (!selectedPartner.walletAddress) {
          throw new Error('Selected relief partner does not have a wallet address connected');
        }

        try {
          console.log('Assigning relief partner on-chain...');
          const contract = getReliefTokenContract(signer);
          const amountWei = BigInt(Math.floor(numericAmount * 1e18));

          // 1a. Assign the partner
          await reliefTokenFunctions.assignReliefPartner(
            contract,
            address, // beneficiary
            selectedPartner.walletAddress // relief partner
          );

          // 1b. Transfer the assigned tokens to the partner
          console.log('Transferring tokens to relief partner on-chain...');
          const tx = await contract.transfer(selectedPartner.walletAddress, amountWei);
          const receipt = await tx.wait();
          transactionHash = receipt?.hash || tx.hash;

        } catch (contractError: any) {
          console.error('Failed on-chain assignment operations:', contractError);
          // If the reason is "already assigned", we might still want to try the transfer if balance allows
          if (!contractError?.message?.includes('already assigned')) {
            throw new Error(`On-chain operation failed: ${contractError.message || 'Unknown error'}`);
          }
        }
      }

      const now = new Date();

      await reliefPartnerAssignmentService.create({
        reliefPartnerId,
        reliefPartnerEmail: selectedPartner.email,
        reliefPartnerName: selectedPartner.displayName || selectedPartner.email,
        beneficiaryFundId,
        beneficiaryId: profile.uid,
        beneficiaryEmail: profile.email || '',
        beneficiaryName: profile.displayName || undefined,
        amount: numericAmount,
        amountDisplay: `₹${numericAmount.toFixed(2)}`,
        currency: selectedFund.currency,
        category,
        purpose: purpose || undefined,
        status: 'active',
        assignedBy: profile.uid,
        assignedAt: now,
        completedAt: undefined,
        spentAmount: 0,
        remainingAmount: numericAmount,
        transactionHash: transactionHash,
        receipts: [],
        metadata: {},
      });

      await beneficiaryFundService.update(selectedFund.id, {
        distributedAmount: (selectedFund.distributedAmount || 0) + numericAmount,
        remainingAmount: (selectedFund.remainingAmount || 0) - numericAmount,
      });

      setAssignmentForm({
        beneficiaryFundId: '',
        reliefPartnerId: '',
        amount: '',
        category: '',
        purpose: '',
      });

      await loadDashboard();
      alert('Relief partner assignment created successfully');
    } catch (error: any) {
      console.error('Error creating relief partner assignment:', error);
      alert(error?.message || 'Failed to create relief partner assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-12 text-center">
        <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Wallet Not Connected</h3>
        <p className="text-gray-400">Please connect your MetaMask wallet to view your dashboard.</p>
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
        <h1 className="text-3xl font-bold text-white">Beneficiary Dashboard</h1>
        <p className="text-gray-400 mt-2">
          View your funds, assign relief partners, and track spending.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Funds Received"
          value={`₹${metrics.fundsReceived}`}
          icon={IndianRupee}
          subtitle="Total allocated funds"
        />
        <MetricCard
          title="Remaining Allowance"
          value={`₹${metrics.remainingAllowance}`}
          icon={Wallet}
          subtitle="Available to allocate"
        />
        <MetricCard
          title="Relief Partner Assignments"
          value={metrics.spendHistory}
          icon={ShoppingCart}
          subtitle="Total assignments created"
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
          title="Total Partner Transactions"
          value={metrics.totalTransactions}
          icon={FileText}
          subtitle="Assignments & spends"
        />
      </div>

      {/* Assign Funds to Relief Partner */}
      <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Assign Funds to Relief Partner</h2>
            <p className="text-sm text-gray-400">
              Allocate part of your beneficiary funds to trusted relief partners for execution.
            </p>
          </div>
          <ArrowRightCircle className="w-6 h-6 text-blue-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Source Beneficiary Fund
            </label>
            <select
              value={assignmentForm.beneficiaryFundId}
              onChange={(e) =>
                setAssignmentForm((prev) => ({ ...prev, beneficiaryFundId: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#392e4e] text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Select a fund...</option>
              {beneficiaryFunds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.category || 'General Fund'} — Remaining: {fund.remainingAmount.toFixed(2)} {fund.currency}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Relief Partner
            </label>
            <select
              value={assignmentForm.reliefPartnerId}
              onChange={(e) =>
                setAssignmentForm((prev) => ({ ...prev, reliefPartnerId: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#392e4e] text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Select a partner...</option>
              {filteredPartners.map((partner) => (
                <option key={partner.uid} value={partner.uid}>
                  {partner.displayName || partner.email} ({partner.organization || 'Individual'})
                </option>
              ))}
            </select>
            {assignmentForm.beneficiaryFundId && !selectedFund?.category && (
              <p className="text-[10px] text-orange-500 mt-1">⚠️ Selecting a fund with a category will filter partners.</p>
            )}
            {assignmentForm.reliefPartnerId && reliefPartners.find(p => p.uid === assignmentForm.reliefPartnerId) && (
              <div className="mt-2 text-xs text-gray-400 bg-[#1a1a2e] p-2 rounded">
                {(() => {
                  const partner = reliefPartners.find(p => p.uid === assignmentForm.reliefPartnerId) as any;
                  return (
                    <>
                      {(partner.reliefCategories || partner.reliefCategory) && (
                        <p>📁 Categories: <span className="text-blue-400">
                          {partner.reliefCategories ? partner.reliefCategories.join(', ') : partner.reliefCategory}
                        </span></p>
                      )}
                      {partner.walletAddress && <p>💰 Wallet: <span className="text-green-400 font-mono text-xs break-all">{partner.walletAddress.substring(0, 10)}...{partner.walletAddress.substring(partner.walletAddress.length - 8)}</span></p>}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={assignmentForm.amount}
              onChange={(e) =>
                setAssignmentForm((prev) => ({ ...prev, amount: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#392e4e] text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
              placeholder="Enter amount to assign"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Category (optional)</label>
            <select
              value={assignmentForm.category || ''}
              onChange={(e) =>
                setAssignmentForm((prev) => ({ ...prev, category: e.target.value || undefined }))
              }
              className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#392e4e] text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">No specific category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Purpose / Notes (optional)
          </label>
          <textarea
            rows={3}
            value={assignmentForm.purpose}
            onChange={(e) =>
              setAssignmentForm((prev) => ({ ...prev, purpose: e.target.value }))
            }
            className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#392e4e] text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
            placeholder="Describe how the relief partner should use these funds..."
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleCreateAssignment}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {submitting ? 'Assigning...' : 'Assign Funds to Partner'}
          </button>
        </div>
      </div>

      {/* Assigned Relief Partners & Spending Tracking */}
      <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Assigned Relief Partners</h2>
            <p className="text-sm text-gray-400">
              Track how much each relief partner has been allocated and spent.
            </p>
          </div>
          <Users className="w-6 h-6 text-blue-500" />
        </div>

        {partnerStats.length === 0 ? (
          <p className="text-sm text-gray-400 mt-4">
            No relief partners have been assigned yet. Use the form above to create your first
            assignment.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {partnerStats.map((ps) => (
              <div
                key={ps.partner?.uid || ps.assignments[0]?.reliefPartnerId}
                className="border border-[#392e4e] rounded-lg p-4 bg-[#1a1a2e]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-white">
                      {ps.partner?.displayName || ps.partner?.email || 'Relief Partner'}
                    </p>
                    {ps.partner?.organization && (
                      <p className="text-xs text-gray-400">{ps.partner.organization}</p>
                    )}
                    {ps.partner?.email && (
                      <p className="text-xs text-gray-500">{ps.partner.email}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-400">Total Assigned</p>
                    <p className="font-semibold text-white">
                      ₹{ps.totalAssigned.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm">
                  <div>
                    <p className="text-gray-400">Spent</p>
                    <p className="font-semibold text-green-400">
                      ₹{ps.totalSpent.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Remaining</p>
                    <p className="font-semibold text-orange-400">
                      ₹{ps.totalRemaining.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Assignments</p>
                    <p className="font-semibold text-white">
                      {ps.assignments.length}
                    </p>
                  </div>
                </div>

                <div className="mt-3 border-t border-[#392e4e] pt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Recent Assignments
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {ps.assignments.slice(0, 4).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between text-xs bg-[#0a0a1a] border border-[#392e4e] rounded-md px-3 py-2"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-300">
                            {a.purpose || 'General support'}
                          </p>
                          <p className="text-gray-500">
                            Assigned:{' '}
                            {a.assignedAt
                              ? new Date(a.assignedAt).toLocaleDateString()
                              : '—'}
                            {a.category && ` • Category: ${a.category}`}
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="font-semibold text-white">
                            ₹{a.amount.toFixed(2)}
                          </p>
                          <p className="text-gray-400 capitalize">
                            {a.status}
                          </p>
                        </div>
                      </div>
                    ))}
                    {ps.assignments.length > 4 && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        + {ps.assignments.length - 4} more assignments
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
