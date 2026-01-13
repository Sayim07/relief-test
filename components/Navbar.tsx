'use client';

import Link from 'next/link';
import WalletConnect from './WalletConnect';
import { Shield, Users, FileText, Home } from 'lucide-react';

export default function Navbar() {
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
              <Link
                href="/admin"
                className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                Admin
              </Link>
              <Link
                href="/beneficiary"
                className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Beneficiary
              </Link>
              <Link
                href="/audit"
                className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Audit Trail
              </Link>
            </div>
          </div>
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}
