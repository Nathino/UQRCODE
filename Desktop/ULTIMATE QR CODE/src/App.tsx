import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LoginForm } from './components/auth/LoginForm';
import { QRGenerator } from './components/qr/QRGenerator';
import { DocumentViewer } from './components/documents/DocumentViewer';
import { PublicDocumentViewer } from './components/documents/PublicDocumentViewer';
import { LoadingSpinner } from './components/ui/loading';
import { AuthLayout } from './components/layout/AuthLayout';
import { SplashScreen } from './components/ui/SplashScreen';
import { useState, useEffect } from 'react';
import { DocumentMetadata } from './lib/cloudinary';

export default function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'generator' | 'document' | 'public-document'>('generator');
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
  const [publicDocumentId, setPublicDocumentId] = useState<string | null>(null);

  const handleSignOut = () => {
    signOut(auth);
  };

  // Check URL for document viewing
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/document/')) {
      const documentId = path.split('/document/')[1];
      if (documentId) {
        if (user) {
          // Authenticated user - use private document viewer
          const savedDocuments = localStorage.getItem(`documents_${user.uid}`);
          if (savedDocuments) {
            const documents: DocumentMetadata[] = JSON.parse(savedDocuments);
            const document = documents.find(doc => doc.id === documentId);
            if (document) {
              setSelectedDocument(document);
              setCurrentView('document');
            }
          }
        } else {
          // Unauthenticated user (QR code scanner) - use public document viewer
          setPublicDocumentId(documentId);
          setCurrentView('public-document');
        }
      }
    }
  }, [user]);

  const handleBackToGenerator = () => {
    setCurrentView('generator');
    setSelectedDocument(null);
    window.history.pushState({}, '', '/');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Handle public document access (no authentication required)
  if (currentView === 'public-document' && publicDocumentId) {
    return <PublicDocumentViewer documentId={publicDocumentId} />;
  }

  // Handle authenticated document access
  if (currentView === 'document' && selectedDocument) {
    return (
      <DocumentViewer
        documentUrl={selectedDocument.url}
        documentName={selectedDocument.originalName}
        onBack={handleBackToGenerator}
      />
    );
  }

  // Show login form for unauthenticated users
  if (!user) {
    return (
      <>
        <SplashScreen />
        <LoginForm />
      </>
    );
  }

  // Show main app for authenticated users
  return (
    <AuthLayout onSignOut={handleSignOut}>
      <QRGenerator />
    </AuthLayout>
  );
}