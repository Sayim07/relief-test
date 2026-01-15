'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { reliefPartnerAssignmentService } from '@/lib/firebase/services/reliefPartnerAssignmentService';
import { receiptService } from '@/lib/firebase/services/receiptService';
import type {
  ReliefPartnerAssignment,
  Receipt,
} from '@/lib/types/database';
import MetricCard from '@/components/ui/MetricCard';
import {
  Wallet,
  FileText,
  AlertCircle,
  DollarSign,
  ShoppingCart,
  Receipt as ReceiptIcon,
  ArrowRight,
} from 'lucide-react';
import { getReliefTokenContract, reliefTokenFunctions } from '@/lib/contracts/reliefToken';
import { parseEther } from 'ethers';

interface MetricsState {
  assignedFunds: string;
  remainingFunds: string;
  totalSpent: string;
  activeAssignments: number;
  totalReceipts: number;
}

interface SpendingFormState {
  assignmentId: string;
  amount: string;
  description: string;
  recipient: string;
}

export default function ReliefPartnerDashboard() {
  const { profile } = useAuth();
  const { isConnected, signer } = useWallet();

  const [metrics, setMetrics] = useState<MetricsState>({
    assignedFunds: '0.00',
    remainingFunds: '0.00',
    totalSpent: '0.00',
    activeAssignments: 0,
    totalReceipts: 0,
  });
  const [assignments, setAssignments] = useState<ReliefPartnerAssignment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [spendingForm, setSpendingForm] = useState<SpendingFormState>({
    assignmentId: '',
    amount: '',
    description: '',
    recipient: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isConnected && profile?.uid) {
      loadDashboard();
    }
  }, [isConnected, profile]);

  const loadDashboard = async () => {
    if (!profile?.uid) return;
    try {
      setLoading(true);

      const [assignments, receipts] = await Promise.all([
        reliefPartnerAssignmentService.getByReliefPartner(profile.uid).catch(() => []),
        receiptService.getByPayer(profile.uid).catch(() => []),
      ]);

      const assignedTotal = assignments.reduce(
        (sum, a) => sum + (a.amount || 0),
        0
      );
      const spentTotal = assignments.reduce(
        (sum, a) => sum + (a.spentAmount || 0),
        0
      );
      const remainingTotal = assignments.reduce(
        (sum, a) => sum + (a.remainingAmount || 0),
        0
      );

      setMetrics({
        assignedFunds: assignedTotal.toFixed(2),
        remainingFunds: remainingTotal.toFixed(2),
        totalSpent: spentTotal.toFixed(2),
        activeAssignments: assignments.filter((a) => a.status === 'active').length,
        totalReceipts: receipts.length,
      });

      setAssignments(assignments);
      setReceipts(receipts);
    } catch (error) {
      console.error('Error loading relief partner dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeAssignments = useMemo(
    () => assignments.filter((a) => a.status === 'active'),
    [assignments]
  );

  const handleSubmitSpending = async () => {
    if (!profile?.uid) return;
    const { assignmentId, amount, description } = spendingForm;

    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      alert('Please select an assignment');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (numericAmount > assignment.remainingAmount) {
      alert('Amount exceeds remaining assignment balance');
      return;
    }

    try {
      setSubmitting(true);

      let transactionHash: string | undefined;

      // 1. On-chain transfer if wallet is connected
      if (signer && isConnected) {
        if (!spendingForm.recipient) {
          alert('Please provide a recipient address for on-chain transfer');
          setSubmitting(false);
          return;
        }

        try {
          console.log('Executing on-chain transfer...');
          const contract = getReliefTokenContract(signer);
          const amountWei = parseEther(amount);

          const tx = await contract.transferWithCategory(
            spendingForm.recipient,
            amountWei,
            assignment.category || 'general'
          );
          const receipt = await tx.wait();
          transactionHash = receipt?.hash || tx.hash;
        } catch (contractError: any) {
          console.error('On-chain transfer failed:', contractError);
          throw new Error(`On-chain transfer failed: ${contractError.message || 'Unknown error'}`);
        }
      }
      // 2. Create receipt in Firestore
      const receiptId = await receiptService.create({
        donationId: undefined,
        assignmentId: assignment.id,
        payerId: profile.uid,
        payerEmail: profile.email || '',
        payerName: profile.displayName || '',
        recipientId: assignment.beneficiaryId,
        recipientEmail: assignment.beneficiaryEmail || '',
        recipientName: assignment.beneficiaryName || '',
        amount: numericAmount,
        amountDisplay: `$${numericAmount.toFixed(2)}`,
        currency: assignment.currency,
        category: assignment.category,
        description: description || assignment.purpose || 'Relief partner spending',
        status: 'pending',
        qrCodeData: '',
        qrCodeImageUrl: undefined,
        transactionHash: transactionHash,
        metadata: {
          type: 'relief_partner_spend',
          assignmentId: assignment.id
        }
      });

      // 3. Update assignment totals in Firestore
      await reliefPartnerAssignmentService.updateSpentAmount(
        assignment.id,
        numericAmount
      );

      // 4. Reset form
      setSpendingForm({
        assignmentId: '',
        amount: '',
        description: '',
        recipient: '',
      });

      await loadDashboard();
      alert('Spending submitted and recorded successfully both on-chain and in database!');
    } catch (error: any) {
      console.error('Error submitting spending:', error);
      alert(error?.message || 'Failed to submit spending');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-12 text-center">
        <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Wallet Not Connected
        </h3>
        <p className="text-gray-400">
          Please connect your MetaMask wallet to view your relief partner dashboard.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Relief Partner Dashboard</h1>
        <p className="text-gray-400 mt-2">
          View your assigned funds, submit spending with receipts, and track your history.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Assigned Funds"
          value={`$${metrics.assignedFunds}`}
          icon={DollarSign}
          subtitle="Total funds assigned to you"
        />
        <MetricCard
          title="Remaining Funds"
          value={`$${metrics.remainingFunds}`}
          icon={Wallet}
          subtitle="Available to spend"
        />
        <MetricCard
          title="Total Spent"
          value={`$${metrics.totalSpent}`}
          icon={ShoppingCart}
          subtitle="Reported spending"
        />
        <MetricCard
          title="Receipts Submitted"
          value={metrics.totalReceipts}
          icon={ReceiptIcon}
          subtitle="Awaiting / completed verification"
        />
      </div>

      {/* Assigned Funds List */}
      <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Assigned Funds</h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-gray-400">
            You don&apos;t have any assigned funds yet.
          </p>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="border border-[#392e4e] rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#1a1a2e]"
              >
                <div>
                  <p className="font-semibold text-white">
                    {a.beneficiaryName || a.beneficiaryEmail || 'Beneficiary'}
                  </p>
                  <p className="text-sm text-gray-400">
                    Assignment: {a.amountDisplay} {a.currency} • Status:{' '}
                    <span className="capitalize">{a.status}</span>
                  </p>
                  {a.purpose && (
                    <p className="text-xs text-gray-500 mt-1">
                      Purpose: {a.purpose}
                    </p>
                  )}
                  {a.category && (
                    <p className="text-xs text-gray-500">
                      Category: {a.category}
                    </p>
                  )}
                </div>
                <div className="text-sm text-right md:text-left">
                  <p className="text-gray-400">
                    Spent:{' '}
                    <span className="font-semibold text-green-400">
                      ${a.spentAmount.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-gray-400">
                    Remaining:{' '}
                    <span className="font-semibold text-orange-400">
                      ${a.remainingAmount.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Assigned:{' '}
                    {a.assignedAt
                      ? new Date(a.assignedAt).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spending Submission */}
      <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Submit Spending &amp; Create Receipt
        </h2>
        {activeAssignments.length === 0 ? (
          <p className="text-sm text-gray-400">
            You currently have no active assignments to spend from.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Assignment
                </label>
                <select
                  value={spendingForm.assignmentId}
                  onChange={(e) =>
                    setSpendingForm((prev) => ({
                      ...prev,
                      assignmentId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#392e4e] text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Select assignment...</option>
                  {activeAssignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.beneficiaryName || a.beneficiaryEmail || 'Beneficiary'} — Remaining:{' '}
                      {a.remainingAmount.toFixed(2)} {a.currency}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={spendingForm.amount}
                  onChange={(e) =>
                    setSpendingForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#392e4e] text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Amount spent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Recipient Address (Wallet)
                </label>
                <input
                  type="text"
                  value={spendingForm.recipient}
                  onChange={(e) =>
                    setSpendingForm((prev) => ({
                      ...prev,
                      recipient: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#392e4e] text-white rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500/50"
                  placeholder="0x..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={spendingForm.description}
                  onChange={(e) =>
                    setSpendingForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-[#1a1a2e] border border-[#392e4e] text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
                  placeholder="What was this used for?"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmitSpending}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit Spending & Create Receipt'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              A receipt with a QR code will be generated automatically. Admins can later verify
              this receipt as part of the audit trail.
            </p>
          </>
        )}
      </div>

      {/* Spending & Receipt History */}
      <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Spending &amp; Receipt History
        </h2>
        {receipts.length === 0 ? (
          <p className="text-sm text-gray-400">
            You haven&apos;t submitted any receipts yet.
          </p>
        ) : (
          <div className="space-y-3">
            {receipts.map((r) => (
              <div
                key={r.id}
                className="border border-[#392e4e] rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#1a1a2e]"
              >
                <div>
                  <p className="font-semibold text-white">
                    {r.amountDisplay} {r.currency}{' '}
                    <span className="text-xs text-gray-400">
                      ({r.status.toUpperCase()})
                    </span>
                  </p>
                  {r.description && (
                    <p className="text-sm text-gray-400 mt-1">{r.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Receipt: {r.receiptNumber}
                  </p>
                </div>
                <div className="text-sm text-right md:text-left">
                  <p className="text-gray-400">
                    Date:{' '}
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : '—'}
                  </p>
                  {r.qrCodeImageUrl && (
                    <a
                      href={r.qrCodeImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                    >
                      <ReceiptIcon className="w-3 h-3" />
                      View QR Code
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

