'use client';

import { useState } from 'react';
import { Shield, Phone, User, MapPin, Tag, AlertTriangle, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { reliefRequestService } from '@/lib/firebase/services/reliefRequestService';
import { UrgencyLevel } from '@/lib/types/database';

const categories = ['Food', 'Medical', 'Shelter', 'Education', 'Water', 'Clothing', 'Other'];

export default function RequestPage() {
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
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-[#0a0a1a] border border-[#392e4e] rounded-3xl p-12 text-center"
                >
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Request Submitted!</h1>
                    <p className="text-gray-400 mb-8">
                        Your relief ticket has been created. An administrator will verify your request and contact you via phone soon.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-8 py-4 bg-blue-600 rounded-2xl font-bold hover:bg-blue-500 transition-all"
                    >
                        Back to Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white py-20 px-6">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-2xl mx-auto relative z-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

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

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6 bg-[#0a0a1a]/80 backdrop-blur-xl border border-[#392e4e] p-8 sm:p-10 rounded-[2.5rem] shadow-2xl"
                >
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
                                placeholder="Enter your name"
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
                            placeholder="Your current city/area"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400 flex items-center gap-2 ml-1">
                                <Tag className="w-4 h-4 text-blue-500" /> CATEGORY
                            </label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-5 py-4 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-white appearance-none cursor-pointer"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat} className="bg-[#0a0a1a]">{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400 flex items-center gap-2 ml-1">
                                <AlertTriangle className="w-4 h-4 text-blue-500" /> URGENCY
                            </label>
                            <select
                                value={formData.urgency}
                                onChange={e => setFormData({ ...formData, urgency: e.target.value as UrgencyLevel })}
                                className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-5 py-4 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-white appearance-none cursor-pointer text-capitalize"
                            >
                                <option value="low" className="bg-[#0a0a1a]">Low</option>
                                <option value="medium" className="bg-[#0a0a1a]">Medium</option>
                                <option value="high" className="bg-[#0a0a1a]">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400 ml-1 uppercase tracking-wider">Description of Need</label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-black/50 border border-[#392e4e] rounded-2xl px-5 py-4 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-white resize-none placeholder:text-gray-700"
                            placeholder="Tell us what help you need exactly..."
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
                        className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] active:scale-95"
                    >
                        {isSubmitting ? (
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="w-5 h-5" /> RAISE TICKET
                            </>
                        )}
                    </button>
                </motion.form>

                <p className="mt-10 text-center text-gray-500 text-sm">
                    Already have an account? <Link href="/auth" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">Login as Provider/Donor</Link>
                </p>
            </div>
        </div>
    );
}
