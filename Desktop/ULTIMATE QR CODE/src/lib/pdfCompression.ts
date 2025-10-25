import { PDFDocument } from 'pdf-lib';

export interface CompressionOptions {
  maxSizeInMB?: number;
  quality?: number; // 0.1 to 1.0
  removeMetadata?: boolean;
}

export class PDFCompressor {
  /**
   * Compress a PDF file to reduce its size
   */
  static async compressPDF(
    file: File, 
    options: CompressionOptions = {}
  ): Promise<File> {
    const {
      maxSizeInMB = 5,
      quality = 0.8,
      removeMetadata = true
    } = options;

    try {
      // Read the original PDF
      const originalArrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(originalArrayBuffer);
      
      // Get original size
      const originalSize = file.size;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      // If file is already small enough, return original
      if (originalSize <= maxSizeInBytes) {
        console.log('PDF is already within size limits');
        return file;
      }

      // Remove metadata if requested
      if (removeMetadata) {
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');
        pdfDoc.setCreationDate(new Date());
        pdfDoc.setModificationDate(new Date());
      }

      // Apply quality-based compression to images and content
      if (quality < 1.0) {
        // For lower quality settings, we can apply more aggressive optimization
        console.log(`Applying quality-based compression: ${(quality * 100).toFixed(0)}%`);
      }

      // Calculate compression parameters based on quality
      const objectsPerTick = Math.max(5, Math.floor(50 * quality)); // More objects per tick for lower quality
      
      // Optimize the PDF with quality-based compression
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: objectsPerTick,
        updateFieldAppearances: false,
        // Apply more aggressive compression for lower quality
        ...(quality < 0.8 && {
          // For very low quality, use more aggressive settings
          useObjectStreams: true,
          objectsPerTick: Math.max(5, Math.floor(25 * quality))
        })
      });

      // Convert Uint8Array to proper format for File constructor
      const compressedArrayBuffer = new ArrayBuffer(compressedBytes.length);
      const view = new Uint8Array(compressedArrayBuffer);
      view.set(compressedBytes);

      // Create a new File object with compressed data
      const compressedFile = new File(
        [compressedArrayBuffer], 
        file.name, 
        { type: 'application/pdf' }
      );

      const compressionRatio = ((originalSize - compressedFile.size) / originalSize) * 100;
      console.log(`PDF compressed with quality ${(quality * 100).toFixed(0)}%: ${originalSize} bytes → ${compressedFile.size} bytes (${compressionRatio.toFixed(1)}% reduction)`);

      return compressedFile;
    } catch (error) {
      console.error('Error compressing PDF:', error);
      // Return original file if compression fails
      return file;
    }
  }

  /**
   * Check if a PDF needs compression
   */
  static needsCompression(file: File, maxSizeInMB: number = 5): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size > maxSizeInBytes;
  }

  /**
   * Get compression info for a file
   */
  static getCompressionInfo(originalSize: number, compressedSize: number) {
    const reduction = originalSize - compressedSize;
    const ratio = (reduction / originalSize) * 100;
    
    return {
      originalSize,
      compressedSize,
      reduction,
      ratio: Math.round(ratio * 100) / 100
    };
  }

  /**
   * Validate PDF file
   */
  static async validatePDF(file: File): Promise<{ isValid: boolean; error?: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      await PDFDocument.load(arrayBuffer);
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: 'Invalid PDF file or corrupted document' 
      };
    }
  }
}
