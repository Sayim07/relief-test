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
import { Receipt, ReceiptStatus, ReceiptQRData } from '@/lib/types/database';

export const receiptService = {
  /**
   * Generate unique receipt number
   */
  generateReceiptNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RCP-${timestamp}-${random}`;
  },

  /**
   * Create receipt QR code data
   */
  createQRData(receipt: Receipt, verificationUrl?: string): ReceiptQRData {
    return {
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
      amount: receipt.amount,
      currency: receipt.currency,
      payerId: receipt.payerId,
      payerEmail: receipt.payerEmail,
      createdAt: receipt.createdAt.toISOString(),
      transactionHash: receipt.transactionHash,
      verificationUrl,
    };
  },

  /**
   * Create a new receipt
   */
  async create(receipt: Omit<Receipt, 'id' | 'receiptNumber' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const receiptNumber = this.generateReceiptNumber();
    
    // Create QR code data
    const tempReceipt: Receipt = {
      ...receipt,
      id: '', // Will be set after creation
      receiptNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const qrData = this.createQRData(tempReceipt);
    const qrCodeData = JSON.stringify(qrData);
    
    const docRef = await addDoc(collection(db, 'receipts'), {
      ...receipt,
      receiptNumber,
      qrCodeData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return docRef.id;
  },

  /**
   * Get receipt by ID
   */
  async get(id: string): Promise<Receipt | null> {
    const docRef = doc(db, 'receipts', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        verifiedAt: data.verifiedAt?.toDate(),
      } as Receipt;
    }
    return null;
  },

  /**
   * Get receipt by receipt number
   */
  async getByReceiptNumber(receiptNumber: string): Promise<Receipt | null> {
    const q = query(collection(db, 'receipts'), where('receiptNumber', '==', receiptNumber));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        verifiedAt: data.verifiedAt?.toDate(),
      } as Receipt;
    }
    return null;
  },

  /**
   * Get receipts by payer ID
   */
  async getByPayer(payerId: string): Promise<Receipt[]> {
    const q = query(
      collection(db, 'receipts'),
      where('payerId', '==', payerId),
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
      } as Receipt;
    });
  },

  /**
   * Get receipts by donation ID
   */
  async getByDonation(donationId: string): Promise<Receipt[]> {
    const q = query(
      collection(db, 'receipts'),
      where('donationId', '==', donationId),
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
      } as Receipt;
    });
  },

  /**
   * Get receipts by assignment ID
   */
  async getByAssignment(assignmentId: string): Promise<Receipt[]> {
    const q = query(
      collection(db, 'receipts'),
      where('assignmentId', '==', assignmentId),
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
      } as Receipt;
    });
  },

  /**
   * Get receipts by status
   */
  async getByStatus(status: ReceiptStatus): Promise<Receipt[]> {
    const q = query(
      collection(db, 'receipts'),
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
      } as Receipt;
    });
  },

  /**
   * Get pending receipts (for admin verification)
   */
  async getPending(limitCount: number = 50): Promise<Receipt[]> {
    const q = query(
      collection(db, 'receipts'),
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
      } as Receipt;
    });
  },

  /**
   * Update receipt
   */
  async update(id: string, updates: Partial<Receipt>): Promise<void> {
    const docRef = doc(db, 'receipts', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Verify receipt (admin action)
   */
  async verify(id: string, verifiedBy: string): Promise<void> {
    await this.update(id, {
      status: 'verified',
      verifiedBy,
      verifiedAt: new Date(),
    });
  },

  /**
   * Reject receipt (admin action)
   */
  async reject(id: string, verifiedBy: string, reason: string): Promise<void> {
    await this.update(id, {
      status: 'rejected',
      verifiedBy,
      rejectedReason: reason,
    });
  },

  /**
   * Update QR code image URL
   */
  async updateQRImageUrl(id: string, imageUrl: string): Promise<void> {
    await this.update(id, { qrCodeImageUrl: imageUrl });
  },
};
