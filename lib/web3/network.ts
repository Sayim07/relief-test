/**
 * Network Configuration
 */

export const SEPOLIA_NETWORK = {
  chainId: '0xaa36a7', // 11155111 in hex
  chainIdDecimal: 11155111,
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://rpc.sepolia.org',
    'https://sepolia.infura.io/v3/',
    'https://ethereum-sepolia-rpc.publicnode.com',
  ],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

/**
 * Request to switch to Sepolia network
 */
export async function switchToSepolia(): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_NETWORK.chainId }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_NETWORK],
        });
      } catch (addError) {
        throw new Error('Failed to add Sepolia network to MetaMask');
      }
    } else {
      throw switchError;
    }
  }
}

/**
 * Check if current network is Sepolia
 */
export async function isSepoliaNetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });
    return chainId === SEPOLIA_NETWORK.chainId;
  } catch (error) {
    return false;
  }
}

/**
 * Get current network chain ID
 */
export async function getCurrentChainId(): Promise<number | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });
    return parseInt(chainId, 16);
  } catch (error) {
    return null;
  }
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
