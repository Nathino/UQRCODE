# Cloudinary Setup Instructions

## 1. Create a Cloudinary Account
1. Go to [Cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. You'll get 25GB free storage and 25GB bandwidth per month

## 2. Get Your Cloudinary Credentials
1. Log into your Cloudinary dashboard
2. Go to the "Dashboard" section
3. Copy your:
   - Cloud Name
   - API Key
   - API Secret

## 2.1. Create an Upload Preset
1. In your Cloudinary dashboard, go to "Settings" → "Upload"
2. Scroll down to "Upload presets" section
3. Click "Add upload preset"
4. Configure the preset:
   - **Preset name**: `qr-documents-upload` (or any name you prefer)
   - **Signing Mode**: Select "Unsigned" (for client-side uploads)
   - **Folder**: `qr-documents` (optional, already handled in code)
   - **Resource Type**: `Raw` (for PDF files)
5. Click "Save" and copy the preset name

## 3. Configure Environment Variables
Create a `.env` file in your project root with:

```env
# Firebase Configuration (REQUIRED)
# Get these from Firebase Console > Project Settings > General
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# Cloudinary Configuration (REQUIRED)
# Get these from Cloudinary Dashboard
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key_here
VITE_CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
# Cloudinary Upload Preset (OPTIONAL but RECOMMENDED)
# Create an upload preset in Cloudinary Dashboard > Settings > Upload
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name_here
```

**⚠️ IMPORTANT**: The core Cloudinary environment variables (cloud_name, api_key, api_secret) are **REQUIRED**. The upload_preset is **OPTIONAL** but **RECOMMENDED** for better security.

## 4. Features Included
- PDF document upload with **automatic compression**
- QR code generation for documents
- Document management dashboard
- Secure document access
- File size validation (10MB limit)
- **PDF compression** (up to 80% size reduction)
- Document deletion
- **Secure Firebase configuration** via environment variables

## 5. Usage
1. Register/Login to your account
2. Click "Manage Documents" to upload PDFs
3. Generate QR codes for your documents
4. Share QR codes for document access

## 6. Security
- Documents are stored securely in Cloudinary
- Each user can only access their own documents
- QR codes link directly to document URLs
- No server-side storage required
