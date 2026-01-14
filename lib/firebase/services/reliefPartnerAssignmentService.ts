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
import { ReliefPartnerAssignment, AssignmentStatus } from '@/lib/types/database';

export const reliefPartnerAssignmentService = {
  /**
   * Create a new relief partner assignment
   */
  async create(assignment: Omit<ReliefPartnerAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'reliefPartnerAssignments'), {
      ...assignment,
      assignedAt: Timestamp.fromDate(assignment.assignedAt),
      completedAt: assignment.completedAt ? Timestamp.fromDate(assignment.completedAt) : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  /**
   * Get assignment by ID
   */
  async get(id: string): Promise<ReliefPartnerAssignment | null> {
    const docRef = doc(db, 'reliefPartnerAssignments', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        assignedAt: data.assignedAt.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as ReliefPartnerAssignment;
    }
    return null;
  },

  /**
   * Get assignments by relief partner ID
   */
  async getByReliefPartner(reliefPartnerId: string): Promise<ReliefPartnerAssignment[]> {
    try {
      const q = query(
        collection(db, 'reliefPartnerAssignments'),
        where('reliefPartnerId', '==', reliefPartnerId),
        orderBy('assignedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          assignedAt: data.assignedAt.toDate(),
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as ReliefPartnerAssignment;
      });
    } catch (error: any) {
      if (error?.code === 'failed-precondition') {
        console.warn('Firestore index missing for reliefPartnerAssignments reliefPartnerId + assignedAt, falling back to memory sort');
        const q = query(
          collection(db, 'reliefPartnerAssignments'),
          where('reliefPartnerId', '==', reliefPartnerId)
        );
        const querySnapshot = await getDocs(q);
        const assignments = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            assignedAt: data.assignedAt.toDate(),
            completedAt: data.completedAt?.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          } as ReliefPartnerAssignment;
        });
        return assignments.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
      }
      throw error;
    }
  },

  /**
   * Get assignments by beneficiary ID
   */
  async getByBeneficiary(beneficiaryId: string): Promise<ReliefPartnerAssignment[]> {
    try {
      const q = query(
        collection(db, 'reliefPartnerAssignments'),
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
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as ReliefPartnerAssignment;
      });
    } catch (error: any) {
      if (error?.code === 'failed-precondition') {
        console.warn('Firestore index missing for reliefPartnerAssignments beneficiaryId + assignedAt, falling back to memory sort');
        const q = query(
          collection(db, 'reliefPartnerAssignments'),
          where('beneficiaryId', '==', beneficiaryId)
        );
        const querySnapshot = await getDocs(q);
        const assignments = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            assignedAt: data.assignedAt.toDate(),
            completedAt: data.completedAt?.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          } as ReliefPartnerAssignment;
        });
        return assignments.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
      }
      throw error;
    }
  },

  /**
   * Get assignments by beneficiary fund ID
   */
  async getByBeneficiaryFund(beneficiaryFundId: string): Promise<ReliefPartnerAssignment[]> {
    try {
      const q = query(
        collection(db, 'reliefPartnerAssignments'),
        where('beneficiaryFundId', '==', beneficiaryFundId),
        orderBy('assignedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          assignedAt: data.assignedAt.toDate(),
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as ReliefPartnerAssignment;
      });
    } catch (error: any) {
      if (error?.code === 'failed-precondition') {
        console.warn('Firestore index missing for reliefPartnerAssignments beneficiaryFundId + assignedAt, falling back to memory sort');
        const q = query(
          collection(db, 'reliefPartnerAssignments'),
          where('beneficiaryFundId', '==', beneficiaryFundId)
        );
        const querySnapshot = await getDocs(q);
        const assignments = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            assignedAt: data.assignedAt.toDate(),
            completedAt: data.completedAt?.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          } as ReliefPartnerAssignment;
        });
        return assignments.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
      }
      throw error;
    }
  },

  /**
   * Get assignments by status
   */
  async getByStatus(status: AssignmentStatus): Promise<ReliefPartnerAssignment[]> {
    try {
      const q = query(
        collection(db, 'reliefPartnerAssignments'),
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
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as ReliefPartnerAssignment;
      });
    } catch (error: any) {
      if (error?.code === 'failed-precondition') {
        console.warn('Firestore index missing for reliefPartnerAssignments status + assignedAt, falling back to memory sort');
        const q = query(
          collection(db, 'reliefPartnerAssignments'),
          where('status', '==', status)
        );
        const querySnapshot = await getDocs(q);
        const assignments = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            assignedAt: data.assignedAt.toDate(),
            completedAt: data.completedAt?.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          } as ReliefPartnerAssignment;
        });
        return assignments.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
      }
      throw error;
    }
  },

  /**
   * Get active assignments for a relief partner
   */
  async getActive(reliefPartnerId?: string): Promise<ReliefPartnerAssignment[]> {
    if (reliefPartnerId) {
      try {
        const q = query(
          collection(db, 'reliefPartnerAssignments'),
          where('reliefPartnerId', '==', reliefPartnerId),
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
            completedAt: data.completedAt?.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          } as ReliefPartnerAssignment;
        });
      } catch (error: any) {
        if (error?.code === 'failed-precondition') {
          console.warn('Firestore index missing for reliefPartnerAssignments active status + reliefPartnerId, falling back to memory sort');
          const q = query(
            collection(db, 'reliefPartnerAssignments'),
            where('reliefPartnerId', '==', reliefPartnerId),
            where('status', '==', 'active')
          );
          const querySnapshot = await getDocs(q);
          const assignments = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              assignedAt: data.assignedAt.toDate(),
              completedAt: data.completedAt?.toDate(),
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate(),
            } as ReliefPartnerAssignment;
          });
          return assignments.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());
        }
        throw error;
      }
    }
    return this.getByStatus('active');
  },

  /**
   * Update assignment
   */
  async update(id: string, updates: Partial<ReliefPartnerAssignment>): Promise<void> {
    const docRef = doc(db, 'reliefPartnerAssignments', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    if (updates.assignedAt) {
      updateData.assignedAt = Timestamp.fromDate(updates.assignedAt);
    }

    if (updates.completedAt) {
      updateData.completedAt = Timestamp.fromDate(updates.completedAt);
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Update spent amount
   */
  async updateSpentAmount(id: string, amount: number): Promise<void> {
    const assignment = await this.get(id);
    if (!assignment) throw new Error('Assignment not found');

    const newSpentAmount = assignment.spentAmount + amount;
    const newRemainingAmount = assignment.amount - newSpentAmount;

    await this.update(id, {
      spentAmount: newSpentAmount,
      remainingAmount: newRemainingAmount,
    });
  },

  /**
   * Add receipt to assignment
   */
  async addReceipt(id: string, receiptId: string): Promise<void> {
    const assignment = await this.get(id);
    if (!assignment) throw new Error('Assignment not found');

    const receipts = assignment.receipts || [];
    if (!receipts.includes(receiptId)) {
      receipts.push(receiptId);
      await this.update(id, { receipts });
    }
  },

  /**
   * Complete assignment
   */
  async complete(id: string): Promise<void> {
    await this.update(id, {
      status: 'completed',
      completedAt: new Date(),
    });
  },

  /**
   * Cancel assignment
   */
  async cancel(id: string): Promise<void> {
    await this.update(id, { status: 'cancelled' });
  },
};
