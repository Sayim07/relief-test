import { ethers } from 'ethers';

export const RELIEF_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS || '';

// Temporary ABI - will be replaced after contract compilation
// This is a minimal ABI for development/testing
const RELIEF_TOKEN_ABI = [
  // ERC20 standard functions
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  // Custom functions
  'function whitelistBeneficiary(address beneficiary, string[] categories, uint256[] limits)',
  'function removeBeneficiary(address beneficiary)',
  'function whitelistReliefPartner(address reliefPartner)',
  'function removeReliefPartner(address reliefPartner)',
  'function distributeRelief(address to, uint256 amount, string category)',
  'function transferWithCategory(address to, uint256 amount, string category) returns (bool)',
  'function beneficiaries(address) view returns (bool isWhitelisted, uint256 totalReceived)',
  'function getCategorySpending(address beneficiary, string category) view returns (uint256 spent, uint256 limit)',
  'function getTransaction(uint256 txId) view returns (address from, address to, uint256 amount, string category, uint256 timestamp, string description)',
  'function donations(uint256) view returns (address donor, uint256 amount, string category, uint256 timestamp, bool verified, string description, string transactionHash)',
  'function donationCount() view returns (uint256)',
  'function getReliefPartners(address beneficiary) view returns (address[])',
  'function recordDonation(address donor, uint256 amount, string category, string description, string transactionHash)',
  'function verifyDonation(uint256 donationId)',
  'function assignReliefPartner(address beneficiary, address reliefPartner)',
  'function transactionCount() view returns (uint256)',
  'function donate(uint256 amount, string category, string description, string transactionHash)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function RELIEF_PARTNER_ROLE() view returns (bytes32)',
  // Events
  'event BeneficiaryWhitelisted(address indexed beneficiary, string[] categories, uint256[] limits)',
  'event ReliefDistributed(address indexed to, uint256 amount, string category)',
  'event TransactionRecorded(uint256 indexed txId, address from, address to, uint256 amount, string category)',
  'event DonationRecorded(uint256 indexed donationId, address indexed donor, uint256 amount, string category)',
  'event DonationVerified(uint256 indexed donationId, address indexed verifier)',
  'event ReliefPartnerAssigned(address indexed beneficiary, address indexed reliefPartner)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export const getReliefTokenContract = (signer: ethers.JsonRpcSigner) => {
  if (!RELIEF_TOKEN_ADDRESS) {
    throw new Error('ReliefToken contract address not configured');
  }
  return new ethers.Contract(RELIEF_TOKEN_ADDRESS, RELIEF_TOKEN_ABI, signer);
};

export const getReliefTokenContractReadOnly = (provider: ethers.BrowserProvider) => {
  if (!RELIEF_TOKEN_ADDRESS) {
    throw new Error('ReliefToken contract address not configured');
  }
  return new ethers.Contract(RELIEF_TOKEN_ADDRESS, RELIEF_TOKEN_ABI, provider);
};

// Contract interaction functions
export const reliefTokenFunctions = {
  // Admin functions
  whitelistBeneficiary: async (
    contract: ethers.Contract,
    beneficiary: string,
    categories: string[],
    limits: bigint[]
  ) => {
    const tx = await contract.whitelistBeneficiary(beneficiary, categories, limits);
    return await tx.wait();
  },

  removeBeneficiary: async (contract: ethers.Contract, beneficiary: string) => {
    const tx = await contract.removeBeneficiary(beneficiary);
    return await tx.wait();
  },

  whitelistReliefPartner: async (contract: ethers.Contract, reliefPartner: string) => {
    const tx = await contract.whitelistReliefPartner(reliefPartner);
    return await tx.wait();
  },

  removeReliefPartner: async (contract: ethers.Contract, reliefPartner: string) => {
    const tx = await contract.removeReliefPartner(reliefPartner);
    return await tx.wait();
  },

  distributeRelief: async (
    contract: ethers.Contract,
    to: string,
    amount: bigint,
    category: string
  ) => {
    const tx = await contract.distributeRelief(to, amount, category);
    return await tx.wait();
  },

  // Donation tracking
  recordDonation: async (contract: ethers.Contract, donor: string, amount: bigint, category: string, description: string, transactionHash: string) => {
    const tx = await contract.recordDonation(donor, amount, category, description, transactionHash);
    return await tx.wait();
  },

  verifyDonation: async (contract: ethers.Contract, donationId: number) => {
    const tx = await contract.verifyDonation(donationId);
    return await tx.wait();
  },

  assignReliefPartner: async (contract: ethers.Contract, beneficiary: string, reliefPartner: string) => {
    const tx = await contract.assignReliefPartner(beneficiary, reliefPartner);
    return await tx.wait();
  },

  donate: async (contract: ethers.Contract, amount: bigint, category: string, description: string, transactionHash: string) => {
    const tx = await contract.donate(amount, category, description, transactionHash);
    return await tx.wait();
  },

  isReliefPartner: async (contract: ethers.Contract, account: string) => {
    const role = await contract.RELIEF_PARTNER_ROLE();
    return await contract.hasRole(role, account);
  },

  // Beneficiary functions
  transferWithCategory: async (
    contract: ethers.Contract,
    to: string,
    amount: bigint,
    category: string
  ) => {
    const tx = await contract.transferWithCategory(to, amount, category);
    return await tx.wait();
  },

  // View functions
  isBeneficiaryWhitelisted: async (contract: ethers.Contract, address: string) => {
    const beneficiary = await contract.beneficiaries(address);
    return beneficiary.isWhitelisted;
  },

  getCategorySpending: async (contract: ethers.Contract, beneficiary: string, category: string) => {
    const [spent, limit] = await contract.getCategorySpending(beneficiary, category);
    return { spent: spent.toString(), limit: limit.toString() };
  },

  getTransaction: async (contract: ethers.Contract, txId: number) => {
    return await contract.getTransaction(txId);
  },

  getDonation: async (contract: ethers.Contract, donationId: number) => {
    return await contract.donations(donationId);
  },

  getDonationCount: async (contract: ethers.Contract) => {
    return await contract.donationCount();
  },

  getReliefPartners: async (contract: ethers.Contract, beneficiary: string) => {
    return await contract.getReliefPartners(beneficiary);
  },

  getBalance: async (contract: ethers.Contract, address: string) => {
    return await contract.balanceOf(address);
  },

  getTotalReceived: async (contract: ethers.Contract, address: string) => {
    const beneficiary = await contract.beneficiaries(address);
    return beneficiary.totalReceived;
  },
};
