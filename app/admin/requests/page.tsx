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
    Check,
    ShieldCheck,
    AlertCircle,
    Zap,
    Key,
    IndianRupee,
    Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminRequestsPage() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<ReliefRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending_verification');
    const [searchTerm, setSearchTerm] = useState('');

    // Verification Modal State
    const [verifyingReq, setVerifyingReq] = useState<ReliefRequest | null>(null);
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState(false);
    const [verificationStep, setVerificationStep] = useState<'otp' | 'approve'>('otp');
    const [approvalData, setApprovalData] = useState({ amount: '5000', wallet: '' });

    // Duplicate Detection Logic
    const phoneCounts = requests.reduce((acc: Record<string, number>, req) => {
        acc[req.phone] = (acc[req.phone] || 0) + 1;
        return acc;
    }, {});

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

        if (status === 'rejected') {
            if (!confirm('Are you sure you want to reject this request?')) return;
            try {
                await reliefRequestService.updateStatus(id, status, profile.uid);
                await loadRequests();
            } catch (error) {
                console.error('Error rejecting request:', error);
                alert('Failed to reject request');
            }
            return;
        }

        // For verification, open the modal
        const req = requests.find(r => r.id === id);
        if (req) {
            setVerifyingReq(req);
            setVerificationStep('otp');
            setOtp('');
            setOtpError(false);
            setApprovalData({ amount: '5000', wallet: req.beneficiaryWallet || '' });
        }
    };

    const confirmVerification = async () => {
        if (!verifyingReq || !profile?.uid) return;

        try {
            setLoading(true);
            await reliefRequestService.updateStatus(verifyingReq.id, 'verified', profile.uid, {
                approvedAmount: parseFloat(approvalData.amount),
                beneficiaryWallet: approvalData.wallet || undefined
            });
            setVerifyingReq(null);
            await loadRequests();
        } catch (error) {
            console.error('Error verifying request:', error);
            alert('Failed to verify request');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPSubmit = () => {
        // Simulate OTP check (any 6 digit code works for demo)
        if (otp === '123456' || otp.length === 6) {
            setVerificationStep('approve');
            setOtpError(false);
        } else {
            setOtpError(true);
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
                                                    {req.status === 'verified' && (
                                                        <span className="flex items-center gap-1 text-[9px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-tighter">
                                                            <Zap className="w-3 h-3" /> On-Chain Ready
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-3xl font-black group-hover:text-blue-400 transition-colors">
                                                        {req.name}
                                                    </h3>
                                                    {phoneCounts[req.phone] > 1 && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-500">
                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{phoneCounts[req.phone] - 1} Potential Duplicate</span>
                                                        </div>
                                                    )}
                                                </div>
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
                                                        <ShieldCheck className="w-5 h-5 group-hover/btn:scale-125 transition-transform" /> VERIFY
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
                                                        <p className="text-[10px] font-bold text-blue-500/70 italic flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> Pending Wallet Link
                                                        </p>
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

            {/* Verification Modal */}
            <AnimatePresence>
                {verifyingReq && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setVerifyingReq(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0a0a1a] border border-[#392e4e] rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 sm:p-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20">
                                        <ShieldCheck className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white">Verification Center</h2>
                                        <p className="text-xs text-gray-500 uppercase font-black tracking-widest mt-1">Legitimacy Audit for {verifyingReq.name}</p>
                                    </div>
                                </div>

                                {verificationStep === 'otp' ? (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                                            <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                                A simulated 6-digit OTP has been sent to <span className="text-blue-400 font-bold">{verifyingReq.phone}</span>.
                                                Please enter identifying code to confirm possession.
                                            </p>
                                            <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] mt-3">Demo Tip: Enter any 6 digits</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="relative">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    value={otp}
                                                    onChange={e => setOtp(e.target.value)}
                                                    className={`w-full bg-black/50 border ${otpError ? 'border-red-500' : 'border-[#392e4e]'} rounded-2xl pl-12 pr-6 py-4 text-2xl font-black tracking-[0.5em] focus:ring-4 focus:ring-blue-500/10 transition-all text-white outline-none`}
                                                    placeholder="000000"
                                                />
                                            </div>
                                            {otpError && <p className="text-xs text-red-500 font-bold ml-2 italic">Invalid OTP. Please try again.</p>}
                                        </div>

                                        <button
                                            onClick={handleOTPSubmit}
                                            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/20 active:scale-95"
                                        >
                                            CONFIRM IDENTITY
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Approved Amount (INR)</label>
                                                <div className="relative">
                                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                                    <input
                                                        type="number"
                                                        value={approvalData.amount}
                                                        onChange={e => setApprovalData({ ...approvalData, amount: e.target.value })}
                                                        className="w-full bg-black/50 border border-[#392e4e] rounded-xl pl-10 pr-4 py-3 text-white font-bold outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Category Bind</label>
                                                <div className="w-full bg-black/50 border border-[#392e4e] rounded-xl px-4 py-3 text-white font-bold opacity-60">
                                                    {verifyingReq.category}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Beneficiary Wallet (Optional)</label>
                                            <div className="relative">
                                                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                                <input
                                                    type="text"
                                                    value={approvalData.wallet}
                                                    onChange={e => setApprovalData({ ...approvalData, wallet: e.target.value })}
                                                    className="w-full bg-black/50 border border-[#392e4e] rounded-xl pl-10 pr-4 py-3 text-white font-mono text-xs outline-none"
                                                    placeholder="0x..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => setVerificationStep('otp')}
                                                className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black transition-all"
                                            >
                                                BACK
                                            </button>
                                            <button
                                                onClick={confirmVerification}
                                                className="flex-[2] py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-green-900/20"
                                            >
                                                APPROVE TICKET
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AuthGuard>
    );
}
