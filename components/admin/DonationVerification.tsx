'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { donationService, receiptService } from '@/lib/firebase/services/index';
import { Donation, Receipt } from '@/lib/types/database';
import { useWallet } from '@/hooks/useWallet';
import { getReliefTokenContract, reliefTokenFunctions } from '@/lib/contracts/reliefToken';
import { CheckCircle, XCircle, Clock, Eye, Loader2, AlertCircle, QrCode } from 'lucide-react';

export default function DonationVerification() {
  const { profile } = useAuth();
  const { signer, isConnected } = useWallet();
  const [pendingDonations, setPendingDonations] = useState<Donation[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [donationReceipts, setDonationReceipts] = useState<Record<string, Receipt>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingDonations();
  }, [showAll]);

  const loadPendingDonations = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading donations...');

      // Load all donations first to see what we have
      const all = await donationService.getAll().catch(err => {
        console.error('Error loading all donations:', err);
        return [];
      });

      console.log('Total donations found:', all.length);
      setAllDonations(all);

      // Filter pending donations
      const pending = all.filter(d => d.status === 'pending');
      console.log('Pending donations:', pending.length);
      setPendingDonations(pending);

      // Load receipts for all donations
      const receiptsMap: Record<string, Receipt> = {};
      const donationsToProcess = showAll ? all : pending;

      for (const donation of donationsToProcess) {
        if (donation.id) {
          try {
            const receipts = await receiptService.getByDonation(donation.id).catch(() => []);
            if (receipts.length > 0) {
              receiptsMap[donation.id] = receipts[0]; // Get first receipt
            }
          } catch (error) {
            console.error(`Error loading receipt for donation ${donation.id}:`, error);
          }
        }
      }
      setDonationReceipts(receiptsMap);
    } catch (error: any) {
      console.error('Error loading donations:', error);
      setError(error.message || 'Failed to load donations. Check browser console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (donationId: string) => {
    if (!profile?.uid) return;

    setProcessing(donationId);
    try {
      // 1. Verify on-chain if possible
      const donation = pendingDonations.find(d => d.id === donationId) || allDonations.find(d => d.id === donationId);
      if (donation && donation.onChainId !== undefined && signer && isConnected) {
        try {
          const contract = getReliefTokenContract(signer);
          await reliefTokenFunctions.verifyDonation(contract, donation.onChainId);
        } catch (contractError: any) {
          console.error('Failed to verify on-chain:', contractError);
          // If the reason is "already verified" or similar, we might want to continue
          if (contractError?.message?.includes('already verified')) {
            console.log('Donation already verified on-chain, proceeding with Firestore update.');
          } else {
            throw new Error(`On-chain verification failed: ${contractError.message || 'Unknown error'}`);
          }
        }
      }

      // 2. Update Firestore
      await donationService.verify(donationId, profile.uid);
      await loadPendingDonations();
    } catch (error: any) {
      console.error('Error verifying donation:', error);
      alert(`Failed to verify donation: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (donationId: string, reason: string) => {
    if (!profile?.uid || !reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(donationId);
    try {
      await donationService.reject(donationId, profile.uid, reason);
      await loadPendingDonations();
    } catch (error) {
      console.error('Error rejecting donation:', error);
      alert('Failed to reject donation');
    } finally {
      setProcessing(null);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Donation Verification</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {showAll ? 'Show Pending Only' : 'Show All Donations'}
          </button>
          <button
            onClick={loadPendingDonations}
            disabled={loading}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Error loading donations</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-1">Check browser console (F12) for details</p>
            </div>
          </div>
        </div>
      )}

      {(() => {
        const donationsToShow = showAll ? allDonations : pendingDonations;

        if (donationsToShow.length === 0) {
          return (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {showAll ? 'No Donations Found' : 'All Clear!'}
              </h3>
              <p className="text-gray-600">
                {showAll
                  ? 'No donations have been made yet.'
                  : 'No pending donations to verify.'}
              </p>
              {allDonations.length > 0 && !showAll && (
                <p className="text-sm text-gray-500 mt-2">
                  Total donations: {allDonations.length} |
                  Pending: {pendingDonations.length} |
                  Verified: {allDonations.filter(d => d.status === 'verified').length}
                </p>
              )}
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {showAll && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Showing all donations ({allDonations.length} total).
                  Pending: {pendingDonations.length} |
                  Verified: {allDonations.filter(d => d.status === 'verified').length} |
                  Rejected: {allDonations.filter(d => d.status === 'rejected').length}
                </p>
              </div>
            )}
            {donationsToShow.map((donation) => (
              <div
                key={donation.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-semibold text-lg text-gray-900">
                        {donation.amountDisplay} {donation.currency}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          donation.status === 'verified' ? 'bg-green-100 text-green-800' :
                            donation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                        {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Donor</p>
                        <p className="font-medium text-gray-900">{donation.donorName || donation.donorEmail}</p>
                        <p className="text-xs text-gray-500 font-mono">{donation.donorId}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(donation.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {donation.category && (
                        <div>
                          <p className="text-gray-600 mb-1">Category</p>
                          <p className="font-medium text-gray-900">{donation.category}</p>
                        </div>
                      )}
                      {donation.transactionHash && (
                        <div>
                          <p className="text-gray-600 mb-1">Transaction Hash</p>
                          <p className="font-mono text-xs text-gray-900 break-all">{donation.transactionHash}</p>
                        </div>
                      )}
                    </div>

                    {donation.description && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Description</p>
                        <p className="text-gray-900">{donation.description}</p>
                      </div>
                    )}

                    {/* Receipt QR Code */}
                    {donationReceipts[donation.id] && (
                      <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <QrCode className="w-5 h-5 text-purple-600" />
                          <p className="text-sm font-medium text-purple-900">Donor Receipt QR Code</p>
                        </div>
                        <p className="text-xs text-purple-700 mb-2">
                          Receipt Number: {donationReceipts[donation.id].receiptNumber}
                        </p>
                        <ReceiptQRCode receipt={donationReceipts[donation.id]} />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedDonation(donation)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      {donation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleVerify(donation.id)}
                            disabled={processing === donation.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                          >
                            {processing === donation.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Verify
                              </>
                            )}
                          </button>
                          <RejectButton
                            donationId={donation.id}
                            onReject={handleReject}
                            processing={processing === donation.id}
                          />
                        </>
                      )}
                      {donation.status === 'verified' && (
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                          ✓ Verified
                        </span>
                      )}
                      {donation.status === 'rejected' && (
                        <span className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium">
                          ✗ Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {selectedDonation && (
        <DonationDetailModal
          donation={selectedDonation}
          receipt={donationReceipts[selectedDonation.id]}
          onClose={() => setSelectedDonation(null)}
          onVerify={() => {
            handleVerify(selectedDonation.id);
            setSelectedDonation(null);
          }}
          onReject={(reason) => {
            handleReject(selectedDonation.id, reason);
            setSelectedDonation(null);
          }}
        />
      )}
    </div>
  );
}

function RejectButton({ donationId, onReject, processing }: { donationId: string; onReject: (id: string, reason: string) => void; processing: boolean }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onReject(donationId, reason);
      setReason('');
      setShowRejectForm(false);
    }
  };

  if (showRejectForm) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 flex-1">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Rejection reason..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          autoFocus
        />
        <button
          type="submit"
          disabled={!reason.trim() || processing}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
        >
          Submit
        </button>
        <button
          type="button"
          onClick={() => {
            setShowRejectForm(false);
            setReason('');
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setShowRejectForm(true)}
      disabled={processing}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
    >
      <XCircle className="w-4 h-4" />
      Reject
    </button>
  );
}

function ReceiptQRCode({ receipt }: { receipt: Receipt }) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQRCode();
  }, [receipt]);

  const loadQRCode = async () => {
    try {
      setLoading(true);
      if (receipt.qrCodeData) {
        const qrData = JSON.parse(receipt.qrCodeData);
        const { generateQRCodeImage } = await import('@/lib/utils/qrcode');
        const image = await generateQRCodeImage(qrData);
        setQrImage(image);
      } else if (receipt.qrCodeImageUrl) {
        setQrImage(receipt.qrCodeImageUrl);
      }
    } catch (error) {
      console.error('Error loading QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!qrImage) {
    return <p className="text-xs text-gray-500">QR code not available</p>;
  }

  return (
    <div className="text-center">
      <img src={qrImage} alt="Receipt QR Code" className="mx-auto max-w-[150px]" />
      <p className="text-xs text-purple-600 mt-2">Scan to verify receipt</p>
    </div>
  );
}

function DonationDetailModal({
  donation,
  receipt,
  onClose,
  onVerify,
  onReject,
}: {
  donation: Donation;
  receipt?: Receipt;
  onClose: () => void;
  onVerify: () => void;
  onReject: (reason: string) => void;
}) {
  const [rejectReason, setRejectReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Donation Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="font-semibold text-lg text-gray-900">
                  {donation.amountDisplay} {donation.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {donation.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Donor</p>
                <p className="font-medium text-gray-900">{donation.donorName || donation.donorEmail}</p>
                <p className="text-xs text-gray-500 font-mono">{donation.donorId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(donation.createdAt).toLocaleString()}
                </p>
              </div>
              {donation.category && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="font-medium text-gray-900">{donation.category}</p>
                </div>
              )}
              {donation.transactionHash && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Transaction Hash</p>
                  <p className="font-mono text-sm text-gray-900 break-all">{donation.transactionHash}</p>
                </div>
              )}
            </div>

            {donation.description && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{donation.description}</p>
              </div>
            )}

            {/* Receipt QR Code in Modal */}
            {receipt && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-medium text-gray-900">Donor Receipt QR Code</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-xs text-purple-700 mb-2">
                    Receipt: {receipt.receiptNumber}
                  </p>
                  <ReceiptQRCode receipt={receipt} />
                </div>
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Rejection Reason (if rejecting)</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={onVerify}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Verify Donation
              </button>
              <button
                onClick={() => onReject(rejectReason || 'No reason provided')}
                disabled={!rejectReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
