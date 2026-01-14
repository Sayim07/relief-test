'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { receiptService } from '@/lib/firebase/services/receiptService';
import type { Receipt } from '@/lib/types/database';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface PageProps {
  params: { receiptNumber: string };
}

export default function ReceiptVerificationPage({ params }: PageProps) {
  const searchParams = useSearchParams();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReceipt = async () => {
      try {
        setLoading(true);
        setError(null);

        const r = await receiptService.getByReceiptNumber(params.receiptNumber);
        if (!r) {
          setError('Receipt not found. Please check the link or QR code.');
          return;
        }

        setReceipt(r);
      } catch (err: any) {
        console.error('Error loading receipt:', err);
        setError(err?.message || 'Failed to load receipt. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [params.receiptNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-700">Verifying receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h1 className="text-xl font-semibold text-gray-900">Receipt Verification Failed</h1>
          </div>
          <p className="text-gray-700 mb-2">{error}</p>
          <p className="text-sm text-gray-500">
            If you scanned this from a QR code, please ensure the code is valid and try again.
          </p>
        </div>
      </div>
    );
  }

  const isVerified = receipt.status === 'verified';
  const isRejected = receipt.status === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-6">
          {isVerified ? (
            <CheckCircle className="w-10 h-10 text-green-600" />
          ) : isRejected ? (
            <XCircle className="w-10 h-10 text-red-600" />
          ) : (
            <AlertCircle className="w-10 h-10 text-yellow-500" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isVerified
                ? 'Receipt Verified'
                : isRejected
                ? 'Receipt Rejected'
                : 'Receipt Pending Verification'}
            </h1>
            <p className="text-gray-600">
              Receipt Number: <span className="font-mono">{receipt.receiptNumber}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Amount</p>
            <p className="font-semibold text-lg text-gray-900">
              {receipt.amountDisplay} {receipt.currency}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isVerified
                  ? 'bg-green-100 text-green-800'
                  : isRejected
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {receipt.status.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Payer</p>
            <p className="font-medium text-gray-900">{receipt.payerName || receipt.payerEmail}</p>
            <p className="text-xs text-gray-500 font-mono">{receipt.payerId}</p>
          </div>
          {receipt.recipientEmail && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Recipient</p>
              <p className="font-medium text-gray-900">
                {receipt.recipientName || receipt.recipientEmail}
              </p>
              {receipt.recipientId && (
                <p className="text-xs text-gray-500 font-mono">{receipt.recipientId}</p>
              )}
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 mb-1">Date</p>
            <p className="font-medium text-gray-900">
              {new Date(receipt.createdAt).toLocaleString()}
            </p>
          </div>
          {receipt.category && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Category</p>
              <p className="font-medium text-gray-900">{receipt.category}</p>
            </div>
          )}
        </div>

        {receipt.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Description</p>
            <p className="text-gray-900">{receipt.description}</p>
          </div>
        )}

        {isRejected && receipt.rejectedReason && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-700">{receipt.rejectedReason}</p>
          </div>
        )}

        {isVerified && receipt.verifiedBy && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800 mb-1">Verified By</p>
            <p className="text-sm text-green-700">
              Admin: <span className="font-mono">{receipt.verifiedBy}</span>
              {receipt.verifiedAt && (
                <>
                  {' '}
                  on{' '}
                  {new Date(receipt.verifiedAt).toLocaleString()}
                </>
              )}
            </p>
          </div>
        )}

        <p className="mt-6 text-xs text-gray-500">
          This page confirms that the receipt exists in the ReliefChain system. Verification status
          is determined by platform administrators.
        </p>
      </div>
    </div>
  );
}

