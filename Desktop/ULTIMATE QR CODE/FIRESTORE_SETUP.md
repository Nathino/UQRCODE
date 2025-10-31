# Firestore Setup Instructions

## Why You're Seeing 400 Errors

The 400 errors from Firestore indicate that:
1. **Firestore security rules are not configured**, OR
2. **Firestore database is not enabled in your Firebase project**

## Quick Fix - Set Up Firestore

### Step 1: Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`ultimateqrcode`)
3. Click **"Firestore Database"** in the left menu
4. Click **"Create database"**
5. Choose **"Start in test mode"** (we'll add security rules next)
6. Select a location closest to your users
7. Click **"Enable"**

### Step 2: Configure Security Rules

1. In Firestore Database, click on the **"Rules"** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Documents collection - users can only access their own documents
    match /documents/{documentId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == request.resource.data.userId);
    }
    
    // QR codes collection - users can only access their own QR codes
    match /qr_codes/{qrCodeId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == request.resource.data.userId);
    }
  }
}
```

3. Click **"Publish"**

### Step 3: Verify Setup

After enabling Firestore and setting security rules:
- The 400 errors should stop
- Real-time subscriptions will work
- Your documents and QR codes will persist

## What the Code Does

The updated code now:
- ✅ **Gracefully handles subscription errors** - falls back to one-time reads
- ✅ **Won't crash if Firestore isn't configured** - uses localStorage as fallback
- ✅ **Works even if subscriptions fail** - one-time reads still function

## Important Notes

- **Free Tier**: Firestore free tier includes 50K reads/day and 20K writes/day - more than enough for this app
- **No Blaze Plan Required**: You're using Firestore (database), not Firebase Storage (files)
- **Cloudinary Still Used**: PDF files are still stored in Cloudinary (free 25GB), not Firebase

The app will continue to work even if you don't set up Firestore immediately - it will just use localStorage instead. But setting up Firestore will enable persistence across devices and sessions.

