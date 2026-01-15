'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { receiptService } from '@/lib/firebase/services/receiptService';
import type { Receipt } from '@/lib/types/database';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import PageLoader from '@/components/ui/PageLoader';

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
    return <PageLoader />;
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060010]">
        <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-red-900/50 p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h1 className="text-xl font-semibold text-white">Receipt Verification Failed</h1>
          </div>
          <p className="text-gray-300 mb-2">{error}</p>
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
    <div className="min-h-screen flex items-center justify-center bg-[#060010] px-4">
      <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-8 max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-6">
          {isVerified ? (
            <CheckCircle className="w-10 h-10 text-green-600" />
          ) : isRejected ? (
            <XCircle className="w-10 h-10 text-red-600" />
          ) : (
            <AlertCircle className="w-10 h-10 text-yellow-500" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isVerified
                ? 'Receipt Verified'
                : isRejected
                  ? 'Receipt Rejected'
                  : 'Receipt Pending Verification'}
            </h1>
            <p className="text-gray-400">
              Receipt Number: <span className="font-mono text-gray-300">{receipt.receiptNumber}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Amount</p>
            <p className="font-semibold text-lg text-white">
              {receipt.amountDisplay} {receipt.currency}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Status</p>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${isVerified
                ? 'bg-green-900/30 text-green-400'
                : isRejected
                  ? 'bg-red-900/30 text-red-400'
                  : 'bg-yellow-900/30 text-yellow-500'
                }`}
            >
              {receipt.status.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Payer</p>
            <p className="font-medium text-white">{receipt.payerName || receipt.payerEmail}</p>
            <p className="text-xs text-gray-500 font-mono">{receipt.payerId}</p>
          </div>
          {receipt.recipientEmail && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Recipient</p>
              <p className="font-medium text-white">
                {receipt.recipientName || receipt.recipientEmail}
              </p>
              {receipt.recipientId && (
                <p className="text-xs text-gray-500 font-mono">{receipt.recipientId}</p>
              )}
            </div>
          )}
          <div>
            <p className="text-sm text-gray-400 mb-1">Date</p>
            <p className="font-medium text-white">
              {new Date(receipt.createdAt).toLocaleString()}
            </p>
          </div>
          {receipt.category && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Category</p>
              <p className="font-medium text-white capitalize">{receipt.category}</p>
            </div>
          )}
          {receipt.transactionHash && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-400 mb-1">Blockchain Transaction</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${receipt.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-mono text-sm break-all"
              >
                {receipt.transactionHash}
              </a>
            </div>
          )}
        </div>

        {receipt.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-1">Description</p>
            <p className="text-white">{receipt.description}</p>
          </div>
        )}

        {isRejected && receipt.rejectedReason && (
          <div className="mb-4 bg-red-900/20 border border-red-900/50 rounded-lg p-4">
            <p className="text-sm font-medium text-red-400 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-300">{receipt.rejectedReason}</p>
          </div>
        )}

        {isVerified && receipt.verifiedBy && (
          <div className="mb-4 bg-green-900/20 border border-green-900/50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-400 mb-1">Verified By</p>
            <p className="text-sm text-green-300">
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

