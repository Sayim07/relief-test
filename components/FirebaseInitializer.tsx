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
      } catch (error) {
        // Silently fail - Firebase might not be configured yet
        // This is expected during initial setup
        console.log('ℹ️ Firebase initialization skipped (configuration may be pending)');
      }
    };

    initFirebase();
  }, []);

  // This component doesn't render anything
  return null;
}
