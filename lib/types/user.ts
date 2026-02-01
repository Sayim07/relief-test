export type UserRole = 'donor' | 'admin' | 'relief_partner';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  walletAddress?: string;
  phoneNumber?: string;
  organization?: string;
  location?: string;
  reliefCategories?: string[]; // For relief partners: the categories they specialize in
  reliefCategory?: string; // Legacy singular field for relief partners
  reliefPartnerKey?: string; // Unique key for verified partners
  verified: boolean;
  hasActiveTicket?: boolean; // New: track if a verification ticket is pending
  verificationTimestamp?: Date; // When the user was verified by an admin
  proofImages?: string[]; // Verification proofs
  proofVideos?: string[]; // Verification proofs
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    [key: string]: any;
  };
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}
