'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { UserRole } from '@/lib/types/user';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'donor', label: 'Donor', description: 'Make donations to support relief efforts' },
    { value: 'admin', label: 'Admin', description: 'Manage funds and verify donations' },
    { value: 'beneficiary', label: 'Beneficiary', description: 'Receive and manage relief funds' },
    { value: 'relief_partner', label: 'Relief Partner', description: 'Execute relief operations' },
  ];

  if (selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="mb-6">
            <button
              onClick={() => setSelectedRole(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to role selection
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Sign In as {roles.find(r => r.value === selectedRole)?.label}</h1>
            <p className="text-gray-600 mt-2">Enter your credentials to continue</p>
          </div>
          <LoginForm role={selectedRole} />
          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href={`/register?role=${selectedRole}`} className="text-blue-600 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Select your role to sign in</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <h3 className="font-semibold text-lg mb-1">{role.label}</h3>
              <p className="text-sm text-gray-600">{role.description}</p>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
