'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, X, Download, Share2, XCircle } from 'lucide-react';
import { Receipt } from '@/lib/types/database';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DonationConfirmationProps {
  receipt: Receipt;
  onClose: () => void;
}

export default function DonationConfirmation({ receipt, onClose }: DonationConfirmationProps) {
  const [copied, setCopied] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadQRCode();
  }, [receipt]);

  const loadQRCode = async () => {
    try {
      setQrLoading(true);
      if (receipt.qrCodeData) {
        const qrData = JSON.parse(receipt.qrCodeData);
        const { generateQRCodeImage } = await import('@/lib/utils/qrcode');
        const image = await generateQRCodeImage(qrData);
        setQrImage(image);
      } else if (receipt.qrCodeImageUrl) {
        // Use existing QR code image URL
        setQrImage(receipt.qrCodeImageUrl);
      }
    } catch (error) {
      console.error('Error loading QR code:', error);
    } finally {
      setQrLoading(false);
    }
  };

  const handleCopyReceiptNumber = () => {
    navigator.clipboard.writeText(receipt.receiptNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleShareReceipt = () => {
    // TODO: Implement receipt sharing
    console.log('Share receipt:', receipt.id);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#060010] border border-[#392e4e] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Receipt Content for PDF */}
          <div ref={receiptRef} className="p-4 bg-[#060010]">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-[#22c55e]/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-[#22c55e]" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Donation Successful!</h2>
              <p className="text-[#9ca3af]">Your donation has been recorded.</p>
            </div>

            <div className="bg-[#0a0a1a] rounded-lg p-6 mb-6 border border-[#392e4e]">
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

            {/* QR Code Display */}
            <div className="bg-[#0a0a1a] border border-[#392e4e] rounded-lg p-6 text-center mb-6">
              <p className="text-sm font-medium text-[#d1d5db] mb-4">Receipt QR Code</p>
              {qrLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb]"></div>
                </div>
              ) : qrImage ? (
                <>
                  <img src={qrImage} alt="Receipt QR Code" className="mx-auto max-w-xs bg-white p-2 rounded-lg" />
                  <p className="text-xs text-[#6b7280] mt-4">Scan to verify receipt</p>
                </>
              ) : (
                <p className="text-sm text-[#6b7280] py-4">QR code not available</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownloadReceipt}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[#392e4e] text-gray-300 rounded-lg hover:bg-white/5"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handleShareReceipt}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[#392e4e] text-gray-300 rounded-lg hover:bg-white/5"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
