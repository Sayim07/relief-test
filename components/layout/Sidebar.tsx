'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Users,
  Send,
  FileQuestion,
  Settings,
  X,
  Shield,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Wallet', href: '/wallet', icon: Wallet },
  { label: 'Transactions', href: '/transactions', icon: Receipt },
  { label: 'Beneficiaries', href: '/admin/beneficiaries', icon: Users, roles: ['admin'] },
  { label: 'Distributions', href: '/admin/distributions', icon: Send, roles: ['admin'] },
  { label: 'Requests', href: '/beneficiary/requests', icon: FileQuestion, roles: ['beneficiary'] },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();

  // Filter items based on user role
  const filteredItems = sidebarItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(profile?.role || '');
  });

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/admin' || pathname === '/donor' || pathname === '/beneficiary' || pathname === '/relief-partner';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile/Hamburger overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50
          transition-all duration-300 ease-in-out transform
          ${isOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
              <Shield className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">ReliefChain</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${active
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile summary in sidebar if needed */}
          {profile && (
            <div className="p-4 border-t border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {profile.displayName?.[0] || profile.email?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile.displayName || profile.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate capitalize">
                    {profile.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
