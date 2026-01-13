'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { reliefFundService, beneficiaryFundService, userService } from '@/lib/firebase/services/index';
import { ReliefFund, BeneficiaryFund } from '@/lib/types/database';
import { UserProfile } from '@/lib/types/user';
import { DollarSign, Users, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

export default function FundDistribution() {
  const { profile } = useAuth();
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

      const amountWei = amountNum * 1e18;

      // Check if fund has enough remaining
      if (parseFloat(fund.remainingAmount.toString()) < amountWei) {
        alert('Insufficient funds in selected relief fund');
        return;
      }

      // Create beneficiary fund assignment
      await beneficiaryFundService.create({
        beneficiaryId: beneficiary.uid,
        beneficiaryEmail: beneficiary.email,
        beneficiaryName: beneficiary.displayName,
        reliefFundId: fund.id,
        amount: amountWei,
        amountDisplay: amount,
        currency: fund.currency,
        category: fund.category,
        status: 'active',
        assignedBy: profile.uid,
        assignedAt: new Date(),
        distributedAmount: 0,
        remainingAmount: amountWei,
      });

      // Update relief fund
      await reliefFundService.updateDistributedAmount(fund.id, amountWei);

      // Reset form
      setSelectedFund('');
      setSelectedBeneficiary('');
      setAmount('');
      
      await loadData();
      alert('Funds distributed successfully!');
    } catch (error) {
      console.error('Error distributing funds:', error);
      alert('Failed to distribute funds');
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
      <h2 className="text-2xl font-bold text-gray-900">Fund Distribution</h2>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Relief Fund *
            </label>
            <select
              value={selectedFund}
              onChange={(e) => setSelectedFund(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a relief fund...</option>
              {funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name} - ${fund.totalAmountDisplay} (Remaining: ${(parseFloat(fund.remainingAmount.toString()) / 1e18).toFixed(2)})
                </option>
              ))}
            </select>
            {selectedFundData && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Available: <span className="font-semibold text-blue-600">
                    ${(parseFloat(selectedFundData.remainingAmount.toString()) / 1e18).toFixed(2)}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Beneficiary *
            </label>
            <select
              value={selectedBeneficiary}
              onChange={(e) => setSelectedBeneficiary(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a beneficiary...</option>
              {beneficiaries.map((beneficiary) => (
                <option key={beneficiary.uid} value={beneficiary.uid}>
                  {beneficiary.displayName || beneficiary.email} {beneficiary.verified && '✓'}
                </option>
              ))}
            </select>
            {selectedBeneficiaryData && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  {selectedBeneficiaryData.displayName || selectedBeneficiaryData.email}
                  {selectedBeneficiaryData.location && ` - ${selectedBeneficiaryData.location}`}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (USDT) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            {selectedFundData && amount && (
              <p className="mt-1 text-sm text-gray-500">
                Remaining after distribution: ${(parseFloat(selectedFundData.remainingAmount.toString()) / 1e18 - parseFloat(amount || '0')).toFixed(2)}
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Distribution Preview</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">From Fund:</span>
              <span className="font-medium text-gray-900">{selectedFundData?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">To Beneficiary:</span>
              <span className="font-medium text-gray-900">
                {selectedBeneficiaryData?.displayName || selectedBeneficiaryData?.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-lg text-blue-600">${amount} USDT</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
