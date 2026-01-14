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
 * Receipt Status
 */
export type ReceiptStatus = 'pending' | 'verified' | 'rejected';

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
  currency: string; // e.g., 'USDT', 'USDC'
  category?: string; // Optional category
  description?: string;
  status: DonationStatus;
  transactionHash?: string; // Blockchain transaction hash
  verifiedBy?: string; // Admin UID who verified
  verifiedAt?: Date;
  rejectedReason?: string;
  distributedAt?: Date;
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
  targetBeneficiaries?: string[]; // Beneficiary UIDs
  createdBy: string; // Admin UID
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Beneficiary Fund - Funds assigned to beneficiaries
 */
export interface BeneficiaryFund {
  id: string;
  beneficiaryId: string; // Beneficiary UID
  beneficiaryEmail: string;
  beneficiaryName?: string;
  reliefFundId: string; // Source relief fund
  amount: number; // Amount assigned
  amountDisplay: string;
  currency: string;
  category?: string;
  status: FundStatus;
  assignedBy: string; // Admin UID
  assignedAt: Date;
  distributedAmount: number; // Amount distributed to relief partners
  remainingAmount: number; // Remaining to distribute
  transactionHash?: string;
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
  beneficiaryFundId: string; // Source beneficiary fund
  beneficiaryId: string; // Beneficiary UID
  beneficiaryEmail: string;
  beneficiaryName?: string;
  amount: number; // Amount assigned
  amountDisplay: string;
  currency: string;
  category?: string;
  purpose?: string; // Purpose of the assignment
  status: AssignmentStatus;
  assignedBy: string; // Beneficiary UID
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
}
