import { AuthGuard } from '@/lib/middleware/withAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReliefPartnerDashboard from '@/components/dashboards/ReliefPartnerDashboard';

export default function ReliefPartnerPage() {
  return (
    <AuthGuard requiredRole="relief_partner">
      <DashboardLayout>
        <ReliefPartnerDashboard />
      </DashboardLayout>
    </AuthGuard>
  );
}
