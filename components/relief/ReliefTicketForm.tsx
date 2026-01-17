'use client';

import { useState } from 'react';
import { Shield, Phone, User, MapPin, Tag, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reliefRequestService } from '@/lib/firebase/services/reliefRequestService';
import { UrgencyLevel } from '@/lib/types/database';

const categories = ['Food', 'Medical', 'Shelter', 'Education', 'Water', 'Clothing', 'Other'];

export default function ReliefTicketForm({ embedded = false }: { embedded?: boolean }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location: '',
        category: 'Food',
        urgency: 'medium' as UrgencyLevel,
        description: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await reliefRequestService.create(formData);
            setIsSubmitted(true);
        } catch (err: any) {
            console.error('Error submitting request:', err);
            setError('Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full ${embedded ? '' : 'max-w-md mx-auto'} bg-[#0a0a1a] border border-[#392e4e] rounded-3xl p-12 text-center shadow-2xl`}
            >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-white">Ticket Raised!</h2>
                <p className="text-gray-400 mb-8">
                    The relief ticket has been created successfully. An administrator will verify the request and contact the provided phone number soon.
                </p>
                <button
                    onClick={() => setIsSubmitted(false)}
                    className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white hover:bg-white/10 transition-all"
                >
                    Raise Another Ticket
                </button>
            </motion.div>
        );
    }

    return (
        <div className={`w-full ${embedded ? '' : 'max-w-2xl mx-auto'}`}>
            {!embedded && (
                <div className="flex items-center gap-4 mb-12">
                    <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                        <Shield className="w-10 h-10 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                            Raise Relief Ticket
                        </h1>
                        <p className="text-gray-400 mt-1">Apply for emergency assistance (No wallet required)</p>
                    </div>
                </div>
            )}

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6 bg-[#0a0a1a]/80 backdrop-blur-xl border border-[#392e4e] p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400 flex items-center gap-2 ml-1">
                            <User className="w-4 h-4 text-blue-500" /> FULL NAME
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-5 py-4 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-white placeholder:text-gray-700"
                            placeholder="Recipient's Name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400 flex items-center gap-2 ml-1">
                            <Phone className="w-4 h-4 text-blue-500" /> PHONE NUMBER
                        </label>
                        <input
                            required
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-5 py-4 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-white placeholder:text-gray-700"
                            placeholder="+91 XXXXX XXXXX"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-400 flex items-center gap-2 ml-1">
                        <MapPin className="w-4 h-4 text-blue-500" /> LOCATION
                    </label>
                    <input
                        required
                        type="text"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-5 py-4 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-white placeholder:text-gray-700"
                        placeholder="City, District, or Specific Area"
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400 flex items-center gap-2 ml-1">
                            <Tag className="w-4 h-4 text-blue-500" /> CATEGORY
                        </label>
                        <div className="relative">
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-5 py-4 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-white appearance-none cursor-pointer"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat} className="bg-[#0a0a1a]">{cat}</option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400 flex items-center gap-2 ml-1">
                            <AlertTriangle className="w-4 h-4 text-blue-500" /> URGENCY
                        </label>
                        <div className="relative">
                            <select
                                value={formData.urgency}
                                onChange={e => setFormData({ ...formData, urgency: e.target.value as UrgencyLevel })}
                                className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-5 py-4 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-white appearance-none cursor-pointer"
                            >
                                <option value="low" className="bg-[#0a0a1a]">Low Priority</option>
                                <option value="medium" className="bg-[#0a0a1a]">Medium Priority</option>
                                <option value="high" className="bg-[#0a0a1a]">High Priority</option>
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-400 ml-1 uppercase tracking-wider">Description of Need</label>
                    <textarea
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-5 py-4 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-white resize-none placeholder:text-gray-700 font-medium"
                        placeholder="Describe the aid needed (e.g. 'Needs medicines for 2 children and basic food rations for 1 week')..."
                    />
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {error}
                    </div>
                )}

                <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] active:scale-95 transition-all duration-300"
                >
                    {isSubmitting ? (
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> RAISE RELIEF TICKET
                        </>
                    )}
                </button>
            </motion.form>
        </div>
    );
}
