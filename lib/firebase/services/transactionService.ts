import { db } from '../config';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import type { Transaction } from '@/lib/types/database';

export const transactionService = {
    /**
     * Log a new transaction
     */
    async log(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'transactions'), {
            ...transaction,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    /**
     * Get all transactions
     */
    async getAll(): Promise<Transaction[]> {
        const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate()
            } as Transaction;
        });
    },

    /**
     * Get transactions by route (direct or mediated)
     */
    async getByRoute(route: 'direct' | 'mediated'): Promise<Transaction[]> {
        const q = query(
            collection(db, 'transactions'),
            where('route', '==', route),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate()
            } as Transaction;
        });
    }
};
