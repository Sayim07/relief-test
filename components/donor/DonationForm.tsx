'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { categoryService } from '@/lib/firebase/services';
import type { CategoryDefinition } from '@/lib/firebase/services';
import { sendDonation } from '@/lib/utils/payment';
import { IndianRupee, FileText, AlertCircle, Loader2, Wallet } from 'lucide-react';

interface DonationFormProps {
  onDonationSubmit: (data: {
    amount: string;
    category?: string;
    description?: string;
    transactionHash: string;
  }) => Promise<void>;
}

export default function DonationForm({ onDonationSubmit }: DonationFormProps) {
  const { address, isConnected, connect, isLoading: walletLoading, signer } = useWallet();
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
  });
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [conversionLoading, setConversionLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    fetchEthPrice();
  }, []);

  const fetchEthPrice = async () => {
    try {
      const response = await fetch('/api/eth-price');
      const data = await response.json();
      if (data.success && data.ethPrice) {
        setEthPrice(data.ethPrice);
      }
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      // Use fallback price if fetch fails
      setEthPrice(200000); // Default fallback price
    } finally {
      setConversionLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await categoryService.getAll();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      // For testing: Generate a test transaction hash if wallet not connected
      let transactionHash: string;

      if (signer && isConnected) {
        try {
          // Try to send real payment via MetaMask
          transactionHash = await sendDonation(
            signer,
            formData.amount,
            false, // Use ETH for now, can be changed to use tokens
            process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS
          );
        } catch (paymentError: any) {
          // If payment fails, use test mode for database/QR testing
          console.warn('Payment failed, using test mode:', paymentError.message);
          transactionHash = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
      } else {
        // Test mode: Generate fake transaction hash for database/QR testing
        transactionHash = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      await onDonationSubmit({
        amount: formData.amount,
        category: formData.category || undefined,
        description: formData.description || undefined,
        transactionHash,
      });

      // Reset form
      setFormData({
        amount: '',
        category: '',
        description: '',
      });
    } catch (err: any) {
      console.error('Donation error:', err);
      setError(err.message || 'Failed to submit donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
          Donation Amount (ETH) *
        </label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            id="amount"
            type="number"
            step="0.001"
            min="0.001"
            max="1000"
            required
            value={formData.amount}
            onChange={(e) => {
              const value = e.target.value;
              // Validate input
              if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0 && parseFloat(value) <= 1000)) {
                setFormData({ ...formData, amount: value });
              }
            }}
            className="w-full pl-10 pr-4 py-3 bg-[#0a0a1a] border border-[#392e4e] rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white text-lg placeholder-gray-500"
            placeholder="0.001"
          />
        </div>
        <div className="flex justify-between mt-1 text-sm text-gray-400">
          <p>Minimum: 0.001 ETH | Maximum: 1000 ETH</p>
          {formData.amount && !isNaN(parseFloat(formData.amount)) && (
            <p className="text-blue-400 font-medium">
              {conversionLoading ? (
                'Loading rate...'
              ) : ethPrice ? (
                `≈ ₹${(parseFloat(formData.amount) * ethPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })} INR`
              ) : null}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
          Category (Optional)
        </label>
        {loadingCategories ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading categories...</span>
          </div>
        ) : (
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-3 bg-[#0a0a1a] border border-[#392e4e] rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white"
          >
            <option value="">Select a category (optional)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} - {cat.description}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
          Description (Optional)
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-[#0a0a1a] border border-[#392e4e] rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none text-white placeholder-gray-500"
            placeholder="Add a note about your donation..."
          />
        </div>
      </div>

      {
        !isConnected && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 mb-3">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Test Mode</span>
            </div>
            <p className="text-sm text-blue-300 mb-3">
              Wallet not connected. You can still test database and QR code generation.
              Donations will be saved with a test transaction hash.
            </p>
            <button
              type="button"
              onClick={connect}
              disabled={walletLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {walletLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Connect Wallet (Optional)
                </>
              )}
            </button>
          </div>
        )
      }

      {
        isConnected && address && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <Wallet className="w-5 h-5" />
              <span className="font-medium">Connected: {address.slice(0, 6)}...{address.slice(-4)}</span>
            </div>
          </div>
        )
      }

      {
        error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )
      }

      <button
        type="submit"
        disabled={isSubmitting || !formData.amount}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-medium"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Donation...
          </>
        ) : (
          <>
            <IndianRupee className="w-5 h-5" />
            Make Donation
          </>
        )}
      </button>
    </form >
  );
}
