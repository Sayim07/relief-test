'use client';

import { useEffect } from 'react';
import { initializeCategories, checkFirestoreConnection } from '@/lib/firebase/init-collections';

/**
 * Firebase Initializer Component
 * 
 * This component initializes Firebase collections when the app loads.
 * It runs once on mount and sets up default data if needed.
 */
export default function FirebaseInitializer() {
  useEffect(() => {
    const initFirebase = async () => {
      try {
        // Check if Firestore is connected
        const isConnected = await checkFirestoreConnection();
        
        if (!isConnected) {
          console.warn('⚠️ Firestore connection check failed. Make sure Firebase is configured.');
          return;
        }

        // Initialize categories if they don't exist
        await initializeCategories();
      } catch (error: any) {
        // Log error details for debugging
        if (error?.code === 'permission-denied') {
          console.error('❌ Firestore permission denied. Please check security rules:');
          console.error('   1. Go to Firebase Console → Firestore → Rules');
          console.error('   2. Use development rules (see FIRESTORE_RULES_FIX.md)');
          console.error('   3. Click Publish');
        } else {
          console.log('ℹ️ Firebase initialization skipped (configuration may be pending)');
          console.log('Error:', error?.message || error);
        }
      }
    };

    initFirebase();
  }, []);

  // This component doesn't render anything
  return null;
}
