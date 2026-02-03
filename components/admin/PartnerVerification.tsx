'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { verificationTicketService, userService } from '@/lib/firebase/services';
import { reliefTokenFunctions, getReliefTokenContract } from '@/lib/contracts/reliefToken';
import { VerificationTicket } from '@/lib/types/database';
import { CheckCircle, XCircle, Clock, Eye, Loader2, AlertCircle, Building, MapPin, Tag, ExternalLink } from 'lucide-react';

export default function PartnerVerification() {
    const { profile } = useAuth();
    const { signer, isConnected } = useWallet();
    const [tickets, setTickets] = useState<VerificationTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<VerificationTicket | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPendingTickets();
    }, []);

    const loadPendingTickets = async () => {
        try {
            setLoading(true);
            const pending = await verificationTicketService.getByStatus('pending');
            setTickets(pending);
        } catch (err: any) {
            console.error('Error loading tickets:', err);
            setError('Failed to load verification tickets');
        } finally {
            setLoading(false);
        }
    };

    const generatePartnerKey = (categories: string[]) => {
        const primary = categories.length > 0 ? categories[0].toUpperCase() : 'GEN';
        const random = Math.random().toString(16).substring(2, 8).toUpperCase();
        return `RP-${primary}-${random}`;
    };

    const handleApprove = async (ticket: VerificationTicket) => {
        if (!profile || !signer || !isConnected) {
            alert('Wallet connection required for approval');
            return;
        }

        setProcessing(ticket.id);
        try {
            const partnerKey = generatePartnerKey(ticket.categories);

            // 1. Whitelist on-chain
            try {
                const contract = getReliefTokenContract(signer);
                await reliefTokenFunctions.whitelistReliefPartner(contract, ticket.walletAddress, partnerKey);
            } catch (contractError: any) {
                console.error('On-chain whitelisting failed:', contractError);
                if (!contractError?.message?.includes('already verified')) {
                    throw new Error(`Blockchain error: ${contractError.message || 'Unknown error'}`);
                }
            }

            // 2. Update Ticket
            await verificationTicketService.updateStatus(ticket.id, 'approved');

            // 3. Update User Profile
            await userService.update(ticket.uid, {
                verified: true,
                verificationTimestamp: new Date(),
                reliefPartnerKey: partnerKey,
                organization: ticket.organizationName,
                location: ticket.location,
                reliefCategories: ticket.categories,
                hasSubmittedTicket: false // Ticket is resolved
            });

            await loadPendingTickets();
            setSelectedTicket(null);
            alert(`Partner approved! Issued Key: ${partnerKey}`);
        } catch (err: any) {
            console.error('Approval error:', err);
            alert(err.message || 'Failed to approve partner');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (ticketId: string, uid: string, reason: string) => {
        if (!reason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        setProcessing(ticketId);
        try {
            await verificationTicketService.updateStatus(ticketId, 'rejected', reason);
            await userService.update(uid, {
                hasSubmittedTicket: false
            });
            await loadPendingTickets();
            setSelectedTicket(null);
        } catch (err: any) {
            console.error('Rejection error:', err);
            alert('Failed to reject ticket');
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Partner Verification</h2>
                <button
                    onClick={loadPendingTickets}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                >
                    <Loader2 className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {tickets.length === 0 ? (
                <div className="bg-[#1a1a2e] rounded-2xl p-12 text-center border border-[#392e4e]">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Pending Tickets</h3>
                    <p className="text-gray-400">All relief partner verification requests have been processed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            className="bg-[#1a1a2e] border border-[#392e4e] rounded-2xl p-6 hover:bg-[#1a1a2e]/80 transition-all group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                            <Building className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{ticket.organizationName}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <MapPin className="w-3 h-3" />
                                                {ticket.location}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {ticket.categories.map((cat) => (
                                            <span key={cat} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>

                                    <p className="text-sm text-gray-400 line-clamp-2 italic font-light">
                                        "{ticket.description}"
                                    </p>

                                    <div className="text-xs font-mono text-gray-500 bg-black/20 p-2 rounded-lg break-all">
                                        Wallet: {ticket.walletAddress}
                                    </div>
                                </div>

                                <div className="flex flex-wrap md:flex-nowrap gap-3 h-fit">
                                    <button
                                        onClick={() => setSelectedTicket(ticket)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/5 shadow-xl"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Review
                                    </button>
                                    <button
                                        onClick={() => handleApprove(ticket)}
                                        disabled={processing === ticket.id}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-50 transition-all shadow-xl shadow-green-900/20"
                                    >
                                        {processing === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedTicket && (
                <TicketDetailModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onApprove={() => handleApprove(selectedTicket)}
                    onReject={(reason: string) => handleReject(selectedTicket.id, selectedTicket.uid, reason)}
                    processing={processing === selectedTicket.id}
                />
            )}
        </div>
    );
}

function TicketDetailModal({ ticket, onClose, onApprove, onReject, processing }: any) {
    const [rejectReason, setRejectReason] = useState('');
    const [showReject, setShowReject] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 overflow-y-auto">
            <div className="bg-[#0a0a1a] border border-[#392e4e] rounded-3xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden">
                <div className="p-8 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">Partner Detail Review</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
                            <XCircle className="w-8 h-8" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <section>
                                <h4 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] mb-4">Organization</h4>
                                <div className="space-y-2">
                                    <p className="text-2xl font-bold text-white leading-tight">{ticket.organizationName}</p>
                                    <p className="text-gray-400 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-blue-500" />
                                        {ticket.location}
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-black uppercase text-purple-500 tracking-[0.2em] mb-4">Categories</h4>
                                <div className="flex flex-wrap gap-2">
                                    {ticket.categories.map((cat: string) => (
                                        <span key={cat} className="px-4 py-2 bg-purple-500/5 border border-purple-500/10 rounded-xl text-xs font-bold text-purple-400 uppercase tracking-widest">
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-black uppercase text-yellow-500 tracking-[0.2em] mb-4">Mission Description</h4>
                                <p className="text-gray-300 leading-relaxed font-light italic">
                                    "{ticket.description}"
                                </p>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-4">Trust Identity</h4>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl font-mono text-[10px] text-gray-400 break-all leading-relaxed">
                                    UID: {ticket.uid}<br />
                                    WALLET: {ticket.walletAddress}
                                </div>
                            </section>
                        </div>

                        <div className="space-y-8">
                            <section>
                                <h4 className="text-[10px] font-black uppercase text-green-500 tracking-[0.2em] mb-4">Operational Evidence</h4>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-3 px-1">Image Gallery</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {ticket.proofImages.map((url: string, i: number) => (
                                                <a key={i} href={url} target="_blank" rel="noreferrer" className="relative group block aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
                                                    <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-all flex items-center justify-center">
                                                        <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>

                                    {ticket.proofVideos.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-3 px-1">Video Proofs</p>
                                            <div className="space-y-3">
                                                {ticket.proofVideos.map((url: string, i: number) => (
                                                    <video key={i} controls className="w-full rounded-xl border border-white/10 shadow-lg">
                                                        <source src={url} type="video/mp4" />
                                                        Your browser does not support the video tag.
                                                    </video>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col md:flex-row gap-4 border-t border-white/5 pt-8">
                        {!showReject ? (
                            <>
                                <button
                                    onClick={onApprove}
                                    disabled={processing}
                                    className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-green-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                    Approve Partner & Issue Key
                                </button>
                                <button
                                    onClick={() => setShowReject(true)}
                                    disabled={processing}
                                    className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all opacity-80 hover:opacity-100"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Reject Request
                                </button>
                            </>
                        ) : (
                            <div className="w-full space-y-4">
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Please provide reason for rejection..."
                                    rows={3}
                                    className="w-full bg-[#1a1a2e] border border-red-500/30 rounded-2xl p-4 text-white focus:ring-2 focus:ring-red-500 outline-none placeholder:text-gray-600 text-sm italic"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => onReject(rejectReason)}
                                        disabled={!rejectReason.trim() || processing}
                                        className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all"
                                    >
                                        Confirm Rejection
                                    </button>
                                    <button
                                        onClick={() => setShowReject(false)}
                                        className="px-6 h-12 bg-[#1a1a2e] text-gray-400 rounded-xl font-bold text-sm hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
