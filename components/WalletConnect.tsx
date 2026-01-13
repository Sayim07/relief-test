'use client';

import { useWallet } from '@/hooks/useWallet';
import { Wallet, AlertCircle, Loader2 } from 'lucide-react';

export default function WalletConnect() {
  const { address, isConnected, isLoading, error, connect, disconnect } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg cursor-not-allowed"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
          <Wallet className="w-4 h-4" />
          <span className="font-mono text-sm">{formatAddress(address)}</span>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum;

  if (!isMetaMaskInstalled) {
    return (
      <div className="flex flex-col gap-2">
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Wallet className="w-5 h-5" />
          Install MetaMask
        </a>
        <p className="text-xs text-gray-600 text-center">
          MetaMask is required to connect your wallet
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={connect}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        <Wallet className="w-5 h-5" />
        {isLoading ? 'Connecting...' : 'Connect MetaMask'}
      </button>
      {error && (
        <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}
    </div>
  );
}
