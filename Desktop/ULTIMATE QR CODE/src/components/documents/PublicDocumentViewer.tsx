import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, File, AlertCircle, Loader } from 'lucide-react';
import { PublicDocumentRegistry } from '@/lib/publicDocumentRegistry';
import { QRCodeStorage } from '@/lib/qrStorage';
import { QRCodeFirestore } from '@/lib/qrCodeFirestore';
import { ScanTracker } from '@/lib/scanTracker';

interface PublicDocumentViewerProps {
  documentId: string;
}

export function PublicDocumentViewer({ documentId }: PublicDocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<{
    url: string;
    name: string;
    isValid: boolean;
  } | null>(null);
  
  const shouldDirectOpenOnMobile = () => {
    const ua = navigator.userAgent || navigator.vendor;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isMobile = isIOS || isAndroid;
    return isMobile;
  };

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to find the document in the public registry FIRST
        const publicDocument = PublicDocumentRegistry.getPublicDocument(documentId);
        
        // If found in registry, use the stored metadata (includes the real filename)
        if (publicDocument) {
          // Update access time for analytics
          PublicDocumentRegistry.updateAccessTime(documentId);
          
          // Track scan count - find the QR code that points to this document
          const userId = publicDocument.documentMetadata.userId;
          if (userId) {
            try {
              // Find the QR code that points to this document
              const qrCode = await QRCodeFirestore.findQRCodeByDocumentId(documentId, userId);
              if (qrCode) {
                // Track scan with proper QR code ID
                await QRCodeStorage.incrementScanCount(userId, qrCode.id);
                // Also store detailed scan event in Firestore
                await ScanTracker.trackScan(qrCode.id, userId, {
                  documentId: documentId
                });
              }
            } catch (error) {
              console.error('Error tracking document scan:', error);
            }
          }
          
          // Check if there's a direct URL parameter (from QR code)
          const urlParams = new URLSearchParams(window.location.search);
          const directUrl = urlParams.get('url');
          
          // Use direct URL if available, otherwise use stored URL
          const urlToUse = directUrl || publicDocument.documentMetadata.url;
          
          // Validate the document URL is still accessible
          try {
            const response = await fetch(urlToUse, { method: 'HEAD' });
            if (response.ok) {
              const doc = {
                url: urlToUse,
                name: publicDocument.documentMetadata.originalName,
                isValid: true
              } as const;
              setDocumentData(doc);
              // On mobile, open directly in the native PDF viewer to avoid forced download prompts
              if (shouldDirectOpenOnMobile()) {
                window.location.replace(doc.url);
                return;
              }
              setIsLoading(false);
              return;
            }
          } catch (e) {
            // If validation fails, continue to error
          }
        }
        
        // Fallback: If no registry entry, check for direct URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const directUrl = urlParams.get('url');
        
        if (directUrl) {
          try {
            const response = await fetch(directUrl, { method: 'HEAD' });
            if (response.ok) {
              // Extract filename from URL if possible
              const filename = directUrl.split('/').pop() || 'document.pdf';
              const doc = {
                url: directUrl,
                name: filename,
                isValid: true
              } as const;
              setDocumentData(doc);
              if (shouldDirectOpenOnMobile()) {
                window.location.replace(doc.url);
                return;
              }
              setIsLoading(false);
              return;
            }
          } catch (e) {
            // If direct URL fails, continue to error
          }
        }

        // If not found in public registry, show error
        setError('Document not found. The document may have been deleted, moved, or is not publicly accessible.');
      } catch (err) {
        setError('Failed to load document. Please check the URL.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [documentId]);

  const handleDownload = () => {
    if (!documentData?.isValid) {
      setError('Cannot download invalid document');
      return;
    }
    
    const link = document.createElement('a');
    link.href = documentData.url;
    link.download = documentData.name || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-white text-blue-900 hover:bg-white/90"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 sm:p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="flex min-w-0 items-center space-x-2 sm:space-x-3">
              <File className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
                  {documentData?.name || 'Document Viewer'}
                </h1>
                <p className="text-white/70 text-sm sm:text-base">PDF Document</p>
              </div>
            </div>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </div>

          {/* Direct PDF Embedding */}
          <div className="bg-white/5 rounded-xl p-2 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Document Viewer
              </h3>
              <div className="flex gap-2">
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
                src={documentData?.url}
                className="w-full h-[400px] sm:h-[600px] border-0"
                title={documentData?.name || 'PDF Document'}
                onError={() => {
                  setError('Failed to load PDF. Please try downloading instead.');
                }}
              />
            </div>
          </div>

          <div className="text-center text-white/50 text-xs sm:text-sm space-y-1 sm:space-y-2">
            <p className="hidden sm:block">Document accessed via QR code scan</p>
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400"></div>
              <span className="text-xs">Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
