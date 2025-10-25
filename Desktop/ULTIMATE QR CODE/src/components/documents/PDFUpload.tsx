import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { CloudinaryStorage, DocumentMetadata } from '@/lib/cloudinary';

interface PDFUploadProps {
  onUploadSuccess: (document: DocumentMetadata) => void;
  userId: string;
  maxSizeInMB?: number;
}

export function PDFUpload({ onUploadSuccess, userId, maxSizeInMB = 10 }: PDFUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<{ originalSize: number; compressedSize: number; ratio: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Please upload a PDF file only';
    }

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `File size must be less than ${maxSizeInMB}MB`;
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      const document = await CloudinaryStorage.uploadPDF(file, userId, true);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Show compression info if available
      if (document.compressionRatio && document.compressionRatio > 0) {
        setCompressionInfo({
          originalSize: document.originalSize,
          compressedSize: document.size,
          ratio: document.compressionRatio
        });
      }
      
      setSuccess('Document uploaded successfully!');
      onUploadSuccess(document);
      
      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      fileInputRef.current.files = event.dataTransfer.files;
      handleFileSelect({ target: { files: [file] } } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleClear = () => {
    setError(null);
    setSuccess(null);
    setCompressionInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isUploading
            ? 'border-blue-400 bg-blue-50/10'
            : 'border-white/20 hover:border-white/40'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-white/10 rounded-full">
            <Upload className="w-8 h-8 text-white" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Upload PDF Document
            </h3>
            <p className="text-white/70 text-sm mb-4">
              Drag and drop your PDF file here, or click to browse
            </p>
            <p className="text-white/50 text-xs">
              Maximum file size: {maxSizeInMB}MB
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-white text-purple-900 hover:bg-white/90"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Choose PDF File'}
            </Button>
            
            {(error || success || compressionInfo) && (
              <Button
                onClick={handleClear}
                disabled={isUploading}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </div>

        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-white/70 text-sm mt-2">
              Uploading... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center justify-center text-red-400 bg-red-400/10 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center justify-center text-green-400 bg-green-400/10 p-3 rounded-lg">
            <CheckCircle className="w-4 h-4 mr-2" />
            {success}
          </div>
        )}

        {compressionInfo && (
          <div className="mt-4 bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">📦 Compression Applied</h4>
            <div className="text-sm text-blue-300 space-y-1">
              <p>Original Size: {(compressionInfo.originalSize / 1024 / 1024).toFixed(2)} MB</p>
              <p>Compressed Size: {(compressionInfo.compressedSize / 1024 / 1024).toFixed(2)} MB</p>
              <p className="font-semibold">Size Reduction: {compressionInfo.ratio.toFixed(1)}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
