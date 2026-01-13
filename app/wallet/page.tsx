'use client';

import { AuthGuard } from '@/lib/middleware/withAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, Copy, ExternalLink } from 'lucide-react';
import { formatEther } from 'ethers';
import { useState, useEffect } from 'react';

export default function WalletPage() {
  const { address, provider, isConnected, connect } = useWallet();
  const [balance, setBalance] = useState<string>('0.00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && provider && address) {
      loadBalance();
    } else {
      setLoading(false);
    }
  }, [isConnected, provider, address]);

  const loadBalance = async () => {
    if (!provider || !address) return;
    try {
      setLoading(true);
      const balanceWei = await provider.getBalance(address);
      setBalance(parseFloat(formatEther(balanceWei)).toFixed(4));
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  if (!isConnected) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">Connect your MetaMask wallet to view your balance and transactions</p>
            <button
              onClick={connect}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Connect Wallet
            </button>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
            <p className="text-gray-600 mt-2">View your wallet balance and address</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Wallet Balance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : `${balance} ETH`}
                  </p>
                </div>
              </div>
              <button
                onClick={loadBalance}
                disabled={loading}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 mb-2">Wallet Address</p>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <code className="flex-1 font-mono text-sm text-gray-900 break-all">
                  {address}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
                <a
                  href={`https://sepolia.etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="View on Etherscan"
                >
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
