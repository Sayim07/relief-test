'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { LogOut, User, Menu } from 'lucide-react';
import { getCurrentChainId } from '@/lib/web3/network';

function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isSepoliaNetwork(chainId: number): boolean {
  return chainId === 11155111; // Sepolia chain ID
}

interface TopNavbarProps {
  onMenuClick?: () => void;
}

export default function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const { profile, logout } = useAuth();
  const { address, isConnected } = useWallet();
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    const checkNetwork = async () => {
      if (isConnected && address) {
        try {
          const id = await getCurrentChainId();
          setChainId(id);
        } catch (error) {
          console.error('Error getting chain ID:', error);
        }
      }
    };
    checkNetwork();
  }, [isConnected, address]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-900/30 text-purple-400 border-purple-500/30';
      case 'beneficiary':
        return 'bg-green-900/30 text-green-400 border-green-500/30';
      case 'donor':
        return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
      case 'relief_partner':
        return 'bg-orange-900/30 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-800/50 text-gray-400 border-gray-700/50';
    }
  };

  const formatRole = (role?: string) => {
    if (!role) return 'User';
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const isSepolia = chainId !== null ? isSepoliaNetwork(chainId) : false;

  return (
    <nav className="sticky top-0 z-30 bg-[#060010]/80 border-b border-[#392e4e] backdrop-blur-md">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Hamburger menu */}
          <div className="flex-1 flex items-center">
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Right side - User info */}
          <div className="flex items-center gap-4">
            {/* Network Badge */}
            {isConnected && (
              <div className={`
                px-3 py-1.5 rounded-lg text-xs font-medium border
                ${isSepolia
                  ? 'bg-green-900/30 text-green-400 border-green-500/30'
                  : 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30'
                }
              `}>
                {isSepolia ? 'Sepolia' : `Chain ${chainId || '?'}`}
              </div>
            )}

            {/* Wallet Address */}
            {isConnected && address && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a1a] rounded-lg border border-[#392e4e]">
                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                <span className="text-sm font-mono text-gray-300">
                  {formatAddress(address)}
                </span>
              </div>
            )}

            {/* Role Badge */}
            {profile && (
              <div className={`
                px-3 py-1.5 rounded-lg text-xs font-medium border
                ${getRoleBadgeColor(profile.role)}
              `}>
                {formatRole(profile.role)}
              </div>
            )}

            {/* User Info */}
            {profile && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a1a] rounded-lg border border-[#392e4e]/50">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">
                  {profile.displayName || profile.email?.split('@')[0]}
                </span>
              </div>
            )}

            {/* Logout Button */}
            {profile && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-900/30"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
