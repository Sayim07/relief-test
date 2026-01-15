'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { UserRole } from '@/lib/types/user';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role') as UserRole | null;

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'donor', label: 'Donor', description: 'Make donations to support relief efforts' },
    { value: 'admin', label: 'Admin', description: 'Manage funds and verify donations' },
    { value: 'beneficiary', label: 'Beneficiary', description: 'Receive and manage relief funds' },
    { value: 'relief_partner', label: 'Relief Partner', description: 'Execute relief operations' },
  ];

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'from-blue-500 to-blue-600';
      case 'beneficiary':
        return 'from-green-500 to-green-600';
      case 'donor':
        return 'from-purple-500 to-purple-600';
      case 'relief_partner':
        return 'from-orange-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  // Redirect to /auth if no role is specified
  useEffect(() => {
    if (!roleParam) {
      router.replace('/auth');
    }
  }, [roleParam, router]);

  if (!roleParam) {
    return null; // Don't render anything while redirecting
  }

  const roleInfo = roles.find(r => r.value === roleParam);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => router.replace('/auth')}
          className="mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="mb-8">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getRoleColor(roleParam)} text-white flex items-center justify-center mb-4`}>
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Sign In as {roleInfo?.label}</h1>
            <p className="text-gray-600 mt-2">Enter your credentials to continue</p>
          </div>

          {/* Login Form */}
          <LoginForm role={roleParam} />

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href={`/register?role=${roleParam}`} className="text-blue-600 font-semibold hover:text-blue-700">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
