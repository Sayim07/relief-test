import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import type { ReliefRequest, ReliefRequestStatus } from '@/lib/types/database';

const COLLECTION_NAME = 'relief_requests';

export const reliefRequestService = {
    /**
     * Create a new relief request (off-chain)
     */
    async create(data: Omit<ReliefRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            status: 'pending_verification',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    },

    /**
     * Get all relief requests
     */
    async getAll(): Promise<ReliefRequest[]> {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            verifiedAt: doc.data().verifiedAt?.toDate(),
        })) as ReliefRequest[];
    },

    /**
     * Get relief request by ID
     */
    async getById(id: string): Promise<ReliefRequest | null> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            verifiedAt: data.verifiedAt?.toDate(),
        } as ReliefRequest;
    },

    /**
     * Get requests by status
     */
    async getByStatus(status: ReliefRequestStatus): Promise<ReliefRequest[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            verifiedAt: doc.data().verifiedAt?.toDate(),
        })) as ReliefRequest[];
    },

    /**
     * Update request status and admin details
     */
    async updateStatus(
        id: string,
        status: ReliefRequestStatus,
        adminId?: string,
        updates?: Partial<ReliefRequest>
    ): Promise<void> {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData: any = {
            ...updates,
            status,
            updatedAt: serverTimestamp(),
        };

        if (status === 'verified') {
            updateData.verifiedAt = serverTimestamp();
            updateData.verifiedBy = adminId;
        }

        await updateDoc(docRef, updateData);
    },

    /**
     * Get requests by phone number (to check for duplicates)
     */
    async getByPhone(phone: string): Promise<ReliefRequest[]> {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('phone', '==', phone),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            verifiedAt: doc.data().verifiedAt?.toDate(),
        })) as ReliefRequest[];
    }
};
