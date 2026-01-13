import { AuthGuard } from '@/lib/middleware/withAuth';

export default function ReliefPartnerPage() {
  return (
    <AuthGuard requiredRole="relief_partner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Relief Partner Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage assigned relief funds and operations</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600">Relief Partner dashboard coming soon...</p>
        </div>
      </div>
    </AuthGuard>
  );
}
