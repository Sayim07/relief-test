'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { reliefFundService, beneficiaryFundService, userService, donationService } from '@/lib/firebase/services/index';
import { ReliefFund, BeneficiaryFund } from '@/lib/types/database';
import { useWallet } from '@/hooks/useWallet';
import { getReliefTokenContract, reliefTokenFunctions } from '@/lib/contracts/reliefToken';
import { UserProfile } from '@/lib/types/user';
import { IndianRupee, Users, ArrowRight, Loader2, CheckCircle, Wallet } from 'lucide-react';

export default function FundDistribution() {
  const { profile } = useAuth();
  const { signer, isConnected, connect } = useWallet();
  const [beneficiaries, setBeneficiaries] = useState<UserProfile[]>([]);
  const [verifiedDonations, setVerifiedDonations] = useState<any[]>([]);
  const [totalAvailableFunds, setTotalAvailableFunds] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [distributing, setDistributing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [ethToInrRate, setEthToInrRate] = useState<number>(280000); // Fallback rate

  useEffect(() => {
    if (profile?.uid) {
      loadData();
      fetchEthToInrRate();
    }
  }, [profile]);

  const fetchEthToInrRate = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr');
      const data = await response.json();
      if (data.ethereum && data.ethereum.inr) {
        setEthToInrRate(data.ethereum.inr);
      }
    } catch (error) {
      console.log('Failed to fetch ETH rate, using fallback');
    }
  };

  const handleConnectWallet = async () => {
    setConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    if (profile?.uid) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading fund distribution data...');
      
      const [beneficiariesData, donationsData] = await Promise.all([
        userService.getByRole('beneficiary').catch(err => {
          console.error('Error loading beneficiaries - insufficient permissions:', err);
          return [];
        }),
        // Load verified donations instead of relief funds
        donationService.getByStatus('verified').catch((err: any) => {
          console.error('Error loading verified donations:', err);
          return [];
        })
      ]);
      
      console.log('Loaded beneficiaries:', beneficiariesData.length);
      console.log('Loaded verified donations:', donationsData.length);
      
      setBeneficiaries(beneficiariesData);
      setVerifiedDonations(donationsData);
      
      // Calculate total available funds from verified donations
      const totalFunds = donationsData.reduce((total: number, donation: any) => {
        // Convert from Wei to ETH if the amount is in Wei, then convert to INR
        let donationAmount = donation.amount || 0;
        
        // If amount is very large (likely in Wei), convert to ETH first
        if (donationAmount > 1000000) {
          // Convert Wei to ETH (divide by 1e18), then use amountDisplay if available
          if (donation.amountDisplay) {
            donationAmount = parseFloat(donation.amountDisplay);
          } else {
            donationAmount = donationAmount / 1e18;
          }
        }
        
        return total + donationAmount;
      }, 0);
      
      setTotalAvailableFunds(totalFunds);
      console.log('Total available funds from verified donations (in display units):', totalFunds);
      
    } catch (error) {
      console.error('Error loading distribution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDistribute = async () => {
    if (!profile?.uid || !selectedBeneficiary || !amount) {
      alert('Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setDistributing(true);
    try {
      // Check if we have enough verified funds
      if (amountNum > totalAvailableFunds) {
        throw new Error(`Insufficient verified funds. Available: ${totalAvailableFunds.toFixed(6)} ETH, Requested: ${amountNum} ETH`);
      }

      const beneficiary = beneficiaries.find(b => b.uid === selectedBeneficiary);
      if (!beneficiary) {
        throw new Error('Beneficiary not found');
      }

      if (!beneficiary.walletAddress) {
        throw new Error('Beneficiary does not have a wallet address connected');
      }

      const amountWei = BigInt(Math.floor(amountNum * 1e18));

      console.log('Starting fund distribution process...');
      console.log(`Distributing ${amountNum} INR to ${beneficiary.displayName || beneficiary.email}`);

      // 1. On-chain processing if wallet is connected
      let transactionHash: string | undefined;
      if (signer && isConnected) {
        console.log('Processing on-chain transaction...');
        try {
          const contract = getReliefTokenContract(signer);

          // Check if whitelisted
          const isWhitelisted = await reliefTokenFunctions.isBeneficiaryWhitelisted(contract, beneficiary.walletAddress);

          if (!isWhitelisted) {
            console.log('Whitelisting beneficiary on-chain...');
            await reliefTokenFunctions.whitelistBeneficiary(
              contract,
              beneficiary.walletAddress,
              ['general'], // Default category for direct distributions
              [amountWei * BigInt(2)] // Give some buffer for limit
            );
          }

          console.log('Distributing relief on-chain...');
          const tx = await reliefTokenFunctions.distributeRelief(
            contract,
            beneficiary.walletAddress,
            amountWei,
            'general' // Default category
          );
          transactionHash = tx.hash;
          console.log('On-chain transaction completed:', transactionHash);
        } catch (blockchainError: any) {
          console.error('Blockchain transaction failed:', blockchainError);
          throw new Error(`Blockchain transaction failed: ${blockchainError.message}`);
        }
      } else {
        console.log('Wallet not connected - proceeding with database-only operation');
      }

      console.log('Creating beneficiary fund assignment...');
      // 2. Create beneficiary fund assignment in Firestore
      try {
        await beneficiaryFundService.create({
          beneficiaryId: beneficiary.uid,
          beneficiaryEmail: beneficiary.email,
          beneficiaryName: beneficiary.displayName,
          reliefFundId: 'verified_donations_pool', // Special ID for direct distributions
          amount: Number(amountWei),
          amountDisplay: amount,
          currency: 'ETH',
          category: 'general',
          status: 'active',
          assignedBy: profile.uid,
          assignedAt: new Date(),
          distributedAmount: 0,
          remainingAmount: Number(amountWei),
          transactionHash: transactionHash,
        });
        console.log('Beneficiary fund assignment created successfully');
      } catch (dbError: any) {
        console.error('Database operation failed:', dbError);
        throw new Error(`Database operation failed: ${dbError.message}`);
      }

      // 3. Mark some donations as distributed (simple approach: mark oldest verified donations)
      console.log('Updating donation status...');
      try {
        let remainingToDistribute = amountNum;
        
        for (const donation of verifiedDonations) {
          if (remainingToDistribute <= 0) break;
          
          // Get the display amount (what user sees) vs stored amount (Wei)
          let donationDisplayAmount = donation.amount || 0;
          if (donation.amountDisplay) {
            donationDisplayAmount = parseFloat(donation.amountDisplay);
          } else if (donationDisplayAmount > 1000000) {
            // Convert Wei to display amount
            donationDisplayAmount = donationDisplayAmount / 1e18;
          }
          
          if (donationDisplayAmount > 0 && donation.status === 'verified') {
            // Mark this donation as distributed
            await donationService.update(donation.id, {
              status: 'distributed',
              distributedAt: new Date()
            });
            remainingToDistribute -= donationDisplayAmount;
            console.log(`Marked donation ${donation.id} as distributed (${donationDisplayAmount} units)`);
          }
        }
        
        console.log('Donation statuses updated successfully');
      } catch (updateError: any) {
        console.error('Failed to update donation status:', updateError);
        // Don't throw error here - the distribution was successful, this is just bookkeeping
      }

      // Reset form
      setSelectedBeneficiary('');
      setAmount('');

      await loadData(); // Reload to get updated verified donations
      const successMessage = transactionHash 
        ? `Funds distributed successfully! Transaction Hash: ${transactionHash}` 
        : 'Funds distributed successfully from verified donations!';
      alert(successMessage);
    } catch (error: any) {
      console.error('Error distributing funds:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to distribute funds: ${errorMessage}`);
    } finally {
      setDistributing(false);
    }
  };

  const selectedBeneficiaryData = beneficiaries.find(b => b.uid === selectedBeneficiary);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Check if user is admin
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-400 mb-2">Access Denied</p>
          <p className="text-gray-400 text-sm">You need admin privileges to access fund distribution.</p>
        </div>
      </div>
    );
  }

  // Check if no beneficiaries are available
  if (beneficiaries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Fund Distribution to Beneficiaries</h2>
          <div className="text-sm text-gray-400">
            Distribute relief funds directly to verified beneficiaries
          </div>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg shadow-lg border border-[#392e4e] p-6">
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-white mb-2">No Beneficiaries Found</h3>
            <p className="text-gray-400 text-sm">
              No verified beneficiaries are available for fund distribution.
              Please ensure beneficiaries have registered and been verified.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if no verified donations are available
  if (totalAvailableFunds === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Fund Distribution to Beneficiaries</h2>
          <div className="text-sm text-gray-400">
            Distribute relief funds directly to verified beneficiaries
          </div>
        </div>
        <div className="bg-[#1a1a2e] rounded-lg shadow-lg border border-[#392e4e] p-6">
          <div className="text-center py-12">
            <IndianRupee className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-white mb-2">No Verified Donations Available</h3>
            <p className="text-gray-400 text-sm mb-4">
              There are no verified donations available for distribution. 
              Funds become available after donations are verified by admins.
            </p>
            <div className="text-sm text-gray-500">
              <p>Verified Donations: {verifiedDonations.length}</p>
              <p>Total Available: {totalAvailableFunds.toFixed(6)} ETH</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Fund Distribution to Beneficiaries</h2>
        <div className="text-sm text-gray-400">
          Distribute relief funds directly to verified beneficiaries
        </div>
      </div>

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-900/10 border border-yellow-900/30 rounded-lg p-4">
          <details className="text-xs text-yellow-300">
            <summary className="cursor-pointer mb-2">🐛 Debug Info (Dev Mode)</summary>
            <div className="space-y-1">
              <div>User Role: {profile?.role || 'Not loaded'}</div>
              <div>User Email: {profile?.email || 'Not loaded'}</div>
              <div>Verified Donations: {verifiedDonations.length}</div>
              <div>Total Available Funds: {totalAvailableFunds.toFixed(6)} ETH (₹{(totalAvailableFunds * ethToInrRate).toFixed(2)} INR)</div>
              <div>Available Beneficiaries: {beneficiaries.length}</div>
              <div>Wallet Connected: {isConnected ? 'Yes' : 'No'}</div>
            </div>
          </details>
        </div>
      )}

      <div className="bg-[#1a1a2e] rounded-lg shadow-lg border border-[#392e4e] p-6">
        <div className="mb-4 p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg">
          <h4 className="text-sm font-medium text-blue-300 mb-2">📋 Distribution Process</h4>
          <p className="text-xs text-gray-300">
            This form allows you to distribute relief funds directly to <strong>beneficiaries only</strong>. 
            Beneficiaries are individuals who have registered for assistance and have been verified by the system.
            Funds come from <strong>verified donations in ETH</strong> and will be transferred directly to their connected wallet addresses.
          </p>
          <div className="mt-3 p-3 bg-green-900/20 border border-green-900/50 rounded">
            <p className="text-xs text-green-300">
              <strong>Available from Verified Donations:</strong> {totalAvailableFunds.toFixed(6)} ETH (₹{(totalAvailableFunds * ethToInrRate).toFixed(2)} INR) 
              <span className="ml-2 text-gray-300">({verifiedDonations.length} donations)</span>
            </p>
            {process.env.NODE_ENV === 'development' && verifiedDonations.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-blue-300 cursor-pointer">Show donation details</summary>
                <div className="mt-2 space-y-1">
                  {verifiedDonations.slice(0, 5).map((donation, idx) => {
                    const displayAmount = donation.amountDisplay 
                      ? parseFloat(donation.amountDisplay)
                      : donation.amount > 1000000 
                        ? donation.amount / 1e18 
                        : donation.amount;
                    return (
                      <div key={idx} className="text-xs text-gray-400 flex justify-between">
                        <span>Donation {idx + 1}:</span>
                        <span>{displayAmount.toFixed(6)} ETH</span>
                      </div>
                    );
                  })}
                  {verifiedDonations.length > 5 && (
                    <div className="text-xs text-gray-500">...and {verifiedDonations.length - 5} more</div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Beneficiary * 
              <span className="text-xs text-blue-400 ml-2">(Individuals in need of assistance)</span>
            </label>
            <select
              value={selectedBeneficiary}
              onChange={(e) => setSelectedBeneficiary(e.target.value)}
              className="w-full px-4 py-2 bg-[#0a0a1a] border border-[#392e4e] rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a beneficiary...</option>
              {beneficiaries.map((beneficiary) => (
                <option key={beneficiary.uid} value={beneficiary.uid}>
                  {beneficiary.displayName || beneficiary.email} {beneficiary.verified && '✓ Verified'}
                </option>
              ))}
            </select>
            {selectedBeneficiaryData && (
              <div className="mt-2 p-3 bg-green-900/20 border border-green-900/50 rounded-lg">
                <p className="text-sm text-gray-300">
                  {selectedBeneficiaryData.displayName || selectedBeneficiaryData.email}
                  {selectedBeneficiaryData.location && ` - ${selectedBeneficiaryData.location}`}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Amount (ETH) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-mono">ETH</span>
              <input
                type="number"
                step="0.000001"
                min="0.000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-2 bg-[#0a0a1a] border border-[#392e4e] rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                placeholder="0.001000"
              />
            </div>
            {totalAvailableFunds > 0 && amount && (
              <div className="mt-2 p-3 bg-gray-900/50 border border-gray-600 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Available from verified donations:</span>
                  <span className="text-green-400">{totalAvailableFunds.toFixed(6)} ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">After distribution:</span>
                  <span className={`font-medium ${
                    totalAvailableFunds - parseFloat(amount || '0') >= 0 
                      ? 'text-blue-400' 
                      : 'text-red-400'
                  }`}>
                    {(totalAvailableFunds - parseFloat(amount || '0')).toFixed(6)} ETH
                  </span>
                </div>
                {totalAvailableFunds < parseFloat(amount || '0') && (
                  <div className="mt-2 p-2 bg-red-900/20 border border-red-900/50 rounded text-xs text-red-400">
                    ⚠️ Insufficient verified funds! Reduce the amount or wait for more donations to be verified.
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleDistribute}
            disabled={
              !selectedBeneficiary || 
              !amount || 
              distributing || 
              totalAvailableFunds === 0 ||
              totalAvailableFunds < parseFloat(amount || '0')
            }
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {distributing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {signer && isConnected ? 'Processing on-chain...' : 'Processing...'}
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Distribute Funds to Beneficiary
              </>
            )}
          </button>

          {/* Wallet connection status and connect button */}
          <div className="mt-4 p-3 rounded-lg bg-gray-900/50 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center text-sm">
                  <Wallet className="w-4 h-4 mr-2" />
                  <span className="text-gray-400">Wallet Status:</span>
                  <span className={`ml-2 font-medium ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isConnected ? '🟢 Connected' : '🟡 Not Connected'}
                  </span>
                </div>
                {isConnected && (
                  <div className="text-xs text-green-400 mt-1">
                    ✓ On-chain operations available
                  </div>
                )}
                {!isConnected && (
                  <div className="text-xs text-yellow-400 mt-1">
                    ℹ️ Connect wallet for on-chain distribution
                  </div>
                )}
              </div>
              {!isConnected && (
                <button
                  onClick={handleConnectWallet}
                  disabled={connecting}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      Connect Wallet
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Preview */}
      {selectedBeneficiary && amount && totalAvailableFunds > 0 && (
        <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Distribution Preview - From Verified Donations
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">From:</span>
              <span className="font-medium text-white">Verified Donations Pool</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Available Amount:</span>
              <span className="font-medium text-blue-400">
                {totalAvailableFunds.toFixed(6)} ETH
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Number of Donations:</span>
              <span className="font-medium text-gray-300">{verifiedDonations.length} donations</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">To Beneficiary:</span>
              <span className="font-medium text-white">
                {selectedBeneficiaryData?.displayName || selectedBeneficiaryData?.email}
                {selectedBeneficiaryData?.verified && (
                  <span className="ml-2 text-green-400 text-xs">✓ Verified</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="font-semibold text-lg text-blue-400">{amount} ETH</span>
            </div>
            <div className="mt-3 p-3 bg-green-900/20 border border-green-900/50 rounded">
              <p className="text-xs text-green-300">
                💡 This amount will be deducted from verified donations and transferred to the beneficiary's wallet in ETH.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
