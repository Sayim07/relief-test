'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/lib/middleware/withAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { reliefRequestService } from '@/lib/firebase/services';
import type { ReliefRequest } from '@/lib/types/database';
import {
    XCircle,
    Phone,
    MapPin,
    Clock,
    AlertTriangle,
    User,
    Search,
    Check
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

export default function AdminRequestsPage() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<ReliefRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending_verification');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await reliefRequestService.getAll();
            setRequests(data);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, status: 'verified' | 'rejected') => {
        if (!profile?.uid) return;
        try {
            if (status === 'verified') {
                const amount = prompt('Enter approved amount (INR):', '5000');
                const wallet = prompt('Enter beneficiary wallet address (Optional):', '');
                if (amount === null) return;

                await reliefRequestService.updateStatus(id, status, profile.uid, {
                    approvedAmount: parseFloat(amount),
                    beneficiaryWallet: wallet || undefined
                });
            } else {
                await reliefRequestService.updateStatus(id, status, profile.uid);
            }
            await loadRequests();
        } catch (error) {
            console.error('Error updating request:', error);
            alert('Failed to update request');
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesFilter = filter === 'all' || req.status === filter;
        const matchesSearch =
            req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.phone.includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    return (
        <AuthGuard requiredRole="admin">
            <DashboardLayout>
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Relief Tickets</h1>
                            <p className="text-gray-400 mt-1 font-medium">Systematic verification of off-chain fund requests</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search name or phone..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="bg-[#0a0a1a] border border-[#392e4e] rounded-2xl pl-12 pr-6 py-3 text-sm focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-white outline-none w-full sm:w-64"
                                />
                            </div>
                            <select
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                className="bg-[#0a0a1a] border border-[#392e4e] rounded-2xl px-6 py-3 text-sm text-white font-bold outline-none cursor-pointer hover:border-[#4a3e5e] transition-colors"
                            >
                                <option value="all">All Records</option>
                                <option value="pending_verification">Pending Only</option>
                                <option value="verified">Verified Only</option>
                                <option value="rejected">Rejected Only</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-[0_0_20px_rgba(37,99,235,0.2)]" />
                            <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Tickets...</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {filteredRequests.map(req => (
                                <div
                                    key={req.id}
                                    className="bg-[#0a0a1a]/50 backdrop-blur-xl border border-[#392e4e] p-8 rounded-[2rem] hover:border-blue-500/30 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-8 flex gap-2">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${req.urgency === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                                                req.urgency === 'medium' ? 'bg-orange-500/10 text-orange-400 border border-orange-400/20' :
                                                    'bg-blue-500/10 text-blue-400 border border-blue-400/20'
                                            }`}>
                                            {req.urgency} Urgency
                                        </div>
                                    </div>

                                    <div className="flex flex-col lg:flex-row justify-between gap-8">
                                        <div className="space-y-6 flex-1">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full animate-pulse ${req.status === 'verified' ? 'bg-green-500' :
                                                            req.status === 'rejected' ? 'bg-red-500' :
                                                                'bg-yellow-500'
                                                        }`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                        {req.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <h3 className="text-3xl font-black flex items-center gap-3 group-hover:text-blue-400 transition-colors">
                                                    {req.name}
                                                </h3>
                                                <div className="flex flex-wrap gap-6 text-gray-400 font-bold">
                                                    <p className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                                                        <Phone className="w-4 h-4 text-blue-500" /> {req.phone}
                                                    </p>
                                                    <p className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                                                        <MapPin className="w-4 h-4 text-blue-500" /> {req.location}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-black/40 rounded-2xl border border-[#392e4e] max-w-2xl relative">
                                                <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-wider mb-3">
                                                    <Clock className="w-3 h-3" /> {req.category} Requests • {format(req.createdAt, 'PPp')}
                                                </div>
                                                <p className="text-sm text-gray-300 leading-relaxed font-medium italic">
                                                    "{req.description || 'No detailed description provided.'}"
                                                </p>
                                                <div className="absolute top-2 right-4 text-4xl text-blue-500/10 font-black pointer-events-none">
                                                    "
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex lg:flex-col justify-end items-center lg:items-end gap-4 min-w-[200px] border-t lg:border-t-0 lg:border-l border-[#392e4e] pt-6 lg:pt-0 lg:pl-10">
                                            {req.status === 'pending_verification' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(req.id, 'verified')}
                                                        className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black transition-all shadow-lg shadow-green-900/20 active:scale-95 group/btn"
                                                    >
                                                        <Check className="w-5 h-5 group-hover/btn:scale-125 transition-transform" /> VERIFY
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req.id, 'rejected')}
                                                        className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-2xl font-black transition-all active:scale-95"
                                                    >
                                                        <XCircle className="w-5 h-5" /> REJECT
                                                    </button>
                                                </>
                                            )}
                                            {req.status === 'verified' && (
                                                <div className="text-right space-y-3">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Approved Amount</p>
                                                    <p className="text-4xl font-black text-green-400 drop-shadow-sm">₹{req.approvedAmount?.toLocaleString()}</p>
                                                    {req.beneficiaryWallet ? (
                                                        <div className="bg-black/50 p-3 rounded-xl border border-[#392e4e] max-w-[180px]">
                                                            <p className="text-[9px] font-mono text-gray-400 break-all leading-relaxed">
                                                                WALLET: {req.beneficiaryWallet}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] font-bold text-gray-600 italic">No wallet linked yet</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredRequests.length === 0 && (
                                <div className="text-center py-32 bg-[#0a0a1a]/50 border-2 border-dashed border-[#392e4e] rounded-[3rem]">
                                    <AlertTriangle className="w-16 h-16 text-gray-800 mx-auto mb-6" />
                                    <p className="text-gray-500 font-black uppercase tracking-widest text-sm">No Tickets In This Category</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
