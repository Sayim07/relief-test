'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/types/user';
import { Loader2 } from 'lucide-react';

interface WithAuthProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredRole?: UserRole;
    requiredRoles?: UserRole[];
    redirectTo?: string;
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user || !profile) {
          router.push(options.redirectTo || '/login');
          return;
        }

        if (options.requiredRole && profile.role !== options.requiredRole) {
          router.push(options.redirectTo || '/');
          return;
        }

        if (options.requiredRoles && !options.requiredRoles.includes(profile.role)) {
          router.push(options.redirectTo || '/');
          return;
        }
      }
    }, [user, profile, loading, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user || !profile) {
      return null;
    }

    if (options.requiredRole && profile.role !== options.requiredRole) {
      return null;
    }

    if (options.requiredRoles && !options.requiredRoles.includes(profile.role)) {
      return null;
    }

    return <Component {...props} />;
  };
}

export function AuthGuard({ children, requiredRole, requiredRoles, redirectTo }: WithAuthProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        router.push(redirectTo || '/login');
        return;
      }

      if (requiredRole && profile.role !== requiredRole) {
        router.push(redirectTo || '/');
        return;
      }

      if (requiredRoles && !requiredRoles.includes(profile.role)) {
        router.push(redirectTo || '/');
        return;
      }
    }
  }, [user, profile, loading, router, requiredRole, requiredRoles, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  if (requiredRole && profile.role !== requiredRole) {
    return null;
  }

  if (requiredRoles && !requiredRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}
