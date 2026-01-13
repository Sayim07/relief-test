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
import { BeneficiaryFund, FundStatus } from '@/lib/types/database';

export const beneficiaryFundService = {
  /**
   * Create a new beneficiary fund
   */
  async create(fund: Omit<BeneficiaryFund, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'beneficiaryFunds'), {
      ...fund,
      assignedAt: Timestamp.fromDate(fund.assignedAt),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  /**
   * Get beneficiary fund by ID
   */
  async get(id: string): Promise<BeneficiaryFund | null> {
    const docRef = doc(db, 'beneficiaryFunds', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        assignedAt: data.assignedAt.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as BeneficiaryFund;
    }
    return null;
  },

  /**
   * Get all beneficiary funds
   */
  async getAll(): Promise<BeneficiaryFund[]> {
    const q = query(
      collection(db, 'beneficiaryFunds'),
      orderBy('assignedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        assignedAt: data.assignedAt.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as BeneficiaryFund;
    });
  },

  /**
   * Get beneficiary funds by beneficiary ID
   */
  async getByBeneficiary(beneficiaryId: string): Promise<BeneficiaryFund[]> {
    const q = query(
      collection(db, 'beneficiaryFunds'),
      where('beneficiaryId', '==', beneficiaryId),
      orderBy('assignedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        assignedAt: data.assignedAt.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as BeneficiaryFund;
    });
  },

  /**
   * Get beneficiary funds by relief fund ID
   */
  async getByReliefFund(reliefFundId: string): Promise<BeneficiaryFund[]> {
    const q = query(
      collection(db, 'beneficiaryFunds'),
      where('reliefFundId', '==', reliefFundId),
      orderBy('assignedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        assignedAt: data.assignedAt.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as BeneficiaryFund;
    });
  },

  /**
   * Get beneficiary funds by status
   */
  async getByStatus(status: FundStatus): Promise<BeneficiaryFund[]> {
    const q = query(
      collection(db, 'beneficiaryFunds'),
      where('status', '==', status),
      orderBy('assignedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        assignedAt: data.assignedAt.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as BeneficiaryFund;
    });
  },

  /**
   * Get active beneficiary funds
   */
  async getActive(beneficiaryId?: string): Promise<BeneficiaryFund[]> {
    if (beneficiaryId) {
      const q = query(
        collection(db, 'beneficiaryFunds'),
        where('beneficiaryId', '==', beneficiaryId),
        where('status', '==', 'active'),
        orderBy('assignedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          assignedAt: data.assignedAt.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as BeneficiaryFund;
      });
    }
    return this.getByStatus('active');
  },

  /**
   * Update beneficiary fund
   */
  async update(id: string, updates: Partial<BeneficiaryFund>): Promise<void> {
    const docRef = doc(db, 'beneficiaryFunds', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    if (updates.assignedAt) {
      updateData.assignedAt = Timestamp.fromDate(updates.assignedAt);
    }
    
    await updateDoc(docRef, updateData);
  },

  /**
   * Update distributed amount
   */
  async updateDistributedAmount(id: string, amount: number): Promise<void> {
    const fund = await this.get(id);
    if (!fund) throw new Error('Beneficiary fund not found');
    
    const newDistributedAmount = fund.distributedAmount + amount;
    const newRemainingAmount = fund.amount - newDistributedAmount;
    
    await this.update(id, {
      distributedAmount: newDistributedAmount,
      remainingAmount: newRemainingAmount,
    });
  },

  /**
   * Close beneficiary fund
   */
  async close(id: string): Promise<void> {
    await this.update(id, { status: 'closed' });
  },
};
