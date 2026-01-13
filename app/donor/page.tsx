'use client';

import { AuthGuard } from '@/lib/middleware/withAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DonorDashboard from '@/components/dashboards/DonorDashboard';

export default function DonorPage() {
  return (
    <AuthGuard requiredRole="donor">
      <DashboardLayout>
        <DonorDashboard />
      </DashboardLayout>
    </AuthGuard>
  );
}
