'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { connectWallet, getProvider } from '@/lib/web3/provider';

export interface WalletState {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    address: null,
    provider: null,
    signer: null,
    isConnected: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    checkConnection();
    
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
      
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const checkConnection = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = getProvider();
        if (provider) {
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setState({
              address,
              provider,
              signer,
              isConnected: true,
              isLoading: false,
              error: null,
            });
            return;
          }
        }
      }
      setState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error: any) {
      // Don't show error on initial check - user hasn't tried to connect yet
      console.warn('Wallet connection check failed:', error?.message || error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null, // Don't show error until user tries to connect
      }));
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setState({
        address: null,
        provider: null,
        signer: null,
        isConnected: false,
        isLoading: false,
        error: null,
      });
    } else {
      checkConnection();
    }
  };

  const connect = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if MetaMask is available
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask extension to continue.');
      }

      const { address, provider, signer } = await connectWallet();
      setState({
        address,
        provider,
        signer,
        isConnected: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      // Extract error message properly
      let errorMessage = 'Failed to connect wallet';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.toString) {
        errorMessage = error.toString();
      }

      console.error('Wallet connection error:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  const disconnect = () => {
    setState({
      address: null,
      provider: null,
      signer: null,
      isConnected: false,
      isLoading: false,
      error: null,
    });
  };

  return {
    ...state,
    connect,
    disconnect,
  };
};
