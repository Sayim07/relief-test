'use client';

import { AuthGuard } from '@/lib/middleware/withAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users } from 'lucide-react';

export default function BeneficiariesPage() {
  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Beneficiaries</h1>
            <p className="text-gray-600 mt-2">Manage beneficiary accounts and allocations</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Beneficiary Management</h3>
            <p className="text-gray-600">This feature is coming soon.</p>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
