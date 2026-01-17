'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { donationService, receiptService, reliefRequestService } from '@/lib/firebase/services';
import MetricCard from '@/components/ui/MetricCard';
import DonationForm from '@/components/donor/DonationForm';
import DonationHistory from '@/components/donor/DonationHistory';
import DonationConfirmation from '@/components/donor/DonationConfirmation';
import type { ReliefRequest } from '@/lib/types/database';
import {
  Heart,
  IndianRupee,
  FileText,
  TrendingUp,
  Wallet,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import { formatEther, parseEther } from 'ethers';
import { getReliefTokenContract, reliefTokenFunctions } from '@/lib/contracts/reliefToken';
import { GlobalSpotlight } from '@/components/MagicBento';

export default function DonorDashboard() {
  const { profile } = useAuth();
  const { address, provider, isConnected, signer } = useWallet();
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
  const [reliefRequests, setReliefRequests] = useState<ReliefRequest[]>([]);
  const [requestLoading, setRequestLoading] = useState(true);

  // MagicBento Ref
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.uid) {
      loadMetrics();
      loadReliefRequests();
    }
  }, [profile, address, provider]);

  const loadReliefRequests = async () => {
    try {
      setRequestLoading(true);
      const data = await reliefRequestService.getByStatus('verified');
      setReliefRequests(data);
    } catch (error) {
      console.error('Error loading relief requests:', error);
    } finally {
      setRequestLoading(false);
    }
  };

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
      // Record on-chain metadata if wallet is connected
      let onChainId: number | undefined;
      if (signer && isConnected) {
        try {
          const contract = getReliefTokenContract(signer);
          const amountWei = parseEther(data.amount);

          const receipt = await reliefTokenFunctions.donate(
            contract,
            amountWei,
            data.category || 'general',
            data.description || 'Donation via ReliefChain',
            data.transactionHash
          );

          // Extract donationId from logs
          if (receipt && receipt.logs) {
            for (const log of receipt.logs) {
              try {
                const parsedLog = contract.interface.parseLog(log);
                if (parsedLog && parsedLog.name === 'DonationRecorded') {
                  onChainId = Number(parsedLog.args.donationId);
                  break;
                }
              } catch (e) {
                // Ignore logs that don't belong to this contract or can't be parsed
              }
            }
          }
        } catch (contractError) {
          console.error('Failed to record metadata on-chain:', contractError);
          // Continue to Firestore even if metadata recording fails for better UX
        }
      }

      // Create donation record in Firestore
      const donationRecord: any = {
        donorId: profile.uid,
        donorEmail: profile.email,
        donorName: profile.displayName,
        amount: parseFloat(data.amount) * 1e18,
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
      };

      // Only add onChainId if it was successfully set
      if (onChainId !== undefined) {
        donationRecord.onChainId = onChainId;
      }

      const donationId = await donationService.create(donationRecord);

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
    <div className="space-y-6 bento-section" ref={gridRef}>
      <div className="fixed inset-0 pointer-events-none z-100">
        <GlobalSpotlight gridRef={gridRef} />
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Donor Dashboard</h1>
        <p className="text-gray-400 mt-2">Make donations and track your contribution history</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Donated"
          value={`₹${metrics.totalDonated}`}
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

      {/* Verified Relief Requests (Option A: Direct Donation) */}
      <div className="bg-[#0a0a1a]/50 backdrop-blur-xl rounded-[2rem] border border-[#392e4e] p-8 shadow-2xl overflow-hidden relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-blue-500" /> Direct Relief Requests
            </h2>
            <p className="text-gray-400 mt-1 font-medium italic">Verified by ReliefChain Admins • Donate directly to beneficiaries</p>
          </div>
          <div className="hidden sm:flex px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-400/20 rounded-full text-[10px] font-black uppercase tracking-widest">
            Option A: Direct Path
          </div>
        </div>

        {requestLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : reliefRequests.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#392e4e] rounded-3xl">
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Verified Requests At The Moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reliefRequests.map(req => (
              <div
                key={req.id}
                className="bg-black/30 border border-[#392e4e] p-6 rounded-2xl hover:border-blue-500/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-red-500/10 text-red-500 rounded-full border border-red-500/20">
                      {req.urgency} Urgency
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                      {req.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{req.name}</h3>
                  <p className="text-gray-500 text-xs mb-4 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {req.location}
                  </p>
                  <p className="text-sm text-gray-400 line-clamp-2 italic mb-6">"{req.description}"</p>
                </div>

                <div className="pt-6 border-t border-[#392e4e] space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Approved Amount</p>
                      <p className="text-2xl font-black text-green-400">₹{req.approvedAmount?.toLocaleString()}</p>
                    </div>
                  </div>

                  <button
                    disabled={!isConnected || !req.beneficiaryWallet}
                    onClick={() => {
                      if (!isConnected) {
                        alert('Please connect your wallet first');
                        return;
                      }
                      // For now, prompt amount or use default
                      const amountStr = prompt(`Enter donation amount for ${req.name} (ETH):`, '0.1');
                      if (amountStr && signer) {
                        signer.sendTransaction({
                          to: req.beneficiaryWallet,
                          value: parseEther(amountStr)
                        }).then(tx => {
                          alert(`Transaction sent! Hash: ${tx.hash}`);
                          // Ideally track this in Firestore too
                        }).catch(err => {
                          console.error('Donation failed:', err);
                          alert('Donation failed. See console for details.');
                        });
                      }
                    }}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                  >
                    {!req.beneficiaryWallet ? 'NO WALLET LINKED' : isConnected ? 'DONATE DIRECTLY' : 'CONNECT WALLET'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Donation Form and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#060010] rounded-xl shadow-sm border border-[#392e4e] p-6 text-white">
          <h2 className="text-lg font-semibold text-white mb-4">Make a Donation</h2>
          <DonationForm onDonationSubmit={handleDonationSubmit} />
        </div>
        <div className="bg-[#060010] rounded-xl shadow-sm border border-[#392e4e] p-6 text-white">
          <h2 className="text-lg font-semibold text-white mb-4">Donation History</h2>
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
