'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import WalletConnect from './WalletConnect';
import { Shield, Users, FileText, Home, LogOut, User, Heart, HandHeart } from 'lucide-react';

export default function Navbar() {
  const { user, profile, logout, hasRole } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
              <Shield className="w-6 h-6" />
              ReliefChain
            </Link>
            <div className="hidden md:flex items-center gap-4">
              {!user && (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
              
              {user && profile && (
                <>
                  {hasRole('admin') && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  
                  {hasRole('donor') && (
                    <Link
                      href="/donor"
                      className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      Donor
                    </Link>
                  )}
                  
                  {hasRole('beneficiary') && (
                    <Link
                      href="/beneficiary"
                      className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Beneficiary
                    </Link>
                  )}
                  
                  {hasRole('relief_partner') && (
                    <Link
                      href="/relief-partner"
                      className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <HandHeart className="w-4 h-4" />
                      Relief Partner
                    </Link>
                  )}
                  
                  <Link
                    href="/audit"
                    className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Audit Trail
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user && profile && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{profile.displayName || profile.email}</span>
                  <span className="text-xs text-gray-500 capitalize">({profile.role.replace('_', ' ')})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
            {user && <WalletConnect />}
          </div>
        </div>
      </div>
    </nav>
  );
}
