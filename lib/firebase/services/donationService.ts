import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../config';
import { Donation, DonationStatus } from '@/lib/types/database';

export const donationService = {
  /**
   * Create a new donation
   */
  async create(donation: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'donations'), {
      ...donation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  /**
   * Get donation by ID
   */
  async get(id: string): Promise<Donation | null> {
    const docRef = doc(db, 'donations', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        verifiedAt: data.verifiedAt?.toDate(),
        distributedAt: data.distributedAt?.toDate(),
      } as Donation;
    }
    return null;
  },

  /**
   * Get donations by donor ID
   */
  async getByDonor(donorId: string): Promise<Donation[]> {
    try {
      // Try with orderBy first (requires index)
      const q = query(
        collection(db, 'donations'),
        where('donorId', '==', donorId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          verifiedAt: data.verifiedAt?.toDate(),
          distributedAt: data.distributedAt?.toDate(),
        } as Donation;
      });
    } catch (error: any) {
      // If index error, fallback to query without orderBy
      if (error?.code === 'failed-precondition') {
        console.warn('Index not found, using fallback query without orderBy');
        const q = query(
          collection(db, 'donations'),
          where('donorId', '==', donorId)
        );
        const querySnapshot = await getDocs(q);
        
        const donations = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            verifiedAt: data.verifiedAt?.toDate(),
            distributedAt: data.distributedAt?.toDate(),
          } as Donation;
        });
        
        // Sort manually
        return donations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      throw error;
    }
  },

  /**
   * Get donations by status
   */
  async getByStatus(status: DonationStatus): Promise<Donation[]> {
    const q = query(
      collection(db, 'donations'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        verifiedAt: data.verifiedAt?.toDate(),
        distributedAt: data.distributedAt?.toDate(),
      } as Donation;
    });
  },

  /**
   * Get pending donations (for admin verification)
   */
  async getPending(limitCount: number = 50): Promise<Donation[]> {
    const q = query(
      collection(db, 'donations'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        verifiedAt: data.verifiedAt?.toDate(),
        distributedAt: data.distributedAt?.toDate(),
      } as Donation;
    });
  },

  /**
   * Update donation
   */
  async update(id: string, updates: Partial<Donation>): Promise<void> {
    const docRef = doc(db, 'donations', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Verify donation (admin action)
   */
  async verify(id: string, verifiedBy: string): Promise<void> {
    await this.update(id, {
      status: 'verified',
      verifiedBy,
      verifiedAt: new Date(),
    });
  },

  /**
   * Reject donation (admin action)
   */
  async reject(id: string, verifiedBy: string, reason: string): Promise<void> {
    await this.update(id, {
      status: 'rejected',
      verifiedBy,
      rejectedReason: reason,
    });
  },

  /**
   * Mark donation as distributed
   */
  async markDistributed(id: string): Promise<void> {
    await this.update(id, {
      status: 'distributed',
      distributedAt: new Date(),
    });
  },
};
