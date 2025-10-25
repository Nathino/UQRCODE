import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, File, AlertCircle, Loader } from 'lucide-react';

interface DocumentViewerProps {
  documentUrl: string;
  documentName?: string;
  onBack?: () => void;
}

export function DocumentViewer({ documentUrl, documentName, onBack }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidDocument, setIsValidDocument] = useState(false);

  useEffect(() => {
    const checkDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate Cloudinary URL format first
        const isValidCloudinaryUrl = documentUrl.includes('cloudinary.com');
        
        if (!isValidCloudinaryUrl) {
          console.warn('Document URL does not appear to be from Cloudinary');
        }

        // Check if the document URL is accessible
        const response = await fetch(documentUrl, { method: 'HEAD' });
        
        if (response.ok) {
          setIsValidDocument(true);
          console.log('Document is accessible and valid');
        } else {
          setError('Document not found or access denied');
          setIsValidDocument(false);
        }
      } catch (err) {
        setError('Failed to load document. Please check the URL.');
        setIsValidDocument(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDocument();
  }, [documentUrl]);

  const handleDownload = () => {
    if (!isValidDocument) {
      setError('Cannot download invalid document');
      return;
    }
    
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentName || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewDocument = () => {
    if (!isValidDocument) {
      setError('Cannot view invalid document');
      return;
    }
    
    window.open(documentUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-teal-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl text-center">
          <Loader className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Document</h2>
          <p className="text-white/70">Please wait while we verify the document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-teal-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Document Error</h2>
          <p className="text-white/70 mb-6">{error}</p>
          {onBack && (
            <Button
              onClick={onBack}
              className="bg-white text-purple-900 hover:bg-white/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-teal-800">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <File className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {documentName || 'Document Viewer'}
                </h1>
                <p className="text-white/70">PDF Document</p>
              </div>
            </div>
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center mb-4">
              <File className="w-16 h-16 text-white/50" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">
              {isValidDocument ? 'Document Ready' : 'Document Status Unknown'}
            </h3>
            <p className="text-white/70 text-center mb-6">
              {isValidDocument 
                ? 'Your document is ready to view. Click the buttons below to access it.'
                : 'Document status could not be verified. You can still try to access it.'
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleViewDocument}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <File className="w-4 h-4 mr-2" />
                View Document
              </Button>
              
              <Button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="text-center text-white/50 text-sm space-y-2">
            <p>Document URL: {documentUrl}</p>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isValidDocument ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span className="text-xs">
                {isValidDocument ? 'Document verified' : 'Status unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
