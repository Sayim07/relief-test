import { ethers } from 'ethers';
import { getReliefTokenContract } from '@/lib/contracts/reliefToken';

/**
 * Admin wallet address for receiving donations
 * This should be set in environment variables
 */
export const ADMIN_WALLET_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || '';

/**
 * Send donation using native ETH
 */
export async function sendDonationETH(
  signer: ethers.JsonRpcSigner,
  amount: string,
  adminAddress: string = ADMIN_WALLET_ADDRESS
): Promise<string> {
  if (!adminAddress) {
    throw new Error('Admin wallet address not configured');
  }

  // Validate amount
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error('Invalid donation amount');
  }
  if (amountNum > 1000) {
    throw new Error('Donation amount too large. Maximum is 1000 ETH.');
  }

  // Check wallet balance
  const address = await signer.getAddress();
  const balance = await signer.provider.getBalance(address);
  const amountWei = ethers.parseEther(amount);
  const estimatedGas = ethers.parseUnits('0.001', 'ether'); // Rough estimate for gas
  
  if (balance < amountWei + estimatedGas) {
    const balanceEth = ethers.formatEther(balance);
    throw new Error(`Insufficient funds. Your wallet has ${balanceEth} ETH. You need at least ${amount} ETH + gas fees.`);
  }

  const tx = await signer.sendTransaction({
    to: adminAddress,
    value: amountWei,
  });

  await tx.wait();
  return tx.hash;
}

/**
 * Send donation using ERC20 tokens (ReliefToken)
 * Note: This requires the donor to have approved the contract or have tokens
 * ReliefToken extends ERC20, so it has the standard transfer function
 */
export async function sendDonationToken(
  signer: ethers.JsonRpcSigner,
  amount: string,
  adminAddress: string = ADMIN_WALLET_ADDRESS
): Promise<string> {
  if (!adminAddress) {
    throw new Error('Admin wallet address not configured');
  }

  const contract = getReliefTokenContract(signer);
  const amountWei = ethers.parseEther(amount);
  
  // Transfer tokens to admin (ERC20 standard transfer function)
  const tx = await contract.transfer(adminAddress, amountWei);
  const receipt = await tx.wait();
  return receipt?.hash || tx.hash;
}

/**
 * Send donation - automatically detects if using ETH or tokens
 * For now, we'll use ETH as the default payment method
 */
export async function sendDonation(
  signer: ethers.JsonRpcSigner,
  amount: string,
  useToken: boolean = false,
  adminAddress?: string
): Promise<string> {
  if (useToken) {
    return sendDonationToken(signer, amount, adminAddress);
  } else {
    return sendDonationETH(signer, amount, adminAddress);
  }
}
