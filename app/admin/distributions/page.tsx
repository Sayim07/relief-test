'use client';

import { AuthGuard } from '@/lib/middleware/withAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FundDistribution from '@/components/admin/FundDistribution';

export default function DistributionsPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Distributions</h1>
            <p className="text-gray-400 mt-2 text-lg drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">Distribute funds to beneficiaries</p>
          </div>
          <FundDistribution />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
