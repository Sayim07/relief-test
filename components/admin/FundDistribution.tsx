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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fundsData, beneficiariesData] = await Promise.all([
        reliefFundService.getActive(),
        userService.getByRole('beneficiary'),
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
    if (!profile?.uid || !selectedFund || !selectedBeneficiary || !amount) {
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
      const fund = funds.find(f => f.id === selectedFund);
      const beneficiary = beneficiaries.find(b => b.uid === selectedBeneficiary);

      if (!fund || !beneficiary) {
        throw new Error('Fund or beneficiary not found');
      }

      if (!beneficiary.walletAddress) {
        throw new Error('Beneficiary does not have a wallet address connected');
      }

      const amountNum = parseFloat(amount);
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
      setSelectedFund('');
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

  const selectedFundData = funds.find(f => f.id === selectedFund);
  const selectedBeneficiaryData = beneficiaries.find(b => b.uid === selectedBeneficiary);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Fund Distribution</h2>

      <div className="bg-[#1a1a2e] rounded-lg shadow-lg border border-[#392e4e] p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Relief Fund *
            </label>
            <select
              value={selectedFund}
              onChange={(e) => setSelectedFund(e.target.value)}
              className="w-full px-4 py-2 bg-[#0a0a1a] border border-[#392e4e] rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a relief fund...</option>
              {funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name} - ₹{fund.totalAmountDisplay} (Remaining: ₹{(parseFloat(fund.remainingAmount.toString()) / 1e18).toFixed(2)})
                </option>
              ))}
            </select>
            {selectedFundData && (
              <div className="mt-2 p-3 bg-blue-900/20 border border-blue-900/50 rounded-lg">
                <p className="text-sm text-gray-300">
                  Available: <span className="font-semibold text-blue-400">
                    ₹{(parseFloat(selectedFundData.remainingAmount.toString()) / 1e18).toFixed(2)}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Beneficiary *
            </label>
            <select
              value={selectedBeneficiary}
              onChange={(e) => setSelectedBeneficiary(e.target.value)}
              className="w-full px-4 py-2 bg-[#0a0a1a] border border-[#392e4e] rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a beneficiary...</option>
              {beneficiaries.map((beneficiary) => (
                <option key={beneficiary.uid} value={beneficiary.uid}>
                  {beneficiary.displayName || beneficiary.email} {beneficiary.verified && '✓'}
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
            disabled={!selectedFund || !selectedBeneficiary || !amount || distributing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {distributing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Distributing...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Distribute Funds
              </>
            )}
          </button>
        </div>
      </div>

      {/* Distribution Preview */}
      {selectedFund && selectedBeneficiary && amount && (
        <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-6">
          <h3 className="font-semibold text-white mb-4">Distribution Preview</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">From Fund:</span>
              <span className="font-medium text-white">{selectedFundData?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">To Beneficiary:</span>
              <span className="font-medium text-white">
                {selectedBeneficiaryData?.displayName || selectedBeneficiaryData?.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="font-semibold text-lg text-blue-400">₹{amount} INR</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
