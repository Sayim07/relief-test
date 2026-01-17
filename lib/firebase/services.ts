import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';

// Re-export all services from the services folder
export { userService } from './services/userService';
export { donationService } from './services/donationService';
export { donationVerificationService, type DonationVerificationLog } from './services/donationVerificationService';
export { reliefPartnerAssignmentService } from './services/reliefPartnerAssignmentService';
export type { BeneficiaryData, TransactionData } from './services/index';

// Types
export interface BeneficiaryData {
  walletAddress: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  disasterType?: string;
  verified: boolean;
  createdAt: Timestamp;
  categories: {
    [category: string]: {
      limit: number;
      spent: number;
    };
  };
}

export interface TransactionData {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  category: string;
  description: string;
  timestamp: Timestamp;
  blockNumber?: number;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  defaultLimit?: number;
}

// Beneficiary services
export const beneficiaryService = {
  async create(beneficiary: Omit<BeneficiaryData, 'createdAt'>) {
    const docRef = doc(db, 'beneficiaries', beneficiary.walletAddress);
    await setDoc(docRef, {
      ...beneficiary,
      createdAt: Timestamp.now(),
    });
  },

  async get(walletAddress: string): Promise<BeneficiaryData | null> {
    const docRef = doc(db, 'beneficiaries', walletAddress);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as BeneficiaryData;
    }
    return null;
  },

  async getAll(): Promise<BeneficiaryData[]> {
    const q = query(collection(db, 'beneficiaries'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as BeneficiaryData);
  },

  async update(walletAddress: string, updates: Partial<BeneficiaryData>) {
    const docRef = doc(db, 'beneficiaries', walletAddress);
    await updateDoc(docRef, updates);
  },

  async verify(walletAddress: string) {
    await this.update(walletAddress, { verified: true });
  },
};

// Transaction services
export const transactionService = {
  async create(transaction: Omit<TransactionData, 'timestamp'>) {
    const docRef = doc(db, 'transactions', transaction.txHash);
    await setDoc(docRef, {
      ...transaction,
      timestamp: Timestamp.now(),
    });
  },

  async getByHash(txHash: string): Promise<TransactionData | null> {
    const docRef = doc(db, 'transactions', txHash);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as TransactionData;
    }
    return null;
  },

  async getByAddress(address: string): Promise<TransactionData[]> {
    const q = query(
      collection(db, 'transactions'),
      where('to', '==', address)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as TransactionData);
  },

  async getAll(): Promise<TransactionData[]> {
    const q = query(collection(db, 'transactions'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => doc.data() as TransactionData)
      .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
  },
};

// Category services
export const categoryService = {
  async getAll(): Promise<CategoryDefinition[]> {
    const q = query(collection(db, 'categories'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as CategoryDefinition));
  },

  async create(category: CategoryDefinition) {
    const docRef = doc(db, 'categories', category.id);
    await setDoc(docRef, category);
  },
};
