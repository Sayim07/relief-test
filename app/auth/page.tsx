'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Users, Wallet, Heart, HandHeart, ArrowRight, BarChart3 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();

  const roles = [
    {
      value: 'admin',
      label: 'Admin',
      description: 'Manage beneficiaries, distribute relief funds, and monitor all transactions',
      icon: Shield,
      color: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-50',
      border: 'border-blue-200 hover:border-blue-500',
    },
    {
      value: 'beneficiary',
      label: 'Beneficiary',
      description: 'View your balance, spending limits, and make category-based transfers',
      icon: Users,
      color: 'from-green-500 to-green-600',
      lightBg: 'bg-green-50',
      border: 'border-green-200 hover:border-green-500',
    },
    {
      value: 'donor',
      label: 'Donor',
      description: 'Make donations to support relief efforts and track your contributions',
      icon: Heart,
      color: 'from-purple-500 to-purple-600',
      lightBg: 'bg-purple-50',
      border: 'border-purple-200 hover:border-purple-500',
    },
    {
      value: 'relief_partner',
      label: 'Relief Partner',
      description: 'Execute relief operations and manage assigned funds',
      icon: HandHeart,
      color: 'from-orange-500 to-orange-600',
      lightBg: 'bg-orange-50',
      border: 'border-orange-200 hover:border-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/30 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">ReliefChain</span>
          </Link>
          <Link
            href="/"
            className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            ← Back
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Select Your Role
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose how you'd like to participate in ReliefChain's disaster relief network
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.value}
                  onClick={() => router.replace(`/login?role=${role.value}`)}
                  className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${role.border} ${role.lightBg}`}
                >
                  {/* Gradient background */}
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-r ${role.color}`}
                  ></div>

                  {/* Content */}
                  <div className="relative p-8 flex flex-col h-full">
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{role.label}</h3>

                    {/* Description */}
                    <p className="text-gray-600 mb-8 flex-grow leading-relaxed">{role.description}</p>

                    {/* Button */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Continue</span>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-3xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">🔒</div>
                <h4 className="font-semibold text-gray-900 mb-2">Secure & Transparent</h4>
                <p className="text-sm text-gray-600">Blockchain-verified every step of the way</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">⚡</div>
                <h4 className="font-semibold text-gray-900 mb-2">Fast & Instant</h4>
                <p className="text-sm text-gray-600">Real-time transactions and settlements</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">🌍</div>
                <h4 className="font-semibold text-gray-900 mb-2">Global Reach</h4>
                <p className="text-sm text-gray-600">Connect with relief partners worldwide</p>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700">
                Create one here
              </Link>
            </p>
            
            {/* Public Audit Trail Button */}
            <Link
              href="/audit"
              className="inline-block group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg opacity-0 group-hover:opacity-75 transition-all duration-300 -z-10"></div>
              <div className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-3">
                <BarChart3 className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Public Audit Trail</div>
                  <div className="text-xs text-blue-100">View all blockchain-verified relief transactions</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
