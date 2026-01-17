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
          console.warn('⚠️ Firestore connection check failed. Using default categories.');
          return;
        }

        // Initialize categories if they don't exist
        // This will silently fail if permissions are denied - app uses default categories as fallback
        try {
          await initializeCategories();
        } catch (initError: any) {
          if (initError?.code === 'permission-denied') {
            console.warn('⚠️ Firestore write permission denied. Using default categories from app.');
            console.warn('ℹ️ To enable category management, update Firestore security rules.');
          } else {
            throw initError;
          }
        }
      } catch (error: any) {
        // Log error details for debugging
        if (error?.code === 'permission-denied') {
          console.warn('⚠️ Firestore permission denied. App will use default categories.');
        } else {
          console.log('ℹ️ Firebase initialization skipped (configuration may be pending)');
        }
      }
    };

    initFirebase();
  }, []);

  // This component doesn't render anything
  return null;
}
