import { AuthGuard } from '@/lib/middleware/withAuth';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage beneficiaries, distribute relief funds, and monitor the system
          </p>
        </div>
        <AdminDashboard />
      </div>
    </AuthGuard>
  );
}
