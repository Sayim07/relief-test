export type UserRole = 'donor' | 'admin' | 'beneficiary' | 'relief_partner';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  walletAddress?: string;
  phoneNumber?: string;
  organization?: string;
  location?: string;
  verified: boolean;
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
