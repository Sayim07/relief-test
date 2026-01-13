'use client';

import { AuthGuard } from '@/lib/middleware/withAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BeneficiaryDashboard from '@/components/dashboards/BeneficiaryDashboard';

export default function BeneficiaryPage() {
  return (
    <AuthGuard requiredRole="beneficiary">
      <DashboardLayout>
        <BeneficiaryDashboard />
      </DashboardLayout>
    </AuthGuard>
  );
}
