/**
 * Firebase Services Main Entry Point
 * 
 * This file re-exports all modular services from the services/ directory.
 * Use this as the primary import source for services throughout the application.
 */

export * from './services/index';

// Re-export common types
export type { Transaction, ReliefRequest, BeneficiaryFund, ReliefPartnerAssignment } from '../types/database';
export type { UserProfile, UserRole } from '../types/user';
