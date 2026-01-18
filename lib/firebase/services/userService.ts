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
  limit,
} from 'firebase/firestore';
import { db } from '../config';
import { UserProfile, UserRole } from '@/lib/types/user';

// Map roles to collection names
const roleToCollection: Record<UserRole, string> = {
  admin: 'admins',
  donor: 'donors',
  beneficiary: 'beneficiaries',
  relief_partner: 'relief_partners',
};

export const userService = {
  /**
   * Create a new user profile in role-specific collection
   */
  async create(user: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    const collectionName = roleToCollection[user.role];
    const docRef = doc(db, collectionName, user.uid);

    try {
      await setDoc(docRef, {
        ...user,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      // Special handling for admin creation
      if (user.role === 'admin' && error.code === 'permission-denied') {
        console.warn('Admin creation permission denied. This is expected for the first admin registration.');
        console.warn('Please update your Firestore security rules to allow admin creation, or use the Firebase console to create the first admin manually.');

        throw new Error(
          'Admin registration is restricted by Firestore security rules. ' +
          'This is expected security behavior. Please:\n' +
          '1. Update your Firestore rules to temporarily allow admin creation, or\n' +
          '2. Create the first admin account manually in the Firebase console'
        );
      }

      console.error('User creation error:', error);
      throw new Error(error.message || 'Failed to create user profile');
    }
  },

  /**
   * Check if any admins exist
   */
  async hasAdmins(): Promise<boolean> {
    try {
      const adminsQuery = query(collection(db, 'admins'), limit(1));
      const snapshot = await getDocs(adminsQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking for admins:', error);
      return true; // Assume admins exist to be safe
    }
  },

  /**
   * Get user profile by UID - searches all role-based collections
   */
  async get(uid: string): Promise<UserProfile | null> {
    // Try each collection
    for (const collectionName of Object.values(roleToCollection)) {
      const docRef = doc(db, collectionName, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          verificationTimestamp: data.verificationTimestamp?.toDate(),
        } as UserProfile;
      }
    }
    return null;
  },

  /**
   * Get user profile by email - searches all role-based collections
   */
  async getByEmail(email: string): Promise<UserProfile | null> {
    // Search through all collections
    for (const collectionName of Object.values(roleToCollection)) {
      const q = query(collection(db, collectionName), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          verificationTimestamp: data.verificationTimestamp?.toDate(),
        } as UserProfile;
      }
    }
    return null;
  },

  /**
   * Get users by role from role-specific collection
   */
  async getByRole(role: UserRole): Promise<UserProfile[]> {
    const collectionName = roleToCollection[role];
    const q = query(collection(db, collectionName));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        verificationTimestamp: data.verificationTimestamp?.toDate(),
      } as UserProfile;
    });
  },

  /**
   * Get verified relief partners by category
   */
  async getVerifiedPartnersByCategory(category: string): Promise<UserProfile[]> {
    if (!category) return [];

    const collectionsToSearch = [roleToCollection.relief_partner, 'users'];
    const results = new Map<string, UserProfile>();

    const queries: any[] = [];

    collectionsToSearch.forEach(collName => {
      // 1. New plural field (array-contains)
      queries.push(query(
        collection(db, collName),
        where('verified', '==', true),
        where('reliefCategories', 'array-contains', category)
      ));

      // 2. Legacy singular field
      queries.push(query(
        collection(db, collName),
        where('verified', '==', true),
        where('reliefCategory', '==', category)
      ));

      // 3. Fallback for string "true" if someone verified manually as string
      queries.push(query(
        collection(db, collName),
        where('verified', '==', 'true'),
        where('reliefCategories', 'array-contains', category)
      ));

      queries.push(query(
        collection(db, collName),
        where('verified', '==', 'true'),
        where('reliefCategory', '==', category)
      ));
    });

    try {
      console.log(`[UserService] Searching for verified partners in category: ${category}`);
      const queryResults = await Promise.allSettled(queries.map(q => getDocs(q)));

      queryResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`[UserService] Query ${index} failed:`, result.reason);
          return;
        }

        const snapshot = result.value;
        if (!snapshot.empty) {
          console.log(`[UserService] Query ${index} found ${snapshot.size} potential matches`);
        }

        snapshot.docs.forEach(doc => {
          const data = doc.data() as any;
          // Skip if it doesn't have the relief_partner role (important when searching 'users' collection)
          if (data.role && data.role !== 'relief_partner') {
            console.log(`[UserService] Skipping user ${doc.id} with role ${data.role}`);
            return;
          }

          const profile = {
            ...data,
            uid: doc.id,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
            verificationTimestamp: data.verificationTimestamp?.toDate ? data.verificationTimestamp.toDate() :
              (data.verificationTimestamp ? new Date(data.verificationTimestamp) : undefined),
          } as UserProfile;
          results.set(profile.uid, profile);
        });
      });
      console.log(`[UserService] Total unique verified partners found: ${results.size}`);
    } catch (error) {
      console.error('Error in robust partner query:', error);
    }

    return Array.from(results.values());
  },

  /**
   * Update user profile in role-specific collection
   */
  async update(uid: string, updates: Partial<UserProfile>): Promise<void> {
    // First, find which collection the user is in
    const user = await this.get(uid);
    if (!user) {
      throw new Error('User not found');
    }

    const collectionName = roleToCollection[user.role];
    const docRef = doc(db, collectionName, uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Verify user
   */
  async verify(uid: string, partnerKey?: string): Promise<void> {
    await this.update(uid, {
      verified: true,
      verificationTimestamp: new Date(),
      reliefPartnerKey: partnerKey
    });
  },

  /**
   * Update user role - moves user to new collection
   */
  async updateRole(uid: string, newRole: UserRole): Promise<void> {
    const user = await this.get(uid);
    if (!user) {
      throw new Error('User not found');
    }

    const oldCollectionName = roleToCollection[user.role];
    const newCollectionName = roleToCollection[newRole];

    // If role is changing, move user to new collection
    if (oldCollectionName !== newCollectionName) {
      // Create in new collection
      const newDocRef = doc(db, newCollectionName, uid);
      await setDoc(newDocRef, {
        ...user,
        role: newRole,
        updatedAt: Timestamp.now(),
      });

      // Delete from old collection
      const oldDocRef = doc(db, oldCollectionName, uid);
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(oldDocRef);
    } else {
      // Same collection, just update role
      await this.update(uid, { role: newRole });
    }
  },

  /**
   * Link wallet address to user
   */
  async linkWallet(uid: string, walletAddress: string): Promise<void> {
    await this.update(uid, { walletAddress });
  },
};
