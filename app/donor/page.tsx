import { AuthGuard } from '@/lib/middleware/withAuth';
import DonorDashboard from '@/components/donor/DonorDashboard';

export default function DonorPage() {
  return (
    <AuthGuard requiredRole="donor">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Donor Dashboard</h1>
          <p className="text-gray-600 mt-2">Make donations to support relief efforts</p>
        </div>
        <DonorDashboard />
      </div>
    </AuthGuard>
  );
}
