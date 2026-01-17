'use client';

import ReliefTicketForm from '@/components/relief/ReliefTicketForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RequestPage() {
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

                <ReliefTicketForm />

                <p className="mt-10 text-center text-gray-500 text-sm">
                    Already have an account? <Link href="/auth" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">Login as Provider/Donor</Link>
                </p>
            </div>
        </div>
    );
}
