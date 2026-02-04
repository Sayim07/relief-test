'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Loader from '@/components/ui/Loader';

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && profile) {
      // Redirect based on role
      switch (profile.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'donor':
          router.push('/donor');
          break;
        case 'relief_partner':
          router.push('/relief-partner');
          break;
        default:
          router.push('/');
      }
    } else if (!loading && !profile) {
      router.push('/login');
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Loader />
    </div>
  );
}
