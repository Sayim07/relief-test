import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './config';
import { UserProfile, UserRole } from '@/lib/types/user';
import { userService } from './services/userService';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  /**
   * Register a new user with email and password
   */
  async register(
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    additionalData?: Partial<UserProfile>
  ): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Create user profile in Firestore
      const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
        uid: user.uid,
        email,
        displayName,
        role,
        verified: false,
        ...additionalData,
      };

      await userService.create(userProfile);

      return user;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Failed to register user');
    }
  },

  /**
   * Sign in with email and password
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  },

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  },

  /**
   * Sign in with Google
   */
  async signInWithGoogle(role: UserRole, additionalData?: Partial<UserProfile>): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user profile exists
      let profile = await userService.get(user.uid);
      
      if (!profile) {
        // Create user profile if it doesn't exist
        const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || undefined,
          role,
          verified: false,
          ...additionalData,
        };

        await userService.create(userProfile);
      }

      return user;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  },

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};
