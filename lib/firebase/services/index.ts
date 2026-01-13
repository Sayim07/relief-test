/**
 * Firebase Services Index
 * 
 * Central export point for all Firebase service functions
 */

export { userService } from './userService';
export { donationService } from './donationService';
export { reliefFundService } from './reliefFundService';
export { beneficiaryFundService } from './beneficiaryFundService';
export { reliefPartnerAssignmentService } from './reliefPartnerAssignmentService';
export { receiptService } from './receiptService';
export { categoryService, type CategoryDefinition } from './categoryService';

// Re-export legacy services from services.ts for backward compatibility
export { beneficiaryService, transactionService } from '../services';
export type { BeneficiaryData, TransactionData } from '../services';
