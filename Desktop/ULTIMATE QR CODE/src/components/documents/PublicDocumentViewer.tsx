import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, File, AlertCircle, Loader } from 'lucide-react';

interface PublicDocumentViewerProps {
  documentId: string;
}

export function PublicDocumentViewer({ documentId }: PublicDocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<{
    url: string;
    name: string;
    isValid: boolean;
  } | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to find the document in any user's localStorage
        // This is a simplified approach - in production, you'd want a proper API
        let foundDocument = null;
        
        // Check localStorage for documents (this is a workaround for demo purposes)
        // In a real app, you'd have a public API endpoint
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('documents_')) {
            try {
              const documents = JSON.parse(localStorage.getItem(key) || '[]');
              const doc = documents.find((d: any) => d.id === documentId);
              if (doc) {
                foundDocument = doc;
                break;
              }
            } catch (e) {
              // Skip invalid entries
            }
          }
        }

        if (!foundDocument) {
          setError('Document not found or access denied');
          setIsLoading(false);
          return;
        }

        // Validate document URL
        const response = await fetch(foundDocument.url, { method: 'HEAD' });
        
        if (response.ok) {
          setDocument({
            url: foundDocument.url,
            name: foundDocument.originalName,
            isValid: true
          });
        } else if (response.status === 401) {
          setError('Document access denied. This document may be private.');
        } else if (response.status === 404) {
          setError('Document not found. It may have been deleted or moved.');
        } else {
          setError(`Document access failed (${response.status}). Please try again later.`);
        }
      } catch (err) {
        setError('Failed to load document. Please check the URL.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [documentId]);

  const handleDownload = () => {
    if (!document?.isValid) {
      setError('Cannot download invalid document');
      return;
    }
    
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.name || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewDocument = () => {
    if (!document?.isValid) {
      setError('Cannot view invalid document');
      return;
    }
    
    window.open(document.url, '_blank');
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
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-white text-purple-900 hover:bg-white/90"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Home
          </Button>
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
                  {document?.name || 'Document Viewer'}
                </h1>
                <p className="text-white/70">PDF Document</p>
              </div>
            </div>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center mb-4">
              <File className="w-16 h-16 text-white/50" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">
              Document Ready
            </h3>
            <p className="text-white/70 text-center mb-6">
              This document was accessed via QR code. Click the buttons below to view or download it.
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
            <p>Document accessed via QR code scan</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs">Document verified and accessible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
