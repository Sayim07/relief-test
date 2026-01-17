'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { UserRole } from '@/lib/types/user';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PixelCard from '@/components/PixelCard';





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
    <div className="min-h-screen bg-[#060010] flex items-center justify-center p-4">
      {/* Animated background elements */}


      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => router.replace('/auth')}
          className="mb-8 flex items-center gap-2 text-white/60 hover:text-white transition-all font-medium hover:gap-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Card */}
        <PixelCard
          variant="blue"
          className="w-full h-auto min-h-[500px] bg-[#0a0a1a]/50 backdrop-blur-xl rounded-2xl border border-[#392e4e] p-8 shadow-2xl overflow-visible"
          gap={8}
          speed={40}
        >
          {/* Header */}
          <div className="mb-8 relative z-20">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getRoleColor(roleParam)} text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20`}>
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Sign In as {roleInfo?.label}</h1>
            <p className="text-white/50 mt-2 font-medium">Enter your credentials to continue</p>
          </div>

          {/* Login Form */}
          <div className="relative z-20">
            <LoginForm role={roleParam} />
          </div>

          {/* Register Link */}
          <p className="mt-8 text-center text-sm text-white/40 relative z-20">
            Don't have an account?{' '}
            <Link href={`/register?role=${roleParam}`} className="text-blue-500 font-bold hover:text-blue-400 transition-colors">
              Register here
            </Link>
          </p>
        </PixelCard>
      </div>
    </div>
  );
}
