import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../config';
import { UserProfile, UserRole } from '@/lib/types/user';

// Map roles to collection names
const roleToCollection: Record<UserRole, string> = {
  admin: 'admins',
  donor: 'donors',
  relief_partner: 'relief_partners',
};

export const userAccessService = {
  /**
   * Get users visible to the current user based on their role
   * Admin: sees all users
   * Donor: sees no other users
   * Relief Partner: sees no other users
   */
  async getVisibleUsers(currentUserRole: UserRole): Promise<UserProfile[]> {
    if (currentUserRole === 'admin') {
      // Admin sees all users from all collections
      const allUsers: UserProfile[] = [];

      for (const collectionName of Object.values(roleToCollection)) {
        const q = query(collection(db, collectionName));
        const querySnapshot = await getDocs(q);

        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          allUsers.push({
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          } as UserProfile);
        });
      }

      return allUsers;
    }

    // Donor and Relief Partner see no other users
    return [];
  },

  /**
   * Get users of specific role visible to current user
   */
  async getVisibleUsersByRole(
    currentUserRole: UserRole,
    targetRole: UserRole
  ): Promise<UserProfile[]> {
    // Check if current user has permission to see this role
    if (currentUserRole === 'admin') {
      // Admin can see any role
      const q = query(collection(db, roleToCollection[targetRole]));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as UserProfile;
      });
    }

    // No permission to see this role
    return [];
  },

  /**
   * Check if current user can view a specific user
   */
  async canViewUser(currentUserRole: UserRole, targetUserRole: UserRole, targetUserId: string): Promise<boolean> {
    if (currentUserRole === 'admin') {
      // Admin can view any user
      return true;
    }

    // No permission
    return false;
  },

  /**
   * Get count of users by role
   */
  async getUserCountByRole(role: UserRole): Promise<number> {
    const q = query(collection(db, roleToCollection[role]));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  },

  /**
   * Get all users with their role (admin only)
   */
  async getAllUsersWithRole(): Promise<Array<UserProfile & { collection: string }>> {
    const allUsers: Array<UserProfile & { collection: string }> = [];

    for (const [role, collectionName] of Object.entries(roleToCollection)) {
      const q = query(collection(db, collectionName));
      const querySnapshot = await getDocs(q);

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        allUsers.push({
          ...data,
          collection: collectionName,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as UserProfile & { collection: string });
      });
    }

    return allUsers;
  },
};
