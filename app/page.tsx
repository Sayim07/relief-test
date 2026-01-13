import Link from 'next/link';
import { Shield, Users, Wallet, FileText, ArrowRight, Heart, HandHeart } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Shield className="w-20 h-20 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Emergency & Disaster Relief
          </h1>
          <h2 className="text-3xl font-semibold text-blue-600 mb-6">
            Stablecoin Distribution System
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            A transparent, blockchain-based platform for rapid disaster relief fund distribution
            with beneficiary whitelisting, category-based spending limits, and public audit trails.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Users className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Beneficiary Management</h3>
            <p className="text-gray-600">
              Whitelist verified beneficiaries and manage category-based spending limits
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Wallet className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure Transfers</h3>
            <p className="text-gray-600">
              Direct stablecoin transfers with spending controls and real-time tracking
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <FileText className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Public Audit Trail</h3>
            <p className="text-gray-600">
              Transparent transaction history visible to all stakeholders
            </p>
          </div>
        </div>

        {/* Role Selection */}
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Select Your Role</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/login"
              className="group p-6 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Admin</h3>
              <p className="text-gray-600">
                Manage beneficiaries, distribute relief funds, and monitor transactions
              </p>
            </Link>

            <Link
              href="/login"
              className="group p-6 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <Wallet className="w-8 h-8 text-green-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Beneficiary</h3>
              <p className="text-gray-600">
                View your balance, spending limits, and make category-based transfers
              </p>
            </Link>

            <Link
              href="/login"
              className="group p-6 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Donor</h3>
              <p className="text-gray-600">
                Make donations to support relief efforts and track your contributions
              </p>
            </Link>

            <Link
              href="/login"
              className="group p-6 border-2 border-orange-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <HandHeart className="w-8 h-8 text-orange-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Relief Partner</h3>
              <p className="text-gray-600">
                Execute relief operations and manage assigned funds
              </p>
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-gray-600 mb-4">New to ReliefChain?</p>
            <Link
              href="/register"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t">
            <Link
              href="/audit"
              className="group flex items-center justify-between p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Public Audit Trail</h3>
                  <p className="text-sm text-gray-600">View all transactions on the blockchain</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center text-gray-600">
          <p className="mb-2">
            <strong>Note:</strong> Connect your MetaMask wallet to interact with the system
          </p>
          <p className="text-sm">
            This system uses blockchain technology for transparency and accountability in disaster relief
          </p>
        </div>
      </div>
    </div>
  );
}
