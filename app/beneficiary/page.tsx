import { AuthGuard } from '@/lib/middleware/withAuth';
import BeneficiaryDashboard from '@/components/BeneficiaryDashboard';

export default function BeneficiaryPage() {
  return (
    <AuthGuard requiredRole="beneficiary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Beneficiary Dashboard</h1>
          <p className="text-gray-600 mt-2">
            View your balance, spending limits, and manage your relief funds
          </p>
        </div>
        <BeneficiaryDashboard />
      </div>
    </AuthGuard>
  );
}
