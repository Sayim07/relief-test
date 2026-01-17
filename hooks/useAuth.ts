'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService } from '@/lib/firebase/auth';
import { userService } from '@/lib/firebase/services/userService';
import { UserProfile, UserRole } from '@/lib/types/user';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const profile = await userService.get(user.uid);
          setState({
            user,
            profile,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('Error loading user profile:', error);
          setState({
            user,
            profile: null,
            loading: false,
            error: 'Failed to load user profile',
          });
        }
      } else {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const register = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    additionalData?: Partial<UserProfile>
  ) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const user = await authService.register(email, password, displayName, role, additionalData);
      const profile = await userService.get(user.uid);
      setState({
        user,
        profile,
        loading: false,
        error: null,
      });
      return { user, profile };
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Registration failed',
      }));
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const user = await authService.login(email, password);
      const profile = await userService.get(user.uid);
      setState({
        user,
        profile,
        loading: false,
        error: null,
      });
      return { user, profile };
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Login failed',
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      await authService.logout();
      setState({
        user: null,
        profile: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Logout failed',
      }));
      throw error;
    }
  };

  const signInWithGoogle = async (role: UserRole, additionalData?: Partial<UserProfile>) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const user = await authService.signInWithGoogle(role, additionalData);
      const profile = await userService.get(user.uid);
      setState({
        user,
        profile,
        loading: false,
        error: null,
      });
      return { user, profile };
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Google sign-in failed',
      }));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return state.profile?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return state.profile ? roles.includes(state.profile.role) : false;
  };

  const refreshProfile = async () => {
    if (state.user) {
      const profile = await userService.get(state.user.uid);
      setState(prev => ({ ...prev, profile }));
    }
  };

  return {
    ...state,
    register,
    login,
    signInWithGoogle,
    logout,
    resetPassword,
    hasRole,
    hasAnyRole,
    refreshProfile,
  };
};
