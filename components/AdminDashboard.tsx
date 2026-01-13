'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { getReliefTokenContract, reliefTokenFunctions } from '@/lib/contracts/reliefToken';
import { beneficiaryService, categoryService } from '@/lib/firebase/services';
import { initializeCategories } from '@/lib/firebase/init-collections';
import { Plus, Users, DollarSign, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const { address, signer, isConnected } = useWallet();
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBeneficiary, setNewBeneficiary] = useState({
    address: '',
    name: '',
    email: '',
    categories: {} as Record<string, number>,
  });

  useEffect(() => {
    if (isConnected) {
      // Initialize categories if they don't exist
      initializeCategories().catch(console.error);
      loadData();
    }
  }, [isConnected]);

  const loadData = async () => {
    try {
      const [beneficiariesData, categoriesData] = await Promise.all([
        beneficiaryService.getAll(),
        categoryService.getAll(),
      ]);
      setBeneficiaries(beneficiariesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleWhitelist = async () => {
    if (!signer || !newBeneficiary.address) return;

    setLoading(true);
    try {
      const contract = getReliefTokenContract(signer);
      const categoryNames = Object.keys(newBeneficiary.categories);
      const limits = Object.values(newBeneficiary.categories).map(v => BigInt(v));

      // Whitelist on blockchain
      await reliefTokenFunctions.whitelistBeneficiary(
        contract,
        newBeneficiary.address,
        categoryNames,
        limits
      );

      // Save to Firebase
      await beneficiaryService.create({
        walletAddress: newBeneficiary.address,
        name: newBeneficiary.name,
        email: newBeneficiary.email,
        verified: true,
        categories: Object.fromEntries(
          categoryNames.map(cat => [
            cat,
            { limit: newBeneficiary.categories[cat], spent: 0 },
          ])
        ),
      });

      setNewBeneficiary({ address: '', name: '', email: '', categories: {} });
      await loadData();
    } catch (error) {
      console.error('Error whitelisting beneficiary:', error);
      alert('Failed to whitelist beneficiary');
    } finally {
      setLoading(false);
    }
  };

  const handleDistribute = async (beneficiaryAddress: string, amount: string, category: string) => {
    if (!signer) return;

    setLoading(true);
    try {
      const contract = getReliefTokenContract(signer);
      await reliefTokenFunctions.distributeRelief(
        contract,
        beneficiaryAddress,
        BigInt(amount),
        category
      );
      alert('Relief distributed successfully!');
      await loadData();
    } catch (error) {
      console.error('Error distributing relief:', error);
      alert('Failed to distribute relief');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to access the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Beneficiaries</p>
              <p className="text-2xl font-bold">{beneficiaries.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Active Relief</p>
              <p className="text-2xl font-bold">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold">Tracked</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Whitelist New Beneficiary
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Wallet Address</label>
            <input
              type="text"
              value={newBeneficiary.address}
              onChange={(e) => setNewBeneficiary({ ...newBeneficiary, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="0x..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={newBeneficiary.name}
              onChange={(e) => setNewBeneficiary({ ...newBeneficiary, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category Limits</label>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="w-32">{cat.name}:</span>
                  <input
                    type="number"
                    value={newBeneficiary.categories[cat.id] || ''}
                    onChange={(e) =>
                      setNewBeneficiary({
                        ...newBeneficiary,
                        categories: {
                          ...newBeneficiary.categories,
                          [cat.id]: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="flex-1 px-4 py-2 border rounded-lg"
                    placeholder="Limit amount"
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleWhitelist}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Whitelist Beneficiary'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Beneficiaries</h2>
        <div className="space-y-4">
          {beneficiaries.map((ben) => (
            <div key={ben.walletAddress} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{ben.name}</p>
                  <p className="text-sm text-gray-600 font-mono">{ben.walletAddress}</p>
                </div>
                <div className="space-y-2">
                  {Object.entries(ben.categories || {}).map(([cat, data]: [string, any]) => {
                    const inputId = `distribute-${ben.walletAddress}-${cat}`;
                    return (
                      <div key={cat} className="flex gap-4 items-center">
                        <span className="text-sm">{cat}:</span>
                        <input
                          id={inputId}
                          type="number"
                          placeholder="Amount"
                          className="w-32 px-2 py-1 border rounded"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              handleDistribute(ben.walletAddress, input.value, cat);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(inputId) as HTMLInputElement;
                            if (input && input.value) {
                              handleDistribute(ben.walletAddress, input.value, cat);
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Distribute
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
