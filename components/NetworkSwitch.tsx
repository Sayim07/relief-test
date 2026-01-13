'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { switchToSepolia, isSepoliaNetwork, SEPOLIA_NETWORK } from '@/lib/web3/network';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function NetworkSwitch() {
  const { isConnected } = useWallet();
  const [isSepolia, setIsSepolia] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      checkNetwork();
      
      // Listen for network changes
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      }
    }
  }, [isConnected]);

  const checkNetwork = async () => {
    const onSepolia = await isSepoliaNetwork();
    setIsSepolia(onSepolia);
  };

  const handleSwitch = async () => {
    setIsSwitching(true);
    setError(null);
    
    try {
      await switchToSepolia();
      setIsSepolia(true);
    } catch (err: any) {
      setError(err.message || 'Failed to switch network');
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  if (isSepolia) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <span className="text-sm text-green-800 font-medium">
          Connected to Sepolia Testnet
        </span>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800 mb-1">
            Wrong Network
          </h3>
          <p className="text-sm text-yellow-700 mb-3">
            Please switch to Sepolia testnet to use this application.
          </p>
          {error && (
            <p className="text-sm text-red-600 mb-3">{error}</p>
          )}
          <button
            onClick={handleSwitch}
            disabled={isSwitching}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
          >
            {isSwitching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Switching...
              </>
            ) : (
              'Switch to Sepolia'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
