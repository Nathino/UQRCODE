import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PDFUpload } from './PDFUpload';
import { DocumentMetadata } from '@/lib/cloudinary';
import { File, Download, Trash2, QrCode, Eye } from 'lucide-react';
import { CloudinaryStorage } from '@/lib/cloudinary';

interface DocumentDashboardProps {
  userId: string;
  onDocumentSelect: (document: DocumentMetadata) => void;
}

export function DocumentDashboard({ userId, onDocumentSelect }: DocumentDashboardProps) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load documents from localStorage (in a real app, this would be from a database)
  useEffect(() => {
    const savedDocuments = localStorage.getItem(`documents_${userId}`);
    if (savedDocuments) {
      setDocuments(JSON.parse(savedDocuments));
    }
  }, [userId]);

  const handleUploadSuccess = (document: DocumentMetadata) => {
    const newDocuments = [...documents, document];
    setDocuments(newDocuments);
    localStorage.setItem(`documents_${userId}`, JSON.stringify(newDocuments));
  };

  const handleDeleteDocument = async (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    setIsLoading(true);
    try {
      const success = await CloudinaryStorage.deleteDocument(document.publicId);
      if (success) {
        const updatedDocuments = documents.filter(doc => doc.id !== documentId);
        setDocuments(updatedDocuments);
        localStorage.setItem(`documents_${userId}`, JSON.stringify(updatedDocuments));
        
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(null);
        }
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQR = (document: DocumentMetadata) => {
    setSelectedDocument(document);
    onDocumentSelect(document);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Upload New Document</h2>
        <PDFUpload onUploadSuccess={handleUploadSuccess} userId={userId} />
      </div>

      {documents.length > 0 && (
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className={`bg-white/10 rounded-lg p-4 border transition-colors ${
                  selectedDocument?.id === document.id
                    ? 'border-blue-400 bg-blue-500/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <File className="w-5 h-5 text-white" />
                    <span className="text-white font-medium truncate">
                      {document.originalName}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-white/70">
                  <p>Size: {formatFileSize(document.size)}</p>
                  {document.originalSize && document.originalSize !== document.size && (
                    <p className="text-blue-300">
                      Original: {formatFileSize(document.originalSize)} 
                      {document.compressionRatio && (
                        <span className="ml-1">({document.compressionRatio.toFixed(1)}% compressed)</span>
                      )}
                    </p>
                  )}
                  <p>Uploaded: {formatDate(document.uploadedAt)}</p>
                </div>

                <div className="flex space-x-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateQR(document)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  >
                    <QrCode className="w-4 h-4 mr-1" />
                    Generate QR
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => window.open(document.url, '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleDeleteDocument(document.id)}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && (
        <div className="bg-white/5 rounded-xl p-8 text-center">
          <File className="w-12 h-12 text-white/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Documents Yet</h3>
          <p className="text-white/70">
            Upload your first PDF document to get started with QR code generation.
          </p>
        </div>
      )}
    </div>
  );
}
