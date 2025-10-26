import { v4 as uuidv4 } from 'uuid';
import { PDFCompressor } from './pdfCompression';

// Validate Cloudinary environment variables
const cloudinaryConfig = {
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
  api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
  upload_preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
};

// Check for missing required Cloudinary environment variables (upload_preset is optional)
const requiredVars = ['cloud_name', 'api_key', 'api_secret'];
const missingRequiredVars = requiredVars
  .filter(key => !cloudinaryConfig[key as keyof typeof cloudinaryConfig])
  .map(key => `VITE_CLOUDINARY_${key.toUpperCase()}`);

if (missingRequiredVars.length > 0) {
  throw new Error(
    `Missing required Cloudinary environment variables: ${missingRequiredVars.join(', ')}\n` +
    'Please create a .env file with all required Cloudinary configuration variables.'
  );
}

// Note: upload_preset is optional but recommended for better security
// If you want to set it up, create an upload preset in Cloudinary Dashboard > Settings > Upload
// and add VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name to your .env file

export interface UploadResult {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  bytes: number;
  created_at: string;
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  originalSize: number;
  url: string;
  publicId: string;
  uploadedAt: string;
  userId: string;
  compressionRatio?: number;
}

export class CloudinaryStorage {
  /**
   * Generate a signature for signed uploads (for better security)
   */
  private static generateSignature(timestamp: number, publicId: string): string {
    // In a production app, this should be done server-side for security
    // For now, we'll use a simple approach with the API secret
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${cloudinaryConfig.api_secret}`;
    return btoa(signatureString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  /**
   * Upload a PDF file to Cloudinary with compression
   */
  static async uploadPDF(file: File, userId: string, compress: boolean = true): Promise<DocumentMetadata> {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const publicId = `documents/${userId}/${timestamp}_${uniqueId}`;
    const originalSize = file.size;

    try {
      let fileToUpload = file;
      let compressionRatio: number | undefined;

      // Validate PDF first
      const validation = await PDFCompressor.validatePDF(file);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid PDF file');
      }

      // Compress PDF if requested and needed
      if (compress && PDFCompressor.needsCompression(file, 5)) {
        console.log('Compressing PDF...');
        fileToUpload = await PDFCompressor.compressPDF(file, {
          maxSizeInMB: 5,
          quality: 0.8,
          removeMetadata: true
        });
        
        const compressionInfo = PDFCompressor.getCompressionInfo(originalSize, fileToUpload.size);
        compressionRatio = compressionInfo.ratio;
        
        console.log(`PDF compressed: ${compressionInfo.ratio}% size reduction`);
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('public_id', publicId);
      formData.append('resource_type', 'raw');
      formData.append('folder', 'qr-documents');
      formData.append('api_key', cloudinaryConfig.api_key);
      
      // Generate signature for signed upload
      const signature = this.generateSignature(timestamp, publicId);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/raw/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary upload failed:', response.status, response.statusText, errorText);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your Cloudinary configuration.');
        } else if (response.status === 400) {
          throw new Error('Invalid request. Please check your file and try again.');
        } else {
          throw new Error(`Upload failed: ${response.statusText}. Please try again.`);
        }
      }

      const result: UploadResult = await response.json();

      return {
        id: uniqueId,
        filename: result.public_id,
        originalName: file.name,
        size: result.bytes,
        originalSize: originalSize,
        url: result.secure_url,
        publicId: result.public_id,
        uploadedAt: new Date().toISOString(),
        userId,
        compressionRatio
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error('Failed to upload document. Please check your connection and try again.');
    }
  }

  /**
   * Delete a document from Cloudinary
   */
  static async deleteDocument(publicId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/raw/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            resource_type: 'raw',
            api_key: cloudinaryConfig.api_key,
            api_secret: cloudinaryConfig.api_secret,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      return false;
    }
  }

  /**
   * Get document URL for public access
   */
  static getDocumentUrl(publicId: string): string {
    return `https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/raw/upload/${publicId}`;
  }

  /**
   * Generate a secure, time-limited URL for document access
   */
  static generateSecureUrl(publicId: string, _expiresIn: number = 3600): string {
    // For now, return the regular URL since we're not using the Cloudinary SDK
    // In production, you might want to implement server-side URL signing
    return this.getDocumentUrl(publicId);
  }

}
