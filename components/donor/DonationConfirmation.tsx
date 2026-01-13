'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, X, Download, Share2, XCircle } from 'lucide-react';
import { Receipt } from '@/lib/types/database';

interface DonationConfirmationProps {
  receipt: Receipt;
  onClose: () => void;
}

export default function DonationConfirmation({ receipt, onClose }: DonationConfirmationProps) {
  const [copied, setCopied] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);

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

  const handleDownloadReceipt = () => {
    // TODO: Implement receipt download as PDF
    console.log('Download receipt:', receipt.id);
  };

  const handleShareReceipt = () => {
    // TODO: Implement receipt sharing
    console.log('Share receipt:', receipt.id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Donation Successful!</h2>
            <p className="text-gray-600">Your donation has been recorded and a receipt has been generated.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Receipt Number</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-semibold text-gray-900">{receipt.receiptNumber}</p>
                  <button
                    onClick={handleCopyReceiptNumber}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="font-semibold text-lg text-gray-900">
                  {receipt.amountDisplay} {receipt.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="text-gray-900">
                  {new Date(receipt.createdAt).toLocaleDateString()} {new Date(receipt.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  receipt.status === 'verified' ? 'bg-green-100 text-green-800' :
                  receipt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                </span>
              </div>
            </div>

            {receipt.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{receipt.description}</p>
              </div>
            )}

            {receipt.transactionHash && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Transaction Hash</p>
                <p className="font-mono text-sm text-gray-900 break-all">{receipt.transactionHash}</p>
              </div>
            )}
          </div>

          {/* QR Code Display */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center mb-6">
            <p className="text-sm font-medium text-gray-700 mb-4">Receipt QR Code</p>
            {qrLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : qrImage ? (
              <>
                <img src={qrImage} alt="Receipt QR Code" className="mx-auto max-w-xs" />
                <p className="text-xs text-gray-500 mt-4">Scan to verify receipt</p>
              </>
            ) : (
              <p className="text-sm text-gray-500 py-4">QR code not available</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownloadReceipt}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handleShareReceipt}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
