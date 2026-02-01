import { UserRole } from './user';

/**
 * Donation Status
 */
export type DonationStatus = 'pending' | 'verified' | 'rejected' | 'distributed';

/**
 * Fund Status
 */
export type FundStatus = 'active' | 'distributed' | 'closed';

/**
 * Assignment Status
 */
export type AssignmentStatus = 'pending' | 'active' | 'completed' | 'cancelled';

/**
 * Relief Request Status
 */
export type ReliefRequestStatus = 'pending_verification' | 'verified' | 'rejected' | 'fulfilled';

/**
 * Urgency Level
 */
export type UrgencyLevel = 'low' | 'medium' | 'high';

/**
 * Receipt Status
 */
export type ReceiptStatus = 'pending' | 'verified' | 'rejected';

/**
 * Donation Verification Details
 */
export interface DonationVerification {
  method: 'auto' | 'manual' | 'blockchain';
  status: 'pending' | 'verified' | 'rejected';
  riskScore: number; // 0-100, where 0-30 = low, 31-70 = medium, 71-100 = high
  verifiedAt?: Date;
  verifiedBy?: string; // Admin UID
  verificationNotes?: string;
  transactionVerified?: boolean; // Whether blockchain transaction was verified
  donorVerified?: boolean; // Whether donor is KYC verified
  amountVerified?: boolean; // Whether amount matches blockchain
}

/**
 * Donation - Donor contributions
 */
export interface Donation {
  id: string;
  onChainId?: number; // Donation ID on the smart contract
  donorId: string; // User UID
  donorEmail: string;
  donorName?: string;
  amount: number; // Amount in tokens/wei
  amountDisplay: string; // Human-readable amount
  currency: string; // e.g., 'INR', 'USDC'
  category?: string; // Optional category
  description?: string;
  status: DonationStatus;

  // Donation Type (Path A: direct to relief partner, Path B: general pool)
  donationType: 'direct' | 'general'; // 'direct' = to relief partner, 'general' = to pool
  reliefPartnerId?: string; // If donationType === 'direct'

  // Blockchain & Transaction
  transactionHash?: string; // Blockchain transaction hash
  blockNumber?: number;
  confirmations?: number;
  gasUsed?: string; // Gas used in wei

  // Verification
  verification: DonationVerification;

  // Legacy fields (for backward compatibility)
  verifiedBy?: string; // Admin UID who verified (deprecated, use verification.verifiedBy)
  verifiedAt?: Date; // (deprecated, use verification.verifiedAt)

  // Rejection/Dispute
  rejectedReason?: string;
  rejectedBy?: string;
  rejectedAt?: Date;

  // Distribution tracking
  distributedAt?: Date;
  distributedTo?: string[]; // Relief partner IDs (if general donation)

  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Relief Fund - Admin-managed relief funds
 */
export interface ReliefFund {
  id: string;
  name: string;
  description?: string;
  totalAmount: number; // Total amount in tokens
  totalAmountDisplay: string;
  currency: string;
  distributedAmount: number; // Amount already distributed
  remainingAmount: number; // Remaining to distribute
  status: FundStatus;
  category?: string;
  targetTicketRaisers?: string[]; // Ticket Raiser IDs (if applicable)
  createdBy: string; // Admin UID
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    [key: string]: any;
  };
}



/**
 * Relief Partner Assignment - Funds assigned to relief partners
 */
export interface ReliefPartnerAssignment {
  id: string;
  reliefPartnerId: string; // Relief Partner UID
  reliefPartnerEmail: string;
  reliefPartnerName?: string;
  sourceTicketId?: string; // Source relief ticket
  recipientPhone: string;
  recipientName?: string;
  amount: number; // Amount assigned
  amountDisplay: string;
  currency: string;
  category?: string;
  purpose?: string; // Purpose of the assignment
  status: AssignmentStatus;
  assignedBy: string; // Admin UID or System
  assignedAt: Date;
  completedAt?: Date;
  spentAmount: number; // Amount spent
  remainingAmount: number; // Remaining amount
  transactionHash?: string;
  receipts?: string[]; // Receipt IDs
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Receipt - Payment receipts with QR codes
 */
export interface Receipt {
  id: string;
  receiptNumber: string; // Unique receipt number
  donationId?: string; // If from donation
  assignmentId?: string; // If from relief partner assignment
  payerId: string; // User UID who paid
  payerEmail: string;
  payerName?: string;
  recipientId?: string; // User UID who received (if applicable)
  recipientEmail?: string;
  recipientName?: string;
  amount: number;
  amountDisplay: string;
  currency: string;
  category?: string;
  description?: string;
  status: ReceiptStatus;
  qrCodeData: string; // QR code data (JSON stringified)
  qrCodeImageUrl?: string; // Optional: URL to QR code image
  transactionHash?: string; // Blockchain transaction hash
  verifiedBy?: string; // Admin UID who verified
  verifiedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Receipt QR Code Data Structure
 */
export interface ReceiptQRData {
  receiptId: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  payerId: string;
  payerEmail: string;
  createdAt: string; // ISO date string
  transactionHash?: string;
  verificationUrl?: string; // URL to verify receipt
  payerName?: string;
  amountDisplay?: string;
  description?: string;
  recipientName?: string;
}

/**
 * Relief Request - Off-chain tickets for relief
 */
export interface ReliefRequest {
  id: string;
  phone: string;
  name: string;
  location: string;
  category: string;
  urgency: UrgencyLevel;
  description?: string;
  status: ReliefRequestStatus;
  approvedAmount?: number;
  recipientWallet?: string;
  verifiedAt?: Date;
  verifiedBy?: string; // Admin UID
  partnerKey?: string; // Relief Partner Key who vouched/created this ticket
  evidenceImage?: string; // URL or Base64 of victim's ID/Impact
  evidenceVideo?: string; // URL to short verification video
  evidenceMetadata?: {
    exifDate?: string;
    exifLocation?: string;
    deviceModel?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    [key: string]: any;
  };
}
export interface Transaction {
  id?: string;
  from: string;
  to: string;
  amount: number;
  category: string;
  reliefPartnerKey: string;
  txHash: string;
  route: 'direct' | 'ticket';
  status: 'verified';
  createdAt: Date;
}

/**
 * Verification Ticket - Relief Partner identity verification requests
 */
export interface VerificationTicket {
  id: string; // Document ID
  uid: string; // User UID of the Relief Partner
  walletAddress: string;
  organizationName: string;
  categories: string[];
  location: string;
  description: string;
  proofImages: string[];
  proofVideos: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    [key: string]: any;
  };
}
