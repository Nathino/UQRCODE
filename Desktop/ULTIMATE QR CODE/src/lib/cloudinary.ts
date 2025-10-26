import { v4 as uuidv4 } from 'uuid';
import { PDFCompressor } from './pdfCompression';

// Validate Cloudinary environment variables
const cloudinaryConfig = {
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
  api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
  upload_preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
};

// Check for missing required Cloudinary environment variables
const requiredVars = ['cloud_name', 'api_key', 'api_secret', 'upload_preset'];
const missingRequiredVars = requiredVars
  .filter(key => !cloudinaryConfig[key as keyof typeof cloudinaryConfig])
  .map(key => `VITE_CLOUDINARY_${key.toUpperCase()}`);

if (missingRequiredVars.length > 0) {
  throw new Error(
    `Missing required Cloudinary environment variables: ${missingRequiredVars.join(', ')}\n` +
    'Please create a .env file with all required Cloudinary configuration variables.'
  );
}

// Note: upload_preset is REQUIRED and MUST be configured as UNSIGNED for public document access
// Create an unsigned upload preset in Cloudinary Dashboard > Settings > Upload
// and add VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name to your .env file
// Without an unsigned preset, documents will return 401 errors when accessed via QR codes

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
  private static async generateUploadSignature(timestamp: number, publicId: string, folder: string): Promise<string> {
    // For upload operations, Cloudinary expects: folder=value&public_id=value&timestamp=value
    const stringToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${cloudinaryConfig.api_secret}`;
    
    // Create SHA-1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * Generate a proper SHA-1 signature for Cloudinary API requests
   */
  private static async generateSHA1Signature(params: Record<string, any>): Promise<string> {
    // For destroy operations, Cloudinary expects specific parameter order
    // Based on the error message, it expects: public_id=value&timestamp=value
    const stringToSign = `public_id=${params.public_id}&timestamp=${params.timestamp}${cloudinaryConfig.api_secret}`;
    
    // Create SHA-1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * Upload a PDF file to Cloudinary with compression
   */
  static async uploadPDF(file: File, userId: string, compress: boolean = true): Promise<DocumentMetadata> {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    // Include folder in public_id for proper path structure with unsigned preset
    const publicId = `qr-documents/documents/${userId}/${timestamp}_${uniqueId}`;
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
      
      // Use upload preset if available (unsigned uploads for public access)
      if (cloudinaryConfig.upload_preset) {
        console.log('📤 Uploading with UNSIGNED preset:', cloudinaryConfig.upload_preset);
        formData.append('upload_preset', cloudinaryConfig.upload_preset);
        // Note: access_mode cannot be set here - it must be configured in the upload preset
        // If getting 401 errors, configure the preset to allow public access in Cloudinary dashboard
      } else {
        console.warn('⚠️ No upload preset found. Using signed upload (requires auth). This may cause 401 errors!');
        // Fallback to signed upload if no preset is configured
        formData.append('api_key', cloudinaryConfig.api_key);
        const signature = await this.generateUploadSignature(timestamp, publicId, 'qr-documents');
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
      }

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
      const timestamp = Math.round(Date.now() / 1000);
      
      // Prepare parameters for signature generation
      const params = {
        public_id: publicId,
        resource_type: 'raw',
        timestamp: timestamp
      };
      
      // Generate proper SHA-1 signature
      const signature = await this.generateSHA1Signature(params);
      
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
            timestamp: timestamp,
            api_key: cloudinaryConfig.api_key,
            signature: signature
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary delete failed:', response.status, response.statusText, errorText);
        return false;
      }

      const result = await response.json();
      return result.result === 'ok';
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
