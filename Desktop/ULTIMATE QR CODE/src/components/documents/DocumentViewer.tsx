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
        } else if (response.status === 401) {
          setError('Document access denied. This may be due to Cloudinary authentication issues.');
          setIsValidDocument(false);
        } else if (response.status === 404) {
          setError('Document not found. It may have been deleted or moved.');
          setIsValidDocument(false);
        } else {
          setError(`Document access failed (${response.status}). Please try again later.`);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Document Error</h2>
          <p className="text-white/70 mb-6">{error}</p>
          {onBack && (
            <Button
              onClick={onBack}
              className="bg-white text-blue-900 hover:bg-white/90"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <File className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white">
                  {documentName || 'Document Viewer'}
                </h1>
                <p className="text-white/70 text-sm sm:text-base">PDF Document</p>
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

          {/* Direct PDF Embedding */}
          <div className="bg-white/5 rounded-xl p-2 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Document Viewer
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleViewDocument}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-2 sm:px-4"
                >
                  <File className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Open Full View</span>
                </Button>
                <Button
                  onClick={handleDownload}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-2 sm:px-4"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            </div>
            
            {/* PDF Embed */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
              <iframe
                src={documentUrl}
                className="w-full h-[400px] sm:h-[600px] border-0"
                title={documentName || 'PDF Document'}
                onError={() => {
                  setError('Failed to load PDF. Please try downloading instead.');
                }}
              />
            </div>
          </div>

          <div className="text-center text-white/50 text-xs sm:text-sm space-y-1 sm:space-y-2">
            <p className="hidden sm:block truncate">Document URL: {documentUrl}</p>
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isValidDocument ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span className="text-xs">
                {isValidDocument ? 'Verified' : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
