/**
 * Firebase Collections Initialization
 * 
 * This module initializes Firestore collections with default data
 * when the app first loads or when collections are empty.
 */

import { collection, doc, setDoc, getDocs, query } from 'firebase/firestore';
import { db } from './config';
import { categoryService, CategoryDefinition } from '../firebase/services';

/**
 * Default categories for the relief system
 */
export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'food',
    name: 'Food',
    description: 'Food and nutrition expenses for beneficiaries',
    defaultLimit: 1000,
  },
  {
    id: 'shelter',
    name: 'Shelter',
    description: 'Housing and shelter expenses',
    defaultLimit: 2000,
  },
  {
    id: 'medical',
    name: 'Medical',
    description: 'Medical and healthcare expenses',
    defaultLimit: 1500,
  },
  {
    id: 'clothing',
    name: 'Clothing',
    description: 'Clothing and personal items',
    defaultLimit: 500,
  },
  {
    id: 'utilities',
    name: 'Utilities',
    description: 'Water, electricity, and other utilities',
    defaultLimit: 800,
  },
];

/**
 * Initialize categories collection if it's empty
 */
export async function initializeCategories(): Promise<void> {
  try {
    // Check if categories already exist
    const existingCategories = await categoryService.getAll();
    
    if (existingCategories.length > 0) {
      console.log(`✅ Categories already initialized (${existingCategories.length} found)`);
      return;
    }

    // Create default categories
    console.log('📋 Initializing default categories...');
    for (const category of DEFAULT_CATEGORIES) {
      await categoryService.create(category);
      console.log(`   ✓ Created category: ${category.name}`);
    }

    console.log('✅ Categories initialization complete!');
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      console.error('❌ Firestore permission denied!');
      console.error('Please update Firestore security rules:');
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id';
      console.error(`1. Go to: https://console.firebase.google.com/project/${projectId}/firestore/rules`);
      console.error('2. Copy rules from firestore.rules file or FIRESTORE_RULES_FIX.md');
      console.error('3. Click Publish');
    } else {
      console.error('❌ Error initializing categories:', error);
    }
    throw error;
  }
}

/**
 * Initialize all Firestore collections
 */
export async function initializeFirestore(): Promise<void> {
  try {
    console.log('🔥 Initializing Firestore collections...');
    await initializeCategories();
    console.log('✅ Firestore initialization complete!');
  } catch (error) {
    console.error('❌ Firestore initialization failed:', error);
    throw error;
  }
}

/**
 * Check if Firestore is properly configured
 */
export async function checkFirestoreConnection(): Promise<boolean> {
  try {
    // Try to read from Firestore
    const categoriesRef = collection(db, 'categories');
    await getDocs(query(categoriesRef));
    return true;
  } catch (error) {
    console.error('❌ Firestore connection check failed:', error);
    return false;
  }
}
