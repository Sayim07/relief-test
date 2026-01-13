import { ethers } from 'ethers';

export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
};

export const getSigner = async () => {
  const provider = getProvider();
  if (!provider) {
    throw new Error('MetaMask not installed');
  }
  return await provider.getSigner();
};

export const connectWallet = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Window object is not available. Please use this in a browser environment.');
  }

  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock your MetaMask wallet.');
    }

    const provider = getProvider();
    if (!provider) {
      throw new Error('Failed to create provider. Please try again.');
    }

    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    if (!address) {
      throw new Error('Failed to get wallet address. Please try again.');
    }

    return { address, provider, signer };
  } catch (error: any) {
    // Handle MetaMask-specific errors
    if (error.code === 4001) {
      throw new Error('Please connect to MetaMask. The request was rejected.');
    } else if (error.code === -32002) {
      throw new Error('A request is already pending. Please check MetaMask.');
    } else if (error.code === -32602) {
      throw new Error('Invalid parameters. Please try again.');
    } else if (error.code === -32603) {
      throw new Error('Internal error. Please try again.');
    }

    // Extract error message
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
    
    // Log full error for debugging
    console.error('Error connecting wallet:', {
      code: error?.code,
      message: errorMessage,
      error: error
    });

    // Throw user-friendly error
    throw new Error(errorMessage);
  }
};

declare global {
  interface Window {
    ethereum?: any;
  }
}
