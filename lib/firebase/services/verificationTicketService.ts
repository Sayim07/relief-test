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
import { VerificationTicket } from '@/lib/types/database';

export const verificationTicketService = {
    /**
     * Create a new verification ticket
     */
    async create(ticket: Omit<VerificationTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'verification_tickets'), {
            ...ticket,
            status: 'pending',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    },

    /**
     * Get ticket by ID
     */
    async get(id: string): Promise<VerificationTicket | null> {
        const docRef = doc(db, 'verification_tickets', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            } as VerificationTicket;
        }
        return null;
    },

    /**
     * Get tickets by status
     */
    async getByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<VerificationTicket[]> {
        const q = query(
            collection(db, 'verification_tickets'),
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
            } as VerificationTicket;
        });
    },

    /**
     * Get ticket by user UID
     */
    async getByUser(uid: string): Promise<VerificationTicket | null> {
        const q = query(
            collection(db, 'verification_tickets'),
            where('uid', '==', uid),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            return {
                id: querySnapshot.docs[0].id,
                ...data,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
            } as VerificationTicket;
        }
        return null;
    },

    /**
     * Update ticket status
     */
    async updateStatus(id: string, status: 'approved' | 'rejected', rejectionReason?: string): Promise<void> {
        const docRef = doc(db, 'verification_tickets', id);
        const updates: any = {
            status,
            updatedAt: Timestamp.now(),
        };
        if (rejectionReason) {
            updates.rejectionReason = rejectionReason;
        }
        await updateDoc(docRef, updates);
    },
};
