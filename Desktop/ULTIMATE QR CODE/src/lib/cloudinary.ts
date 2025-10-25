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
      
      // Add upload_preset if available
      if (cloudinaryConfig.upload_preset) {
        formData.append('upload_preset', cloudinaryConfig.upload_preset);
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/raw/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        console.error('Cloudinary upload failed:', response.status, response.statusText);
        throw new Error('Failed to upload document. Please try again.');
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
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/image/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            resource_type: 'raw',
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
