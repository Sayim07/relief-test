/**
 * Script to delete the categories collection from Firestore
 * This will remove all category documents
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../firebase-key.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://nam5-default-rtdb.firebaseio.com'
  });
} catch (error) {
  // App already initialized
}

const db = admin.firestore();

async function deleteCollection(collectionName) {
  console.log(`🗑️  Starting deletion of '${collectionName}' collection...`);
  
  try {
    const collectionRef = db.collection(collectionName);
    const docs = await collectionRef.get();

    if (docs.empty) {
      console.log(`✅ Collection '${collectionName}' is already empty!`);
      return;
    }

    console.log(`Found ${docs.size} documents to delete...`);

    // Delete documents in batches
    const batch = db.batch();
    let count = 0;

    docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();
    console.log(`✅ Successfully deleted ${count} documents from '${collectionName}'`);
    
    // Verify deletion
    const verifyDocs = await collectionRef.get();
    if (verifyDocs.empty) {
      console.log(`✅ Verification complete: '${collectionName}' collection is now empty!`);
    }

  } catch (error) {
    console.error(`❌ Error deleting collection '${collectionName}':`, error.message);
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

// Run deletion
deleteCollection('categories')
  .then(() => {
    console.log('\n✨ Done! The categories collection has been deleted.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
