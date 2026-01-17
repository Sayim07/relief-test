'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { donationService, receiptService } from '@/lib/firebase/services/index';
import { Donation } from '@/lib/types/database';
import { Receipt } from '@/lib/types/database';
import DonationForm from './DonationForm';
import DonationHistory from './DonationHistory';
import DonationConfirmation from './DonationConfirmation';
import NetworkSwitch from '@/components/NetworkSwitch';
import { IndianRupee, TrendingUp, FileText, Wallet, Heart, Loader2 } from 'lucide-react';

export default function DonorDashboard() {
  const { profile } = useAuth();
  const { address, isConnected } = useWallet();
  const [stats, setStats] = useState({
    totalDonated: 0,
    totalDonations: 0,
    totalReceipts: 0,
    pendingDonations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationReceipt, setConfirmationReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (profile?.uid) {
      loadStats();
    }
  }, [profile]);

  const loadStats = async () => {
    if (!profile?.uid) return;

    try {
      setLoading(true);
      const [donations, receipts] = await Promise.all([
        donationService.getByDonor(profile.uid),
        receiptService.getByPayer(profile.uid),
      ]);

      const totalDonated = donations
        .filter((d: Donation) => d.status === 'verified' || d.status === 'distributed')
        .reduce((sum: number, d: Donation) => sum + parseFloat(d.amountDisplay || '0'), 0);

      const pendingDonations = donations.filter((d: Donation) => d.status === 'pending').length;

      setStats({
        totalDonated,
        totalDonations: donations.length,
        totalReceipts: receipts.length,
        pendingDonations,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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
        amount: parseFloat(data.amount) * 1e18, // Convert to wei (assuming 18 decimals)
        amountDisplay: data.amount,
        currency: 'INR',
        category: data.category,
        description: data.description,
        status: 'pending',
        donationType: 'general', // Default to general pool
        verification: {
          method: 'auto',
          status: 'pending',
          riskScore: 0,
          transactionVerified: false,
          donorVerified: false,
          amountVerified: false,
        },
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
        currency: 'INR',
        category: data.category,
        description: data.description,
        status: 'pending',
        qrCodeData: '', // Will be set by service
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

          // Update receipt with QR code image URL (data URL)
          await receiptService.updateQRImageUrl(receiptId, qrImage);
        } catch (error) {
          console.error('Error generating QR code image:', error);
        }

        // Reload stats
        await loadStats();

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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0a0a1a] rounded-lg shadow-lg p-6 border border-[#392e4e]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            ₹{stats.totalDonated.toFixed(2)}
          </h3>
          <p className="text-sm text-gray-600">Total Donated</p>
        </div>

        <div className="bg-[#0a0a1a] rounded-lg shadow-lg p-6 border border-[#392e4e]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {stats.totalDonations}
          </h3>
          <p className="text-sm text-gray-600">Total Donations</p>
        </div>

        <div className="bg-[#0a0a1a] rounded-lg shadow-lg p-6 border border-[#392e4e]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {stats.totalReceipts}
          </h3>
          <p className="text-sm text-gray-600">Receipts</p>
        </div>

        <div className="bg-[#0a0a1a] rounded-lg shadow-lg p-6 border border-[#392e4e]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {stats.pendingDonations}
          </h3>
          <p className="text-sm text-gray-600">Pending</p>
        </div>
      </div>

      {/* Network Status - Disabled for testing */}
      {/* <NetworkSwitch /> */}

      {/* Wallet Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <Wallet className="w-5 h-5" />
            <span className="font-medium">Connect your wallet to make donations</span>
          </div>
        </div>
      )}

      {/* Donation Form */}
      <div className="bg-[#0a0a1a] rounded-lg shadow-lg p-8 border border-[#392e4e]">
        <h2 className="text-2xl font-bold text-white mb-6">Make a Donation</h2>
        <DonationForm onDonationSubmit={handleDonationSubmit} />
      </div>

      {/* Donation History */}
      <div className="bg-[#0a0a1a] rounded-lg shadow-lg p-8 border border-[#392e4e]">
        <h2 className="text-2xl font-bold text-white mb-6">Donation History</h2>
        <DonationHistory />
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
