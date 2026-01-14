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
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../config';
import { ReliefFund, FundStatus } from '@/lib/types/database';

export const reliefFundService = {
  /**
   * Create a new relief fund
   */
  async create(fund: Omit<ReliefFund, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'reliefFunds'), {
      ...fund,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  /**
   * Get relief fund by ID
   */
  async get(id: string): Promise<ReliefFund | null> {
    const docRef = doc(db, 'reliefFunds', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as ReliefFund;
    }
    return null;
  },

  /**
   * Get all relief funds
   */
  async getAll(): Promise<ReliefFund[]> {
    const q = query(collection(db, 'reliefFunds'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as ReliefFund;
    });
  },

  /**
   * Get relief funds by status
   */
  async getByStatus(status: FundStatus): Promise<ReliefFund[]> {
    try {
      const q = query(
        collection(db, 'reliefFunds'),
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
        } as ReliefFund;
      });
    } catch (error: any) {
      // Fallback if index is missing
      if (error?.code === 'failed-precondition') {
        console.warn('Firestore index missing for reliefFunds status + createdAt, falling back to memory sort');
        const q = query(
          collection(db, 'reliefFunds'),
          where('status', '==', status)
        );
        const querySnapshot = await getDocs(q);
        const funds = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          } as ReliefFund;
        });

        // Sort in memory
        return funds.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      throw error;
    }
  },

  /**
   * Get active relief funds
   */
  async getActive(): Promise<ReliefFund[]> {
    return this.getByStatus('active');
  },

  /**
   * Update relief fund
   */
  async update(id: string, updates: Partial<ReliefFund>): Promise<void> {
    const docRef = doc(db, 'reliefFunds', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Update distributed amount
   */
  async updateDistributedAmount(id: string, amount: number): Promise<void> {
    const fund = await this.get(id);
    if (!fund) throw new Error('Relief fund not found');

    const newDistributedAmount = fund.distributedAmount + amount;
    const newRemainingAmount = fund.totalAmount - newDistributedAmount;

    await this.update(id, {
      distributedAmount: newDistributedAmount,
      remainingAmount: newRemainingAmount,
    });
  },

  /**
   * Close relief fund
   */
  async close(id: string): Promise<void> {
    await this.update(id, { status: 'closed' });
  },
};
