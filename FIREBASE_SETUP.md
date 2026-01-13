# Firebase Setup Guide - Phase 3

This guide will help you set up Firebase for the ReliefChain project.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `reliefchain` (or your preferred name)
4. Click **Continue**
5. **Disable** Google Analytics (optional, you can enable later)
6. Click **Create project**
7. Wait for project creation to complete
8. Click **Continue**

## Step 2: Enable Firestore Database

1. In your Firebase project, click on **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
   - ⚠️ **Note**: For production, set up proper security rules
4. Choose a location (select closest to your users)
5. Click **"Enable"**

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** `</>` to add a web app
5. Register app:
   - App nickname: `ReliefChain Web`
   - Check "Also set up Firebase Hosting" (optional)
   - Click **"Register app"**
6. Copy the Firebase configuration object

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## Step 4: Configure Environment Variables

1. Create `.env.local` file in the project root (if it doesn't exist)
2. Add your Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Smart Contract Configuration
NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_CHAIN_ID=1337
```

3. Replace all `your-*` values with your actual Firebase config values

## Step 5: Initialize Firestore Collections

Run the initialization script to set up default categories:

```bash
npm run init-firebase
```

Or manually run:
```bash
node scripts/init-firebase.js
```

This will create:
- **categories** collection with default spending categories
- Initial data structure for beneficiaries and transactions

## Step 6: Set Up Firestore Security Rules (Important!)

1. Go to **Firestore Database** → **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Categories - public read, admin write
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null; // Add admin check in production
    }
    
    // Beneficiaries - authenticated read, admin write
    match /beneficiaries/{beneficiaryId} {
      allow read: if request.auth != null || 
                     resource.data.walletAddress == request.auth.uid;
      allow write: if request.auth != null; // Add admin check in production
    }
    
    // Transactions - public read (for audit trail), authenticated write
    match /transactions/{transactionId} {
      allow read: if true; // Public audit trail
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

⚠️ **Security Note**: These are basic rules for development. For production:
- Add proper authentication checks
- Implement admin role verification
- Add rate limiting
- Restrict write access appropriately

## Step 7: Verify Setup

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Check the browser console for any Firebase errors

3. Navigate to Admin Dashboard and try to load categories

4. Check Firestore Database in Firebase Console to see if collections are created

## Collections Structure

### categories
```javascript
{
  id: "food",
  name: "Food",
  description: "Food and nutrition expenses",
  defaultLimit: 1000
}
```

### beneficiaries
```javascript
{
  walletAddress: "0x...",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  location: "City, Country",
  disasterType: "Earthquake",
  verified: true,
  createdAt: Timestamp,
  categories: {
    "food": { limit: 1000, spent: 0 },
    "shelter": { limit: 2000, spent: 0 }
  }
}
```

### transactions
```javascript
{
  txHash: "0x...",
  from: "0x...",
  to: "0x...",
  amount: "500",
  category: "food",
  description: "Relief distribution",
  timestamp: Timestamp,
  blockNumber: 12345
}
```

## Troubleshooting

### Error: "Firebase: Error (auth/configuration-not-found)"
- Make sure `.env.local` file exists and has all required variables
- Restart the dev server after adding environment variables

### Error: "Permission denied"
- Check Firestore security rules
- Make sure you're using test mode or have proper authentication

### Collections not appearing
- Run the initialization script: `npm run init-firebase`
- Check Firebase Console → Firestore Database

## Next Steps

After Firebase setup:
1. ✅ Test category loading in Admin Dashboard
2. ✅ Test beneficiary creation
3. ✅ Test transaction recording
4. ✅ Verify audit trail is working

## Production Considerations

Before deploying to production:
1. Set up proper Firestore security rules
2. Enable Firebase Authentication (if needed)
3. Set up Firebase Hosting (optional)
4. Configure CORS if needed
5. Set up monitoring and alerts
6. Review and optimize Firestore indexes
