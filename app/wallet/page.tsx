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
          <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-12 text-center">
            <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect your MetaMask wallet to view your balance and transactions</p>
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
            <h1 className="text-3xl font-bold text-white">My Wallet</h1>
            <p className="text-gray-400 mt-2">View your wallet balance and address</p>
          </div>

          <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-900/20 rounded-lg">
                  <Wallet className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Wallet Balance</p>
                  <p className="text-3xl font-bold text-white">
                    {loading ? '...' : `${balance} ETH`}
                  </p>
                </div>
              </div>
              <button
                onClick={loadBalance}
                disabled={loading}
                className="px-4 py-2 text-sm bg-[#1a1a2e] text-gray-300 rounded-lg hover:bg-[#2a2a3e] transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="border-t border-[#392e4e] pt-6">
              <p className="text-sm text-gray-400 mb-2">Wallet Address</p>
              <div className="flex items-center gap-3 p-4 bg-[#1a1a2e] rounded-lg border border-[#392e4e]">
                <code className="flex-1 font-mono text-sm text-gray-300 break-all">
                  {address}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-2 hover:bg-[#2a2a3e] rounded-lg transition-colors"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
                <a
                  href={`https://sepolia.etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-[#2a2a3e] rounded-lg transition-colors"
                  title="View on Etherscan"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
