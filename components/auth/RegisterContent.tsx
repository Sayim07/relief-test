'use client';

import { useSearchParams } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';
import { UserRole } from '@/lib/types/user';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterContent() {
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

  const selectedRole = roleParam && roles.find(r => r.value === roleParam) ? roleParam : null;

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-[#060010] flex items-center justify-center p-4">
        {/* Animated background elements replaced with dark theme compatible ones if needed, or kept subtle */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-900/20 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-900/20 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 w-full max-w-2xl">
          {/* Back Button */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          {/* Card */}
          <div className="bg-[#0a0a1a]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#392e4e] p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Shield className="w-12 h-12 text-blue-500" />
              </div>
              <h1 className="text-3xl font-bold text-white">Create Account</h1>
              <p className="text-gray-400 mt-2">Select your role to get started</p>
            </div>

            {/* Role Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {roles.map((role) => (
                <Link
                  key={role.value}
                  href={`/register?role=${role.value}`}
                  className="p-5 border border-[#392e4e] bg-[#1a1a2e] rounded-xl hover:border-blue-500 hover:bg-blue-900/20 transition-all text-left group"
                >
                  <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">{role.label}</h3>
                  <p className="text-sm text-gray-400 mt-1">{role.description}</p>
                </Link>
              ))}
            </div>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-500 font-semibold hover:text-blue-400">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const roleInfo = roles.find(r => r.value === selectedRole);

  return (
    <div className="min-h-screen bg-[#060010] flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-900/20 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-900/20 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/register"
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Card */}
        <div className="bg-[#0a0a1a]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#392e4e] p-8">
          {/* Header */}
          <div className="mb-8">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getRoleColor(selectedRole)} text-white flex items-center justify-center mb-4`}>
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Register as {roleInfo?.label}
            </h1>
            <p className="text-gray-400 mt-2">Create your account to get started</p>
          </div>

          {/* Register Form */}
          <RegisterForm role={selectedRole} />

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href={`/login?role=${selectedRole}`} className="text-blue-500 font-semibold hover:text-blue-400">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
