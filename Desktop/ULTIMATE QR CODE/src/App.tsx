import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LoginForm } from './components/auth/LoginForm';
import { QRGenerator } from './components/qr/QRGenerator';
import { DocumentViewer } from './components/documents/DocumentViewer';
import { LoadingSpinner } from './components/ui/loading';
import { AuthLayout } from './components/layout/AuthLayout';
import { SplashScreen } from './components/ui/SplashScreen';
import { useState, useEffect } from 'react';
import { DocumentMetadata } from './lib/cloudinary';

export default function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'generator' | 'document'>('generator');
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);

  const handleSignOut = () => {
    signOut(auth);
  };

  // Check URL for document viewing
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/document/')) {
      const documentId = path.split('/document/')[1];
      if (documentId && user) {
        // Load document from localStorage
        const savedDocuments = localStorage.getItem(`documents_${user.uid}`);
        if (savedDocuments) {
          const documents: DocumentMetadata[] = JSON.parse(savedDocuments);
          const document = documents.find(doc => doc.id === documentId);
          if (document) {
            setSelectedDocument(document);
            setCurrentView('document');
          }
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

  if (!user) {
    return (
      <>
        <SplashScreen />
        <LoginForm />
      </>
    );
  }

  if (currentView === 'document' && selectedDocument) {
    return (
      <DocumentViewer
        documentUrl={selectedDocument.url}
        documentName={selectedDocument.originalName}
        onBack={handleBackToGenerator}
      />
    );
  }

  return (
    <AuthLayout onSignOut={handleSignOut}>
      <QRGenerator />
    </AuthLayout>
  );
}