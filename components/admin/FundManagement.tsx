'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { reliefFundService, donationService } from '@/lib/firebase/services/index';
import { ReliefFund, Donation } from '@/lib/types/database';
import { Plus, DollarSign, TrendingUp, Users, Loader2, X } from 'lucide-react';

export default function FundManagement() {
  const { profile } = useAuth();
  const [funds, setFunds] = useState<ReliefFund[]>([]);
  const [verifiedDonations, setVerifiedDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFund, setNewFund] = useState({
    name: '',
    description: '',
    category: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fundsData, donationsData] = await Promise.all([
        reliefFundService.getAll(),
        donationService.getByStatus('verified'),
      ]);
      setFunds(fundsData);
      setVerifiedDonations(donationsData);
    } catch (error) {
      console.error('Error loading fund data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFund = async () => {
    if (!profile?.uid || !newFund.name.trim()) {
      alert('Please provide a fund name');
      return;
    }

    try {
      // Calculate total from verified donations
      const totalAmount = verifiedDonations.reduce((sum, d) => sum + parseFloat(d.amountDisplay || '0'), 0);
      
      await reliefFundService.create({
        name: newFund.name,
        description: newFund.description,
        totalAmount: totalAmount * 1e18, // Convert to wei
        totalAmountDisplay: totalAmount.toFixed(2),
        currency: 'USDT',
        distributedAmount: 0,
        remainingAmount: totalAmount * 1e18,
        status: 'active',
        category: newFund.category || undefined,
        createdBy: profile.uid,
      });

      setNewFund({ name: '', description: '', category: '' });
      setShowCreateForm(false);
      await loadData();
    } catch (error) {
      console.error('Error creating fund:', error);
      alert('Failed to create fund');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const totalVerified = verifiedDonations.reduce((sum, d) => sum + parseFloat(d.amountDisplay || '0'), 0);
  const totalDistributed = funds.reduce((sum, f) => sum + parseFloat(f.distributedAmount.toString()) / 1e18, 0);
  const totalRemaining = funds.reduce((sum, f) => sum + parseFloat(f.remainingAmount.toString()) / 1e18, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Fund Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Fund
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            ${totalVerified.toFixed(2)}
          </h3>
          <p className="text-sm text-gray-600">Total Verified Donations</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            ${totalDistributed.toFixed(2)}
          </h3>
          <p className="text-sm text-gray-600">Total Distributed</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            ${totalRemaining.toFixed(2)}
          </h3>
          <p className="text-sm text-gray-600">Remaining Funds</p>
        </div>
      </div>

      {/* Create Fund Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create New Relief Fund</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fund Name *</label>
              <input
                type="text"
                value={newFund.name}
                onChange={(e) => setNewFund({ ...newFund, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Emergency Relief Fund 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newFund.description}
                onChange={(e) => setNewFund({ ...newFund, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the purpose of this fund..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
              <input
                type="text"
                value={newFund.category}
                onChange={(e) => setNewFund({ ...newFund, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., flood, earthquake"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateFund}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Fund
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Funds List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Relief Funds</h3>
        {funds.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No relief funds created yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {funds.map((fund) => (
              <div
                key={fund.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 mb-1">{fund.name}</h4>
                    {fund.description && (
                      <p className="text-sm text-gray-600 mb-2">{fund.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        fund.status === 'active' ? 'bg-green-100 text-green-800' :
                        fund.status === 'distributed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {fund.status}
                      </span>
                      {fund.category && (
                        <span className="text-gray-600">Category: {fund.category}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                    <p className="font-semibold text-lg text-gray-900">
                      ${fund.totalAmountDisplay} {fund.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Distributed</p>
                    <p className="font-semibold text-lg text-blue-600">
                      ${(parseFloat(fund.distributedAmount.toString()) / 1e18).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Remaining</p>
                    <p className="font-semibold text-lg text-green-600">
                      ${(parseFloat(fund.remainingAmount.toString()) / 1e18).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(parseFloat(fund.distributedAmount.toString()) / parseFloat(fund.totalAmount.toString())) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
