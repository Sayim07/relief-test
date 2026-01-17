'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Shield, TrendingUp, BarChart3, Activity, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { donationService, reliefRequestService } from '@/lib/firebase/services';
import { format } from 'date-fns';

export default function AuditPage() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalETH: 0,
    totalRequests: 0,
    verifiedCount: 0,
  });

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      const [donations, requests] = await Promise.all([
        donationService.getAll(),
        reliefRequestService.getAll()
      ]);

      // 1. Line Chart Data (ETH Flow over time)
      const sortedDonations = [...donations]
        .filter(d => d.status === 'verified' || d.status === 'distributed' || d.status === 'pending')
        .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));

      let runningTotal = 0;
      const flow = sortedDonations.map(d => {
        runningTotal += parseFloat(d.amountDisplay || '0');
        return {
          name: d.createdAt ? format(d.createdAt, 'MMM d') : 'N/A',
          amount: runningTotal,
          fullDate: d.createdAt ? format(d.createdAt, 'PP') : 'N/A'
        };
      });
      setChartData(flow);

      // 2. Bar Chart Data (Category-wise Distribution)
      const categoryMap: Record<string, number> = {};
      donations.forEach(d => {
        const cat = d.category || 'General';
        categoryMap[cat] = (categoryMap[cat] || 0) + parseFloat(d.amountDisplay || '0');
      });
      const categories = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
      setCategoryData(categories);

      // 3. Status Badges & Stats
      setTransactions(donations.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)));
      setStats({
        totalETH: runningTotal,
        totalRequests: requests.length,
        verifiedCount: requests.filter(r => r.status === 'verified').length
      });

    } catch (error) {
      console.error('Error loading audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return 'N/A';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black">
        <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs">Synchronizing Audit Trail</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/80 border-b border-[#392e4e]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-blue-600/10 rounded-xl border border-blue-500/20 group-hover:bg-blue-600/20 transition-all">
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-xl font-black tracking-tight">ReliefChain</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-500 hover:text-white font-bold transition-all px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="animate-in fade-in slide-in-from-left-4 duration-1000">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Live Ledger</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
              Audit Trail
            </h1>
            <p className="text-gray-400 mt-4 text-lg font-medium max-w-2xl leading-relaxed italic">
              Real-time systematic intelligence fetching ledger data from Ethereum Sepolia & Firebase.
              Complete transparency for every donation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto animate-in fade-in slide-in-from-right-4 duration-1000">
            <div className="p-6 bg-[#0a0a1a] border border-[#392e4e] rounded-3xl group hover:border-blue-500/50 transition-all">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Total Donated</p>
              <p className="text-3xl font-black">₹{stats.totalETH.toLocaleString()}</p>
            </div>
            <div className="p-6 bg-[#0a0a1a] border border-[#392e4e] rounded-3xl group hover:border-green-500/50 transition-all">
              <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-2">Verified Tickets</p>
              <p className="text-3xl font-black text-green-400">{stats.verifiedCount} <span className="text-xs text-gray-500">/ {stats.totalRequests}</span></p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          {/* Main Chart - Line */}
          <div className="lg:col-span-2 bg-[#0a0a1a]/50 backdrop-blur-xl border border-[#392e4e] p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-blue-600/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-500" /> ETH FLOW OVER TIME
                </h3>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#4a3e5e"
                      fontSize={11}
                      fontWeight="black"
                      axisLine={false}
                      tickLine={false}
                      dy={15}
                    />
                    <YAxis
                      stroke="#4a3e5e"
                      fontSize={11}
                      fontWeight="black"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0a1a', border: '1px solid #392e4e', borderRadius: '20px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#3b82f6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#3b82f6"
                      strokeWidth={5}
                      dot={{ r: 6, fill: '#3b82f6', strokeWidth: 4, stroke: "#000" }}
                      activeDot={{ r: 8, strokeWidth: 0, fill: '#60a5fa' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Side Chart - Bar */}
          <div className="bg-[#0a0a1a]/50 backdrop-blur-xl border border-[#392e4e] p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-purple-600/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-purple-500" /> CATEGORY SPLIT
                </h3>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#4a3e5e"
                      fontSize={10}
                      fontWeight="black"
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0a1a', border: '1px solid #392e4e', borderRadius: '20px' }}
                      cursor={{ fill: '#ffffff05' }}
                    />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={34}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Ledger Entries */}
        <div className="bg-[#0a0a1a]/50 backdrop-blur-xl border border-[#392e4e] rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <div className="p-8 sm:p-10 border-b border-[#392e4e] flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-2xl font-black flex items-center gap-4">
              <Activity className="w-6 h-6 text-blue-500" /> SYSTEM LEDGER
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] bg-black/40 px-4 py-2 rounded-full border border-[#392e4e]">
                Last 50 Records
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/40 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-[#392e4e]">
                  <th className="px-10 py-6">Verification</th>
                  <th className="px-10 py-6">Ledger Identity</th>
                  <th className="px-10 py-6 text-right">Volume</th>
                  <th className="px-10 py-6">Sector</th>
                  <th className="px-10 py-6">Record Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#392e4e]">
                {transactions.slice(0, 50).map((tx, idx) => (
                  <tr key={tx.id || idx} className="hover:bg-blue-600/5 transition-all group cursor-default">
                    <td className="px-10 py-8">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full w-fit text-[10px] font-black uppercase tracking-widest shadow-lg ${tx.status === 'verified' || tx.status === 'distributed'
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20 shadow-green-500/5'
                          : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-yellow-500/5'
                        }`}>
                        {tx.status === 'verified' || tx.status === 'distributed' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {tx.status}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="font-mono text-xs text-blue-400 group-hover:text-blue-300 transition-colors font-bold">
                        {tx.transactionHash ? formatAddress(tx.transactionHash) : 'Pending Settlement...'}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-2 uppercase font-black tracking-widest flex items-center gap-2">
                        <span className="opacity-50">Origin:</span> {tx.donorId ? formatAddress(tx.donorId) : 'System Pool'}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <span className="text-2xl font-black text-white group-hover:scale-110 transition-transform origin-right inline-block">
                        ₹{parseFloat(tx.amountDisplay || '0').toLocaleString()}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-2 rounded-2xl text-[10px] font-black border uppercase tracking-widest ${idx % 2 === 0 ? 'bg-blue-500/5 border-blue-500/20 text-blue-400' : 'bg-purple-500/5 border-purple-500/20 text-purple-400'
                        }`}>
                        {tx.category || 'General'}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-xs text-gray-500 font-bold uppercase tracking-tighter">
                      {tx.createdAt ? format(tx.createdAt, 'PPp') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-40 border-t border-[#392e4e]">
              <Activity className="w-16 h-16 text-gray-800 mx-auto mb-6 animate-pulse" />
              <p className="text-gray-600 font-black uppercase tracking-[0.5em] text-xs">Awaiting Global Records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
