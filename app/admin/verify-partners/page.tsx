'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { AuthGuard } from '@/lib/middleware/withAuth';
import PartnerVerification from '@/components/admin/PartnerVerification';
import { ShieldCheck } from 'lucide-react';

export default function VerifyPartnersPage() {
    return (
        <AuthGuard requiredRole="admin">
            <DashboardLayout>
                <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6">
                    <div className="mb-10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2 bg-blue-600/10 rounded-lg border border-blue-500/20">
                                <ShieldCheck className="w-6 h-6 text-blue-500" />
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tight">Partner Verification</h1>
                        </div>
                        <p className="text-gray-400 font-medium italic underline decoration-blue-500/30">
                            Review and authorize relief partner applications
                        </p>
                    </div>

                    <PartnerVerification />
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
