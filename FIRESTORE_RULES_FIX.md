# Fix Firestore Permission Error

## Problem
You're getting: `Missing or insufficient permissions`

This happens because Firestore security rules are blocking access.

## Quick Fix for Development

### Option 1: Test Mode (Easiest - 30 days)

1. Go to [Firebase Console - Firestore Rules](https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/rules)
   - Replace `YOUR_PROJECT_ID` with your actual Firebase project ID from `.env.local`
2. Replace ALL rules with this (allows all reads/writes for 30 days):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 2, 13);
    }
  }
}
```

3. Click **"Publish"**

⚠️ **Warning**: This allows anyone to read/write. Only use for development!

### Option 2: Development Rules (Recommended)

Use these rules that allow public access for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Categories - public read and write for development
    match /categories/{categoryId} {
      allow read, write: if true;
    }
    
    // Beneficiaries - public read and write for development
    match /beneficiaries/{beneficiaryId} {
      allow read, write: if true;
    }
    
    // Transactions - public read and write for development
    match /transactions/{transactionId} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

### Option 3: If Firestore is Not Enabled

If you haven't enabled Firestore yet:

1. Go to [Firebase Console](https://console.firebase.google.com/project/YOUR_PROJECT_ID)
   - Replace `YOUR_PROJECT_ID` with your actual Firebase project ID
2. Click **"Firestore Database"** in left sidebar
3. Click **"Create database"**
4. Select **"Start in test mode"**
5. Choose location
6. Click **"Enable"**

## Verify Fix

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Open Admin Dashboard
3. Check browser console - permission error should be gone
4. Categories should load automatically

## Production Rules (For Later)

When ready for production, use these secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.admin == true;
    }
    
    // Categories - public read, admin write
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Beneficiaries - authenticated read, admin write
    match /beneficiaries/{beneficiaryId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Transactions - public read, authenticated write
    match /transactions/{transactionId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Direct Link to Rules

[Click here to edit Firestore Rules](https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/rules)
   - Replace `YOUR_PROJECT_ID` with your actual Firebase project ID
