'use client';

import { AuthGuard } from '@/lib/middleware/withAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileQuestion } from 'lucide-react';

export default function RequestsPage() {
  return (
    <AuthGuard requiredRole="beneficiary">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Fund Requests</h1>
            <p className="text-gray-400 mt-2">Request additional funds from administrators</p>
          </div>

          <div className="bg-[#0a0a1a] rounded-xl shadow-sm border border-[#392e4e] p-12 text-center">
            <FileQuestion className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Fund Requests</h3>
            <p className="text-gray-400">This feature is coming soon.</p>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
