'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { donationService, receiptService } from '@/lib/firebase/services/index';
import { Donation } from '@/lib/types/database';
import { Receipt } from '@/lib/types/database';
import { Calendar, IndianRupee, FileText, Eye, Loader2, CheckCircle, Clock, XCircle, X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function DonationHistory() {
  const { profile } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'donations' | 'receipts'>('donations');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (profile?.uid) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    if (!profile?.uid) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Loading donation history for user:', profile.uid);

      const [donationsData, receiptsData] = await Promise.all([
        donationService.getByDonor(profile.uid).catch(err => {
          console.error('Error loading donations:', err);
          if (err?.code === 'failed-precondition') {
            setError('Firestore index required. Please create the index from the error link in console.');
          }
          return [];
        }),
        receiptService.getByPayer(profile.uid).catch(err => {
          console.error('Error loading receipts:', err);
          if (err?.code === 'failed-precondition') {
            setError('Firestore index required. Please create the index from the error link in console.');
          }
          return [];
        }),
      ]);

      console.log('Loaded donations:', donationsData.length);
      console.log('Loaded receipts:', receiptsData.length);

      setDonations(donationsData);
      setReceipts(receiptsData);
    } catch (error: any) {
      console.error('Error loading donation history:', error);
      setError(error.message || 'Failed to load donation history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'distributed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'distributed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading donation history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#392e4e]">
        <div className="flex">
          <button
            onClick={() => setSelectedTab('donations')}
            className={`px-6 py-3 font-medium text-sm ${selectedTab === 'donations'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            Donations ({donations.length})
          </button>
          <button
            onClick={() => setSelectedTab('receipts')}
            className={`px-6 py-3 font-medium text-sm ${selectedTab === 'receipts'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            Receipts ({receipts.length})
          </button>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 flex items-center gap-2"
        >
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {selectedTab === 'donations' && (
        <div className="space-y-4">
          {donations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <IndianRupee className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No donations yet</p>
            </div>
          ) : (
            donations.map((donation) => (
              <div
                key={donation.id}
                className="bg-[#0a0a1a] border border-[#392e4e] rounded-lg p-6 hover:border-blue-500/30 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <IndianRupee className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-lg text-white">
                        {donation.amountDisplay} {donation.currency}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                        {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </div>
                      {donation.category && (
                        <span className="px-2 py-1 bg-[#1a1a2e] border border-[#392e4e] rounded text-xs text-gray-300">{donation.category}</span>
                      )}
                    </div>
                    {donation.description && (
                      <p className="text-gray-300 mb-2">{donation.description}</p>
                    )}
                    {donation.transactionHash && (
                      <p className="text-xs font-mono text-gray-500 break-all">
                        TX: {donation.transactionHash}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(donation.status)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedTab === 'receipts' && (
        <div className="space-y-4">
          {receipts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No receipts yet</p>
            </div>
          ) : (
            receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="bg-[#0a0a1a] border border-[#392e4e] rounded-lg p-6 hover:border-blue-500/30 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-lg text-white">
                        Receipt: {receipt.receiptNumber}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>
                        {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {receipt.amountDisplay} {receipt.currency}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(receipt.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {receipt.description && (
                      <p className="text-gray-300 mb-2">{receipt.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedReceipt(receipt)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedReceipt && (
        <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  );
}

function ReceiptModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadQRCode();
  }, [receipt]);

  const loadQRCode = async () => {
    try {
      const qrData = JSON.parse(receipt.qrCodeData);
      const { generateQRCodeImage } = await import('@/lib/utils/qrcode');
      const image = await generateQRCodeImage(qrData);
      setQrImage(image);
    } catch (error) {
      console.error('Error loading QR code:', error);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;

    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#060010',
        logging: false,
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`donation-receipt-${receipt.receiptNumber}.pdf`);
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#060010] border border-[#392e4e] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Receipt Details</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadReceipt}
                className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                title="Download PDF"
              >
                <Download className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="space-y-6" ref={receiptRef}>
            <div className="bg-[#0a0a1a] rounded-lg p-6 border border-[#392e4e]">
              {/* Receipt Header for PDF */}
              <div className="mb-6 text-center border-b border-[#392e4e] pb-4">
                <h3 className="text-xl font-bold text-white mb-1">Donation Receipt</h3>
                <p className="text-sm text-[#9ca3af]">Thank you for your support</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-[#9ca3af] mb-1">Receipt Number</p>
                  <p className="font-mono font-semibold text-white">{receipt.receiptNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-[#9ca3af] mb-1">Amount</p>
                  <p className="font-semibold text-lg text-white">
                    {receipt.amountDisplay} {receipt.currency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#9ca3af] mb-1">Date</p>
                  <p className="text-white">
                    {new Date(receipt.createdAt).toLocaleDateString()} {new Date(receipt.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#9ca3af] mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${receipt.status === 'verified' ? 'bg-[#dcfce7] text-[#166534]' :
                    receipt.status === 'pending' ? 'bg-[#fef9c3] text-[#854d0e]' :
                      'bg-[#f3f4f6] text-[#1f2937]'
                    }`}>
                    {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                  </span>
                </div>
              </div>

              {receipt.description && (
                <div className="mt-4 pt-4 border-t border-[#392e4e]">
                  <p className="text-sm text-[#9ca3af] mb-1">Description</p>
                  <p className="text-white">{receipt.description}</p>
                </div>
              )}

              {receipt.transactionHash && (
                <div className="mt-4 pt-4 border-t border-[#392e4e]">
                  <p className="text-sm text-[#9ca3af] mb-1">Transaction Hash</p>
                  <p className="font-mono text-sm text-[#d1d5db] break-all">{receipt.transactionHash}</p>
                </div>
              )}
            </div>

            {qrImage && (
              <div className="bg-[#0a0a1a] border border-[#392e4e] rounded-lg p-6 text-center">
                <p className="text-sm text-[#9ca3af] mb-4">QR Code</p>
                <img src={qrImage} alt="Receipt QR Code" className="mx-auto bg-white p-2 rounded-lg" />
                <p className="text-xs text-[#6b7280] mt-4">Scan to verify receipt</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
