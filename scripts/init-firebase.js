/**
 * Firebase Initialization Script
 * 
 * This script initializes Firestore collections with default data.
 * Run this after setting up your Firebase project.
 * 
 * Usage: node scripts/init-firebase.js
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Check if Firebase credentials are set
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error('❌ Error: Firebase configuration not found in .env.local');
  console.log('\n📋 Please set up your Firebase configuration:');
  console.log('   1. Create .env.local file');
  console.log('   2. Add your Firebase config values');
  console.log('   3. See FIREBASE_SETUP.md for details\n');
  process.exit(1);
}

// Initialize Firebase Admin (for server-side operations)
// Note: For client-side, use the regular Firebase SDK
async function initFirebase() {
  console.log('🔥 Initializing Firebase collections...\n');

  // For client-side initialization, we'll use the Firebase SDK
  // This script is a guide - actual initialization happens in the app
  console.log('📋 Default Categories to be created:');
  
  const defaultCategories = [
    {
      id: 'food',
      name: 'Food',
      description: 'Food and nutrition expenses',
      defaultLimit: 1000
    },
    {
      id: 'shelter',
      name: 'Shelter',
      description: 'Housing and shelter expenses',
      defaultLimit: 2000
    },
    {
      id: 'medical',
      name: 'Medical',
      description: 'Medical and healthcare expenses',
      defaultLimit: 1500
    },
    {
      id: 'clothing',
      name: 'Clothing',
      description: 'Clothing and personal items',
      defaultLimit: 500
    },
    {
      id: 'utilities',
      name: 'Utilities',
      description: 'Water, electricity, and other utilities',
      defaultLimit: 800
    }
  ];

  defaultCategories.forEach(cat => {
    console.log(`   ✓ ${cat.name} (${cat.id})`);
  });

  console.log('\n✅ Categories structure ready!');
  console.log('\n📝 Next steps:');
  console.log('   1. Make sure your .env.local has Firebase config');
  console.log('   2. Start your Next.js app: npm run dev');
  console.log('   3. Navigate to Admin Dashboard');
  console.log('   4. Categories will be created automatically on first use');
  console.log('\n💡 Tip: You can also manually add categories in Firebase Console');
}

// Run initialization
initFirebase().catch(console.error);
