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
            <h1 className="text-3xl font-bold text-gray-900">Distributions</h1>
            <p className="text-gray-600 mt-2">Distribute funds to beneficiaries</p>
          </div>
          <FundDistribution />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
