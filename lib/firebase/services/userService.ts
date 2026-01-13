import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { UserProfile, UserRole } from '@/lib/types/user';

export const userService = {
  /**
   * Create a new user profile
   */
  async create(user: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, {
      ...user,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Get user profile by UID
   */
  async get(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as UserProfile;
    }
    return null;
  },

  /**
   * Get user profile by email
   */
  async getByEmail(email: string): Promise<UserProfile | null> {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as UserProfile;
    }
    return null;
  },

  /**
   * Get users by role
   */
  async getByRole(role: UserRole): Promise<UserProfile[]> {
    const q = query(collection(db, 'users'), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as UserProfile;
    });
  },

  /**
   * Update user profile
   */
  async update(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Verify user
   */
  async verify(uid: string): Promise<void> {
    await this.update(uid, { verified: true });
  },

  /**
   * Update user role
   */
  async updateRole(uid: string, role: UserRole): Promise<void> {
    await this.update(uid, { role });
  },

  /**
   * Link wallet address to user
   */
  async linkWallet(uid: string, walletAddress: string): Promise<void> {
    await this.update(uid, { walletAddress });
  },
};
