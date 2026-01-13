'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { donationService, receiptService } from '@/lib/firebase/services/index';
import MetricCard from '@/components/ui/MetricCard';
import DonationForm from '@/components/donor/DonationForm';
import DonationHistory from '@/components/donor/DonationHistory';
import DonationConfirmation from '@/components/donor/DonationConfirmation';
import {
  Heart,
  DollarSign,
  FileText,
  TrendingUp,
  Wallet,
  CheckCircle,
} from 'lucide-react';
import { formatEther } from 'ethers';

export default function DonorDashboard() {
  const { profile } = useAuth();
  const { address, provider, isConnected } = useWallet();
  const [metrics, setMetrics] = useState({
    totalDonated: '0.00',
    activeCampaigns: 0,
    donationHistory: 0,
    walletBalance: '0.00',
    totalTransactions: 0,
    verifiedDonations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationReceipt, setConfirmationReceipt] = useState<any>(null);

  useEffect(() => {
    if (profile?.uid) {
      loadMetrics();
    }
  }, [profile, address, provider]);

  const loadMetrics = async () => {
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

      // Load donations and receipts
      const [donations, receipts] = await Promise.all([
        donationService.getByDonor(profile.uid).catch(() => []),
        receiptService.getByPayer(profile.uid).catch(() => []),
      ]);

      const totalDonated = donations
        .filter((d) => d.status === 'verified' || d.status === 'distributed')
        .reduce((sum, d) => sum + parseFloat(d.amountDisplay || '0'), 0);

      const verifiedCount = donations.filter((d) => d.status === 'verified').length;

      setMetrics({
        totalDonated: totalDonated.toFixed(2),
        activeCampaigns: donations.filter((d) => d.status === 'pending').length,
        donationHistory: donations.length,
        walletBalance: balance,
        totalTransactions: receipts.length,
        verifiedDonations: verifiedCount,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonationSubmit = async (data: {
    amount: string;
    category?: string;
    description?: string;
    transactionHash: string;
  }) => {
    if (!profile) throw new Error('User not authenticated');

    try {
      // Create donation record
      const donationId = await donationService.create({
        donorId: profile.uid,
        donorEmail: profile.email,
        donorName: profile.displayName,
        amount: parseFloat(data.amount) * 1e18,
        amountDisplay: data.amount,
        currency: 'USDT',
        category: data.category,
        description: data.description,
        status: 'pending',
        transactionHash: data.transactionHash,
      });

      // Create receipt
      const receiptId = await receiptService.create({
        donationId,
        payerId: profile.uid,
        payerEmail: profile.email,
        payerName: profile.displayName,
        amount: parseFloat(data.amount) * 1e18,
        amountDisplay: data.amount,
        currency: 'USDT',
        category: data.category,
        description: data.description,
        status: 'pending',
        qrCodeData: '',
        transactionHash: data.transactionHash,
      });

      // Get the created receipt
      const receipt = await receiptService.get(receiptId);
      if (receipt) {
        // Generate QR code data
        const verificationUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/receipt/${receipt.id}`
          : undefined;
        const qrData = receiptService.createQRData(receipt, verificationUrl);
        const qrCodeData = JSON.stringify(qrData);

        // Update receipt with QR code data
        await receiptService.update(receiptId, { qrCodeData });

        // Generate QR code image
        try {
          const { generateQRCodeImage } = await import('@/lib/utils/qrcode');
          const qrImage = await generateQRCodeImage(qrData);

          // Update receipt with QR code image URL
          await receiptService.updateQRImageUrl(receiptId, qrImage);
        } catch (error) {
          console.error('Error generating QR code image:', error);
        }

        // Reload stats
        await loadMetrics();

        // Show confirmation
        const updatedReceipt = await receiptService.get(receiptId);
        if (updatedReceipt) {
          setConfirmationReceipt(updatedReceipt);
          setShowConfirmation(true);
        }
      }
    } catch (error: any) {
      console.error('Error submitting donation:', error);
      throw new Error(error.message || 'Failed to submit donation');
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Donor Dashboard</h1>
        <p className="text-gray-600 mt-2">Make donations and track your contribution history</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Donated"
          value={`$${metrics.totalDonated}`}
          icon={Heart}
          subtitle="All time contributions"
        />
        <MetricCard
          title="Active Campaigns"
          value={metrics.activeCampaigns}
          icon={TrendingUp}
          subtitle="Pending donations"
        />
        <MetricCard
          title="Donation History"
          value={metrics.donationHistory}
          icon={FileText}
          subtitle="Total donations"
        />
        <MetricCard
          title="Verified Donations"
          value={metrics.verifiedDonations}
          icon={CheckCircle}
          subtitle="Confirmed by admin"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Wallet Balance"
          value={`${metrics.walletBalance} ETH`}
          icon={Wallet}
          subtitle={isConnected ? 'Connected wallet' : 'Not connected'}
        />
        <MetricCard
          title="Total Receipts"
          value={metrics.totalTransactions}
          icon={FileText}
          subtitle="Receipts generated"
        />
      </div>

      {/* Donation Form and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Make a Donation</h2>
          <DonationForm onDonationSubmit={handleDonationSubmit} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Donation History</h2>
          <DonationHistory />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && confirmationReceipt && (
        <DonationConfirmation
          receipt={confirmationReceipt}
          onClose={() => {
            setShowConfirmation(false);
            setConfirmationReceipt(null);
          }}
        />
      )}
    </div>
  );
}
