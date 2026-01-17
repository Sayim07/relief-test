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
import { Donation, DonationStatus } from '@/lib/types/database';

/**
 * Donation Verification Log Interface
 */
export interface DonationVerificationLog {
  id: string;
  donationId: string;
  action: 'verified' | 'rejected' | 'commented' | 'flagged';
  performedBy: string; // Admin UID
  performedAt: Date;
  notes: string;
  riskScore?: number;
  previousStatus: DonationStatus;
  newStatus: DonationStatus;
  metadata?: Record<string, any>;
}

/**
 * Donation Verification Service
 * Handles verification of donations with multiple verification methods
 */
export const donationVerificationService = {
  /**
   * Calculate risk score for a donation
   * Returns a score from 0-100 where:
   * - 0-30: Low risk (safe to auto-verify)
   * - 31-70: Medium risk (requires review)
   * - 71-100: High risk (requires manual verification)
   */
  async calculateRiskScore(donation: Donation, donorVerified: boolean): Promise<number> {
    let score = 0;

    // 1. Large amount risk (30 points max)
    const largeAmountThreshold = 10000;
    if (donation.amount > largeAmountThreshold) {
      const excessAmount = donation.amount - largeAmountThreshold;
      const percentageOver = (excessAmount / largeAmountThreshold) * 100;
      score += Math.min(30, Math.ceil(percentageOver / 10));
    }

    // 2. Unverified donor risk (20 points)
    if (!donorVerified) {
      score += 20;
    }

    // 3. Missing metadata risk (10 points)
    if (!donation.description || donation.description.trim().length === 0) {
      score += 10;
    }

    // 4. Fast repeated donations risk (15 points)
    // This would require checking recent donations from same donor
    // Simulated here - in real implementation, fetch from firestore
    const recentDonations = await this.getRecentDonationsByDonor(
      donation.donorId,
      3600000 // 1 hour
    );
    if (recentDonations.length > 3) {
      score += 15;
    }

    // 5. New account risk (10 points)
    if (donation.createdAt) {
      const accountAgeMs = Date.now() - donation.createdAt.getTime();
      const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);
      if (accountAgeDays < 7) {
        score += 10;
      }
    }

    return Math.min(100, score);
  },

  /**
   * Get recent donations by donor
   */
  async getRecentDonationsByDonor(donorId: string, timeWindowMs: number): Promise<Donation[]> {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowMs);

      const q = query(
        collection(db, 'donations'),
        where('donorId', '==', donorId),
        where('createdAt', '>=', Timestamp.fromDate(cutoffTime)),
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
      if (error?.code === 'failed-precondition') {
        console.warn('Index not found for recent donations query, using fallback');
        const q = query(collection(db, 'donations'), where('donorId', '==', donorId));
        const querySnapshot = await getDocs(q);

        const donations = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate(),
              verifiedAt: data.verifiedAt?.toDate(),
              distributedAt: data.distributedAt?.toDate(),
            } as Donation;
          })
          .filter((d) => Date.now() - d.createdAt.getTime() < timeWindowMs);

        return donations;
      }
      throw error;
    }
  },

  /**
   * Auto-verify donation based on risk score
   * Donations with risk score < 30 from verified donors can be auto-verified
   */
  async autoVerify(donationId: string, donorVerified: boolean): Promise<boolean> {
    const donation = await this.getDonation(donationId);
    if (!donation) {
      throw new Error('Donation not found');
    }

    const riskScore = await this.calculateRiskScore(donation, donorVerified);

    // Auto-verify if low risk and donor is verified
    const shouldAutoVerify = riskScore < 30 && donorVerified && donation.amount < 5000;

    if (shouldAutoVerify) {
      await this.verifyDonation(donationId, 'auto', undefined, {
        riskScore,
        autoVerified: true,
      });
      return true;
    }

    return false;
  },

  /**
   * Verify donation manually
   */
  async verifyDonation(
    donationId: string,
    method: 'auto' | 'manual' | 'blockchain',
    adminId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const donationRef = doc(db, 'donations', donationId);
    const donationSnap = await getDoc(donationRef);

    if (!donationSnap.exists()) {
      throw new Error('Donation not found');
    }

    const currentStatus = donationSnap.data().status as DonationStatus;

    await updateDoc(donationRef, {
      status: 'verified',
      'verification.method': method,
      'verification.status': 'verified',
      'verification.verifiedAt': Timestamp.now(),
      'verification.verifiedBy': adminId,
      updatedAt: Timestamp.now(),
    });

    // Log verification
    if (adminId || method === 'manual') {
      await this.createVerificationLog({
        donationId,
        action: 'verified',
        performedBy: adminId || 'system',
        performedAt: new Date(),
        notes: `Donation verified via ${method} method`,
        riskScore: metadata?.riskScore,
        previousStatus: currentStatus,
        newStatus: 'verified',
        metadata,
      });
    }
  },

  /**
   * Reject donation
   */
  async rejectDonation(
    donationId: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    const donationRef = doc(db, 'donations', donationId);
    const donationSnap = await getDoc(donationRef);

    if (!donationSnap.exists()) {
      throw new Error('Donation not found');
    }

    const currentStatus = donationSnap.data().status as DonationStatus;

    await updateDoc(donationRef, {
      status: 'rejected',
      'verification.status': 'rejected',
      rejectedReason: reason,
      rejectedBy: adminId,
      rejectedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Log rejection
    await this.createVerificationLog({
      donationId,
      action: 'rejected',
      performedBy: adminId,
      performedAt: new Date(),
      notes: reason,
      previousStatus: currentStatus,
      newStatus: 'rejected',
    });
  },

  /**
   * Add verification note/comment
   */
  async addVerificationNote(
    donationId: string,
    adminId: string,
    note: string
  ): Promise<void> {
    await this.createVerificationLog({
      donationId,
      action: 'commented',
      performedBy: adminId,
      performedAt: new Date(),
      notes: note,
      previousStatus: 'pending',
      newStatus: 'pending',
    });

    // Also update donation with latest comment
    const donationRef = doc(db, 'donations', donationId);
    await updateDoc(donationRef, {
      'verification.verificationNotes': note,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Flag donation as suspicious
   */
  async flagDonation(donationId: string, adminId: string, reason: string): Promise<void> {
    const donationRef = doc(db, 'donations', donationId);
    const donationSnap = await getDoc(donationRef);

    if (!donationSnap.exists()) {
      throw new Error('Donation not found');
    }

    const currentStatus = donationSnap.data().status as DonationStatus;

    await updateDoc(donationRef, {
      'verification.status': 'pending',
      updatedAt: Timestamp.now(),
    });

    await this.createVerificationLog({
      donationId,
      action: 'flagged',
      performedBy: adminId,
      performedAt: new Date(),
      notes: reason,
      previousStatus: currentStatus,
      newStatus: 'pending',
    });
  },

  /**
   * Create verification log entry
   */
  async createVerificationLog(log: Omit<DonationVerificationLog, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'donationVerificationLogs'), {
      ...log,
      performedAt: Timestamp.fromDate(log.performedAt),
    });
    return docRef.id;
  },

  /**
   * Get verification logs for a donation
   */
  async getVerificationLogs(donationId: string): Promise<DonationVerificationLog[]> {
    try {
      const q = query(
        collection(db, 'donationVerificationLogs'),
        where('donationId', '==', donationId),
        orderBy('performedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          performedAt: data.performedAt.toDate(),
        } as DonationVerificationLog;
      });
    } catch (error: any) {
      if (error?.code === 'failed-precondition') {
        console.warn('Index not found for verification logs, using fallback');
        const q = query(collection(db, 'donationVerificationLogs'), where('donationId', '==', donationId));

        const querySnapshot = await getDocs(q);
        const logs = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              performedAt: data.performedAt.toDate(),
            } as DonationVerificationLog;
          })
          .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());

        return logs;
      }
      throw error;
    }
  },

  /**
   * Helper: Get donation (internal use)
   */
  async getDonation(donationId: string): Promise<Donation | null> {
    const docRef = doc(db, 'donations', donationId);
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
   * Get high-risk donations for review
   */
  async getHighRiskDonations(limit: number = 20): Promise<Donation[]> {
    try {
      const q = query(
        collection(db, 'donations'),
        where('status', '==', 'pending'),
        orderBy('updatedAt', 'desc')
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

      // Filter for high risk (riskScore > 60)
      return donations.filter((d) => (d.verification?.riskScore || 0) > 60).slice(0, limit);
    } catch (error) {
      console.error('Error fetching high-risk donations:', error);
      return [];
    }
  },

  /**
   * Get donations pending verification
   */
  async getPendingVerification(limit: number = 50): Promise<Donation[]> {
    try {
      const q = query(
        collection(db, 'donations'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
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

      return donations.slice(0, limit);
    } catch (error: any) {
      if (error?.code === 'failed-precondition') {
        const q = query(collection(db, 'donations'), where('status', '==', 'pending'));

        const querySnapshot = await getDocs(q);
        const donations = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate(),
              verifiedAt: data.verifiedAt?.toDate(),
              distributedAt: data.distributedAt?.toDate(),
            } as Donation;
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return donations.slice(0, limit);
      }
      throw error;
    }
  },
};
