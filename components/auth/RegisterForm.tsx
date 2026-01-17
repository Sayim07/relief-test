'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types/user';
import { categoryService } from '@/lib/firebase/services';
import { Mail, Lock, User, Phone, MapPin, Building, AlertCircle, Loader2, Tag, Wallet } from 'lucide-react';

interface RegisterFormProps {
  role: UserRole;
  redirectTo?: string;
}

export default function RegisterForm({ role, redirectTo }: RegisterFormProps) {
  const { register, signInWithGoogle, loading, error } = useAuth();
  const { address, isConnected } = useWallet();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: '',
    organization: '',
    location: '',
    walletAddress: '',
    category: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  // Load categories for relief partners
  useEffect(() => {
    if (role === 'relief_partner') {
      loadCategories();
    }
  }, [role]);

  // Auto-populate wallet address when wallet is connected
  useEffect(() => {
    if ((role === 'relief_partner' || role === 'beneficiary') && isConnected && address) {
      setFormData((prev) => ({
        ...prev,
        walletAddress: address,
      }));
    }
  }, [isConnected, address, role]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const cats = await categoryService.getAll();
      
      // If no categories from Firebase, use default categories
      if (!cats || cats.length === 0) {
        const defaultCategories = [
          { id: 'food', name: 'Food', description: 'Food and nutrition expenses' },
          { id: 'shelter', name: 'Shelter', description: 'Housing and shelter expenses' },
          { id: 'medical', name: 'Medical', description: 'Medical and healthcare expenses' },
          { id: 'clothing', name: 'Clothing', description: 'Clothing and personal items' },
          { id: 'utilities', name: 'Utilities', description: 'Water, electricity, and utilities' },
        ];
        setCategories(defaultCategories);
      } else {
        setCategories(cats);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      // Fallback to default categories on error
      const defaultCategories = [
        { id: 'food', name: 'Food', description: 'Food and nutrition expenses' },
        { id: 'shelter', name: 'Shelter', description: 'Housing and shelter expenses' },
        { id: 'medical', name: 'Medical', description: 'Medical and healthcare expenses' },
        { id: 'clothing', name: 'Clothing', description: 'Clothing and personal items' },
        { id: 'utilities', name: 'Utilities', description: 'Water, electricity, and utilities' },
      ];
      setCategories(defaultCategories);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    // Validate relief partner category
    if (role === 'relief_partner' && !formData.category) {
      setLocalError('Please select a category for relief operations');
      return;
    }

    // Validate relief partner wallet
    if (role === 'relief_partner' && !formData.walletAddress) {
      setLocalError('Wallet address is required for relief partners');
      return;
    }

    try {
      const additionalData: any = {};

      if (formData.phoneNumber) additionalData.phoneNumber = formData.phoneNumber;
      if (formData.organization) additionalData.organization = formData.organization;
      if (formData.location) additionalData.location = formData.location;
      if (formData.walletAddress) additionalData.walletAddress = formData.walletAddress;
      if (role === 'relief_partner' && formData.category) {
        additionalData.reliefCategory = formData.category;
      }

      const { profile } = await register(
        formData.email,
        formData.password,
        formData.displayName,
        role,
        additionalData
      );

      // Redirect based on role or custom redirect
      if (redirectTo) {
        router.push(redirectTo);
      } else if (profile) {
        switch (profile.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'beneficiary':
            router.push('/beneficiary');
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
      }
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLocalError(null);

      // Validate relief partner category and wallet
      if (role === 'relief_partner' && !formData.category) {
        setLocalError('Please select a category for relief operations');
        return;
      }

      if (role === 'relief_partner' && !formData.walletAddress) {
        setLocalError('Wallet address is required for relief partners');
        return;
      }

      const additionalData: any = {};

      if (formData.phoneNumber) additionalData.phoneNumber = formData.phoneNumber;
      if (formData.organization) additionalData.organization = formData.organization;
      if (formData.location) additionalData.location = formData.location;
      if (formData.walletAddress) additionalData.walletAddress = formData.walletAddress;
      if (role === 'relief_partner' && formData.category) {
        additionalData.reliefCategory = formData.category;
      }

      const { profile } = await signInWithGoogle(role, additionalData);

      if (redirectTo) {
        router.push(redirectTo);
      } else if (profile) {
        switch (profile.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'beneficiary':
            router.push('/beneficiary');
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
      }
    } catch (err: any) {
      setLocalError(err.message || 'Google sign-in failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-400 mb-1">
          Full Name *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            id="displayName"
            type="text"
            required
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-[#392e4e] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
            placeholder="John Doe"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
          Email *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-[#392e4e] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
          Password *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            id="password"
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-[#392e4e] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">
          Confirm Password *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            id="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-[#392e4e] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-400 mb-1">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-[#392e4e] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
            placeholder="+1234567890"
          />
        </div>
      </div>

      {(role === 'relief_partner' || role === 'beneficiary') && (
        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-gray-400 mb-1">
            Organization
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              id="organization"
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-[#392e4e] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
              placeholder="Organization name"
            />
          </div>
        </div>
      )}

      {role === 'relief_partner' && (
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-1">
            Relief Category * <span className="text-xs text-gray-500">(Funds you will distribute)</span>
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={categoriesLoading}
              className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-[#392e4e] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 disabled:opacity-50"
            >
              <option value="">
                {categoriesLoading ? 'Loading categories...' : 'Select your relief category'}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} - {cat.description}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            You will specialize in distributing funds for this category
          </p>
        </div>
      )}

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-400 mb-1">
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            id="location"
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-[#392e4e] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
            placeholder="City, Country"
          />
        </div>
      </div>

      {(role === 'beneficiary' || role === 'relief_partner') && (
        <div>
          <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-400 mb-1">
            Wallet Address {role === 'relief_partner' ? '*' : '(Optional)'}
            {isConnected && (
              <span className="ml-2 text-xs text-green-400">✓ Connected</span>
            )}
          </label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              id="walletAddress"
              type="text"
              required={role === 'relief_partner'}
              value={formData.walletAddress}
              onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
              readOnly={isConnected}
              className={`w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-[#392e4e] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-white placeholder-gray-500 ${
                isConnected ? 'cursor-not-allowed opacity-75' : ''
              }`}
              placeholder="0x..."
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isConnected ? (
              <>💰 Your MetaMask wallet is connected. You can proceed with registration.</>
            ) : (
              <>
                {role === 'relief_partner'
                  ? 'Connect your MetaMask wallet or enter manually. Beneficiaries will send funds to this address.'
                  : 'Connect your MetaMask wallet or enter manually (optional).'}
              </>
            )}
          </p>
        </div>
      )}

      {(error || localError) && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-900/10 p-3 rounded-lg border border-red-900/30">
          <AlertCircle className="w-4 h-4" />
          <span>{localError || error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account with Email'
        )}
      </button>

      {role !== 'relief_partner' && (
        <>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#392e4e]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0a0a1a] text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2 px-4 bg-[#1a1a2e] border-2 border-[#392e4e] text-white rounded-lg hover:bg-[#0a0a1a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </button>
        </>
      )}
    </form>
  );
}
