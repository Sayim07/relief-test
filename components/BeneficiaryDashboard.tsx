'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { getReliefTokenContract, reliefTokenFunctions } from '@/lib/contracts/reliefToken';
import { transactionService, categoryService } from '@/lib/firebase/services';
import { Wallet, TrendingUp, FileText, Send } from 'lucide-react';

export default function BeneficiaryDashboard() {
  const { address, signer, isConnected } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [categories, setCategories] = useState<any[]>([]);
  const [spending, setSpending] = useState<Record<string, { spent: string; limit: string }>>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transferForm, setTransferForm] = useState({
    to: '',
    amount: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadData();
    }
  }, [isConnected, address]);

  const loadData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const contract = getReliefTokenContract(signer!);
      
      // Load balance
      const bal = await reliefTokenFunctions.getBalance(contract, address);
      setBalance(bal.toString());

      // Load categories
      const cats = await categoryService.getAll();
      setCategories(cats);

      // Load spending for each category
      const spendingData: Record<string, { spent: string; limit: string }> = {};
      for (const cat of cats) {
        try {
          const data = await reliefTokenFunctions.getCategorySpending(contract, address, cat.id);
          spendingData[cat.id] = data;
        } catch (error) {
          // If category doesn't exist on contract, set defaults
          spendingData[cat.id] = { spent: '0', limit: '0' };
        }
      }
      setSpending(spendingData);

      // Load transactions
      const txs = await transactionService.getByAddress(address);
      setTransactions(txs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!signer || !transferForm.to || !transferForm.amount || !transferForm.category) return;

    setLoading(true);
    try {
      const contract = getReliefTokenContract(signer);
      await reliefTokenFunctions.transferWithCategory(
        contract,
        transferForm.to,
        BigInt(transferForm.amount),
        transferForm.category
      );
      
      setTransferForm({ to: '', amount: '', category: '' });
      await loadData();
      alert('Transfer successful!');
    } catch (error: any) {
      console.error('Error transferring:', error);
      alert(error.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Balance</p>
              <p className="text-2xl font-bold">{balance} RLT</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Available Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Category Spending Limits</h2>
        <div className="space-y-3">
          {categories.map((cat) => {
            const data = spending[cat.id] || { spent: '0', limit: '0' };
            const spent = parseFloat(data.spent);
            const limit = parseFloat(data.limit);
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;

            return (
              <div key={cat.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{cat.name}</span>
                  <span className="text-sm text-gray-600">
                    {data.spent} / {data.limit} RLT
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Send className="w-5 h-5" />
          Transfer Funds
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Recipient Address</label>
            <input
              type="text"
              value={transferForm.to}
              onChange={(e) => setTransferForm({ ...transferForm, to: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="0x..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              value={transferForm.amount}
              onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Amount in RLT"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={transferForm.category}
              onChange={(e) => setTransferForm({ ...transferForm, category: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleTransfer}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Transfer'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="text-gray-600">No transactions found.</p>
          ) : (
            transactions.map((tx, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{tx.category}</p>
                    <p className="text-sm text-gray-600">To: {tx.to.slice(0, 10)}...</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{tx.amount} RLT</p>
                    <p className="text-sm text-gray-600">
                      {new Date(tx.timestamp.toMillis()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
