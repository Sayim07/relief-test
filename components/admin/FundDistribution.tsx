'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { reliefFundService, beneficiaryFundService, userService } from '@/lib/firebase/services/index';
import { ReliefFund, BeneficiaryFund } from '@/lib/types/database';
import { useWallet } from '@/hooks/useWallet';
import { getReliefTokenContract, reliefTokenFunctions } from '@/lib/contracts/reliefToken';
import { UserProfile } from '@/lib/types/user';
import { IndianRupee, Users, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

export default function FundDistribution() {
  const { profile } = useAuth();
  const { signer, isConnected } = useWallet();
  const [funds, setFunds] = useState<ReliefFund[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFund, setSelectedFund] = useState<string>('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [distributing, setDistributing] = useState(false);

  useEffect(() => {
    if (profile?.uid) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fundsData, beneficiariesData] = await Promise.all([
        reliefFundService.getActive().catch(err => {
          console.error('Error loading funds:', err);
          return [];
        }),
        userService.getByRole('beneficiary').catch(err => {
          console.error('Error loading beneficiaries - insufficient permissions:', err);
          // This is expected if user is not admin
          return [];
        }),
      ]);
      setFunds(fundsData);
      setBeneficiaries(beneficiariesData);
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
      // Use the first available fund if no fund is selected
      const fund = selectedFund ? funds.find(f => f.id === selectedFund) : funds[0];
      if (!fund) {
        throw new Error('No relief fund available');
      }

      const beneficiary = beneficiaries.find(b => b.uid === selectedBeneficiary);

      if (!fund || !beneficiary) {
        throw new Error('Fund or beneficiary not found');
      }

      if (!beneficiary.walletAddress) {
        throw new Error('Beneficiary does not have a wallet address connected');
      }

      const amountWei = BigInt(Math.floor(amountNum * 1e18));

      // 1. On-chain processing if wallet is connected
      let transactionHash: string | undefined;
      if (signer && isConnected) {
        const contract = getReliefTokenContract(signer);

        // Check if whitelisted
        const isWhitelisted = await reliefTokenFunctions.isBeneficiaryWhitelisted(contract, beneficiary.walletAddress);

        if (!isWhitelisted) {
          console.log('Whitelisting beneficiary on-chain...');
          await reliefTokenFunctions.whitelistBeneficiary(
            contract,
            beneficiary.walletAddress,
            [fund.category || 'general'],
            [amountWei * BigInt(2)] // Give some buffer for limit
          );
        }

        console.log('Distributing relief on-chain...');
        const tx = await reliefTokenFunctions.distributeRelief(
          contract,
          beneficiary.walletAddress,
          amountWei,
          fund.category || 'general'
        );
        transactionHash = tx.hash;
      }

      // 2. Create beneficiary fund assignment in Firestore
      await beneficiaryFundService.create({
        beneficiaryId: beneficiary.uid,
        beneficiaryEmail: beneficiary.email,
        beneficiaryName: beneficiary.displayName,
        reliefFundId: fund.id,
        amount: Number(amountWei),
        amountDisplay: amount,
        currency: fund.currency,
        category: fund.category,
        status: 'active',
        assignedBy: profile.uid,
        assignedAt: new Date(),
        distributedAmount: 0,
        remainingAmount: Number(amountWei),
        transactionHash: transactionHash,
      });

      // 3. Update relief fund in Firestore
      await reliefFundService.updateDistributedAmount(fund.id, Number(amountWei));

      // Reset form
      setSelectedBeneficiary('');
      setAmount('');

      await loadData();
      alert('Funds distributed successfully both on-chain and in database!');
    } catch (error: any) {
      console.error('Error distributing funds:', error);
      alert(`Failed to distribute funds: ${error.message || 'Unknown error'}`);
    } finally {
      setDistributing(false);
    }
  };

  const selectedFundData = selectedFund ? funds.find(f => f.id === selectedFund) : funds[0];
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Fund Distribution to Beneficiaries</h2>
        <div className="text-sm text-gray-400">
          Distribute relief funds directly to verified beneficiaries
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg shadow-lg border border-[#392e4e] p-6">
        <div className="mb-4 p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg">
          <h4 className="text-sm font-medium text-blue-300 mb-2">📋 Distribution Process</h4>
          <p className="text-xs text-gray-300">
            This form allows you to distribute relief funds directly to <strong>beneficiaries only</strong>. 
            Beneficiaries are individuals who have registered for assistance and have been verified by the system.
            Funds will be transferred directly to their connected wallet addresses.
          </p>
          {funds.length > 0 && (
            <div className="mt-3 p-3 bg-green-900/20 border border-green-900/50 rounded">
              <p className="text-xs text-green-300">
                <strong>Active Fund:</strong> {funds[0].name} - Available: ₹{(parseFloat(funds[0].remainingAmount.toString()) / 1e18).toFixed(2)}
              </p>
            </div>
          )}
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
              Amount (INR) *
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0a0a1a] border border-[#392e4e] rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {selectedFundData && amount && (
              <p className="mt-1 text-sm text-gray-500">
                Remaining after distribution: ₹{(parseFloat(selectedFundData.remainingAmount.toString()) / 1e18 - parseFloat(amount || '0')).toFixed(2)}
              </p>
            )}
          </div>

          <button
            onClick={handleDistribute}
            disabled={!selectedBeneficiary || !amount || distributing || funds.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {distributing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Distributing to Beneficiary...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Distribute Funds to Beneficiary
              </>
            )}
          </button>
        </div>
      </div>

      {/* Distribution Preview */}
      {selectedBeneficiary && amount && selectedFundData && (
        <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Distribution Preview - Direct to Beneficiary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">From Relief Fund:</span>
              <span className="font-medium text-white">{selectedFundData?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Available Amount:</span>
              <span className="font-medium text-blue-400">
                ₹{(parseFloat(selectedFundData.remainingAmount.toString()) / 1e18).toFixed(2)}
              </span>
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
              <span className="font-semibold text-lg text-blue-400">₹{amount} INR</span>
            </div>
            <div className="mt-3 p-3 bg-green-900/20 border border-green-900/50 rounded">
              <p className="text-xs text-green-300">
                💡 This amount will be directly transferred to the beneficiary's wallet for immediate use.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
