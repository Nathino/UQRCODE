import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, File, AlertCircle, Loader } from 'lucide-react';
import { PublicDocumentRegistry } from '@/lib/publicDocumentRegistry';
import { QRCodeStorage } from '@/lib/qrStorage';
import { QRCodeFirestore } from '@/lib/qrCodeFirestore';
import { ScanTracker } from '@/lib/scanTracker';
import { DocumentStorage } from '@/lib/documentStorage';

interface PublicDocumentViewerProps {
  documentId: string;
}

export function PublicDocumentViewer({ documentId }: PublicDocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    documentId: string;
    urlParam: string | null;
    fullUrl: string;
    registryFound: boolean;
    firestoreError: string | null;
    step: string;
  } | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
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
      // Get URL parameters at the start
      const urlParams = new URLSearchParams(window.location.search);
      const directUrl = urlParams.get('url');
      const fullUrl = window.location.href;
      
      // Prepare error details function (available throughout the function)
      const prepareErrorDetails = (message: string, step: string, firestoreError: string | null = null) => {
        const registryCheck = PublicDocumentRegistry.getPublicDocument(documentId);
        setErrorDetails({
          message,
          documentId,
          urlParam: directUrl,
          fullUrl,
          registryFound: !!registryCheck,
          firestoreError,
          step
        });
      };
      
      try {
        setIsLoading(true);
        setError(null);
        setErrorDetails(null);
        setShowDebugInfo(false);

        // STEP 1: Check for URL parameter first (from QR code - most reliable)
        console.log('Loading document:', { documentId, directUrl, fullUrl, searchParams: window.location.search });
        
        // Check if documentId looks truncated (UUIDs are typically 36 chars with dashes)
        if (documentId.length < 20) {
          console.warn('Document ID appears to be truncated:', documentId, 'Full URL:', fullUrl);
          // Try to extract full document ID from URL if possible
          const urlMatch = fullUrl.match(/\/document\/([^/?]+)/);
          if (urlMatch && urlMatch[1].length > documentId.length) {
            console.log('Found longer document ID in URL:', urlMatch[1]);
            // Note: We can't change documentId prop, but we can use it for Firestore lookup
          }
        }
        
        if (directUrl) {
          // Decode the URL parameter (it might be encoded)
          let decodedUrl = directUrl;
          try {
            decodedUrl = decodeURIComponent(directUrl);
          } catch (e) {
            console.log('URL parameter decoding failed, using as-is:', e);
          }
          // Use the URL parameter directly - it's from the QR code, so we trust it
          // Extract filename from URL if possible, or use a default
          const filename = decodedUrl.split('/').pop()?.split('?')[0] || 'document.pdf';
          
          // Try to get better metadata from registry or Firestore
          let documentName = filename;
          let userId: string | null = null;
          
          // Check local registry for metadata
          const publicDocument = PublicDocumentRegistry.getPublicDocument(documentId);
          if (publicDocument) {
            documentName = publicDocument.documentMetadata.originalName || filename;
            userId = publicDocument.documentMetadata.userId || null;
          } else {
            // Try to fetch from Firestore (might fail if unauthenticated, but worth trying)
            try {
              const firestoreDoc = await DocumentStorage.getDocument(documentId);
              if (firestoreDoc) {
                documentName = firestoreDoc.originalName || filename;
                userId = firestoreDoc.userId || null;
                // Also register it locally for future use
                PublicDocumentRegistry.registerPublicDocument(firestoreDoc);
              }
            } catch (firestoreError: any) {
              // Firestore access might fail if user is not authenticated - that's okay
              const errorMsg = firestoreError?.message || String(firestoreError);
              console.log('Could not fetch document from Firestore (may require auth):', firestoreError);
              prepareErrorDetails(
                `Firestore access failed: ${errorMsg}`,
                'STEP 1: URL Parameter - Firestore metadata fetch',
                errorMsg
              );
            }
          }
          
          // Track scan if we have userId
          if (userId) {
            try {
              const qrCode = await QRCodeFirestore.findQRCodeByDocumentId(documentId, userId);
              if (qrCode) {
                await QRCodeStorage.incrementScanCount(userId, qrCode.id);
                await ScanTracker.trackScan(qrCode.id, userId, {
                  documentId: documentId
                });
              }
            } catch (trackError) {
              console.error('Error tracking document scan:', trackError);
            }
          }
          
          // Set document data and proceed
          const doc = {
            url: decodedUrl,
            name: documentName,
            isValid: true
          } as const;
          setDocumentData(doc);
          console.log('Document loaded from URL parameter:', doc);
          
          // On mobile, open directly in the native PDF viewer
          if (shouldDirectOpenOnMobile()) {
            window.location.replace(doc.url);
            return;
          }
          
          setIsLoading(false);
          return;
        }

        // STEP 2: Check local registry (for same-device access)
        const publicDocument = PublicDocumentRegistry.getPublicDocument(documentId);
        
        if (publicDocument) {
          // Update access time for analytics
          PublicDocumentRegistry.updateAccessTime(documentId);
          
          // Track scan count
          const userId = publicDocument.documentMetadata.userId;
          if (userId) {
            try {
              const qrCode = await QRCodeFirestore.findQRCodeByDocumentId(documentId, userId);
              if (qrCode) {
                await QRCodeStorage.incrementScanCount(userId, qrCode.id);
                await ScanTracker.trackScan(qrCode.id, userId, {
                  documentId: documentId
                });
              }
            } catch (error) {
              console.error('Error tracking document scan:', error);
            }
          }
          
          const urlToUse = publicDocument.documentMetadata.url;
          const doc = {
            url: urlToUse,
            name: publicDocument.documentMetadata.originalName,
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

        // STEP 3: Try to fetch from Firestore (CRITICAL for old QR codes without ?url= parameter)
        // This is the fallback when URL parameter is missing (old QR codes or truncated URLs)
        
        // If documentId looks truncated (UUIDs should be 36 chars), try to extract from full URL
        let documentIdToUse = documentId;
        if (documentId.length < 30) {
          console.warn('Document ID appears truncated, attempting to extract from URL');
          const urlMatch = fullUrl.match(/\/document\/([^/?]+)/);
          if (urlMatch && urlMatch[1] && urlMatch[1].length > documentId.length) {
            documentIdToUse = urlMatch[1];
            console.log('Using longer document ID from URL:', documentIdToUse);
          }
        }
        
        try {
          console.log('Attempting to fetch document from Firestore:', { 
            originalId: documentId, 
            usingId: documentIdToUse,
            idLength: documentIdToUse.length,
            expectedLength: 36 // UUID v4 length
          });
          
          const firestoreDoc = await DocumentStorage.getDocument(documentIdToUse);
          
          if (firestoreDoc) {
            console.log('Document found in Firestore:', firestoreDoc);
            
            // Register it locally for future use
            PublicDocumentRegistry.registerPublicDocument(firestoreDoc);
            
            // Track scan (use documentIdToUse which might be the corrected ID)
            const userId = firestoreDoc.userId;
            if (userId) {
              try {
                // Try with both IDs in case the QR code was saved with truncated ID
                const qrCode = await QRCodeFirestore.findQRCodeByDocumentId(documentIdToUse, userId) ||
                              await QRCodeFirestore.findQRCodeByDocumentId(documentId, userId);
                if (qrCode) {
                  await QRCodeStorage.incrementScanCount(userId, qrCode.id);
                  await ScanTracker.trackScan(qrCode.id, userId, {
                    documentId: firestoreDoc.id // Use the actual document ID from Firestore
                  });
                }
              } catch (error) {
                console.error('Error tracking document scan:', error);
              }
            }
            
            // Use the Cloudinary URL directly from Firestore
            const doc = {
              url: firestoreDoc.url,
              name: firestoreDoc.originalName,
              isValid: true
            } as const;
            setDocumentData(doc);
            console.log('Document loaded from Firestore successfully:', doc);
            
            if (shouldDirectOpenOnMobile()) {
              window.location.replace(doc.url);
              return;
            }
            
            setIsLoading(false);
            return;
          } else {
            console.log('Document not found in Firestore with ID:', documentIdToUse);
            
            // Check if ID is truncated
            const isTruncated = documentIdToUse.length < 30;
            const errorMessage = isTruncated 
              ? `Document ID is TRUNCATED (${documentIdToUse.length} chars instead of 36). This QR code was generated with the old format. Please REGENERATE the QR code. Tried ID: "${documentIdToUse}"`
              : `Document not found in Firestore. Tried ID: "${documentIdToUse}" (length: ${documentIdToUse.length}). Expected UUID format (36 chars).`;
            
            prepareErrorDetails(
              errorMessage,
              'STEP 3: Firestore fetch - Document not found',
              null
            );
          }
        } catch (firestoreError: any) {
          // Firestore might require authentication or have permission issues
          const errorMsg = firestoreError?.message || String(firestoreError);
          const errorCode = firestoreError?.code || 'unknown';
          console.error('Firestore error:', firestoreError);
          console.error('Error code:', errorCode);
          console.error('Error message:', errorMsg);
          console.error('Full error object:', JSON.stringify(firestoreError, null, 2));
          
          // Check if it's a permission error
          if (errorCode === 'permission-denied' || errorCode === 'PERMISSION_DENIED') {
            prepareErrorDetails(
              `Firestore permission denied. Make sure Firestore rules allow public read access for documents. Error: ${errorMsg}`,
              'STEP 3: Firestore fetch - Permission Error',
              `${errorCode}: ${errorMsg}`
            );
          } else {
            prepareErrorDetails(
              `Firestore read failed: ${errorMsg} (Code: ${errorCode})`,
              'STEP 3: Firestore fetch - Error',
              `${errorCode}: ${errorMsg}`
            );
          }
        }

        // STEP 4: All methods failed - show error
        const isTruncated = documentId.length < 30;
        const finalErrorMessage = isTruncated
          ? `QR Code Error: Document ID is TRUNCATED (${documentId.length} chars). This QR code was generated with an old format. Please REGENERATE the QR code using the updated generator. The truncated ID "${documentId}" cannot be used to find the document.`
          : 'Document not found. The document may have been deleted, moved, or is not publicly accessible.';
        
        prepareErrorDetails(
          finalErrorMessage,
          'STEP 4: All methods exhausted',
          null
        );
        setError(finalErrorMessage);
        setShowDebugInfo(true); // Auto-show debug info on error
      } catch (err: any) {
        console.error('Error loading document:', err);
        const errorMsg = err?.message || String(err);
        prepareErrorDetails(
          `Unexpected error: ${errorMsg}`,
          'Exception handler',
          errorMsg
        );
        setError(`Failed to load document: ${errorMsg}`);
        setShowDebugInfo(true); // Auto-show debug info on error
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
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-xl text-center max-w-2xl w-full">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Document Error</h2>
          <p className="text-white/70 mb-6">{error}</p>
          
          {/* Debug Information Section */}
          {errorDetails && (
            <div className="mb-6 text-left">
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-3 mb-2 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm">
                    {showDebugInfo ? '▼' : '▶'} Debug Information
                  </span>
                  <span className="text-white/60 text-xs">Click to {showDebugInfo ? 'hide' : 'show'}</span>
                </div>
              </button>
              
              {showDebugInfo && (
                <div className="bg-black/30 rounded-lg p-4 space-y-3 text-xs sm:text-sm font-mono overflow-auto">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <span className="text-yellow-300">Error Message:</span>
                      <div className="text-red-300 mt-1 break-words">{errorDetails.message}</div>
                    </div>
                    
                    <div>
                      <span className="text-yellow-300">Step:</span>
                      <div className="text-white mt-1">{errorDetails.step}</div>
                    </div>
                    
                    <div>
                      <span className="text-yellow-300">Document ID:</span>
                      <div className="text-white mt-1 break-all">{errorDetails.documentId}</div>
                    </div>
                    
                    <div>
                      <span className="text-yellow-300">URL Parameter (?url=):</span>
                      <div className="text-white mt-1 break-all">
                        {errorDetails.urlParam ? (
                          <span className="text-green-300">✓ Found: {errorDetails.urlParam.substring(0, 100)}...</span>
                        ) : (
                          <span className="text-red-300">✗ Missing</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-yellow-300">Full URL:</span>
                      <div className="text-white mt-1 break-all">{errorDetails.fullUrl}</div>
                    </div>
                    
                    <div>
                      <span className="text-yellow-300">Local Registry:</span>
                      <div className="text-white mt-1">
                        {errorDetails.registryFound ? (
                          <span className="text-green-300">✓ Document found in registry</span>
                        ) : (
                          <span className="text-red-300">✗ Document NOT in registry</span>
                        )}
                      </div>
                    </div>
                    
                    {errorDetails.firestoreError && (
                      <div>
                        <span className="text-yellow-300">Firestore Error:</span>
                        <div className="text-red-300 mt-1 break-words">{errorDetails.firestoreError}</div>
                      </div>
                    )}
                  </div>
                  
                    <div className="mt-4 pt-3 border-t border-white/20">
                    <div className="text-yellow-300 mb-2">Troubleshooting Steps:</div>
                    <ol className="list-decimal list-inside space-y-1 text-white/80 text-xs">
                      <li>
                        {errorDetails.documentId.length < 30 
                          ? <span className="text-red-300 font-bold">⚠️ CRITICAL: Document ID is truncated! REGENERATE the QR code using the updated generator.</span>
                          : 'Check if the QR code includes the ?url= parameter'}
                      </li>
                      <li>Verify the document exists in Firestore (if ID is complete)</li>
                      <li>Check Firestore security rules allow public read (deploy firestore.rules)</li>
                      <li>Ensure the Cloudinary URL is accessible</li>
                      <li>
                        {errorDetails.documentId.length < 30 
                          ? <span className="text-yellow-300">Go to QR Library → Select the QR code → Click Save to update it with full URL</span>
                          : 'Try regenerating the QR code with the updated format'}
                      </li>
                    </ol>
                    {errorDetails.documentId.length < 30 && (
                      <div className="mt-3 p-2 bg-red-500/20 rounded border border-red-500/50">
                        <div className="text-red-300 font-semibold text-xs mb-1">⚠️ IMPORTANT:</div>
                        <div className="text-white/90 text-xs">
                          Your QR code has a TRUNCATED document ID ({errorDetails.documentId.length} characters instead of 36). 
                          This means it was generated before the fix. You MUST regenerate it:
                        </div>
                        <ol className="list-decimal list-inside text-white/80 text-xs mt-2 space-y-1">
                          <li>Go to your QR Code Library</li>
                          <li>Find this QR code</li>
                          <li>It will automatically update with the full URL</li>
                          <li>Save it again</li>
                          <li>Download/print the new QR code</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-white text-blue-900 hover:bg-white/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
            {errorDetails && (
              <Button
                onClick={() => {
                  // Copy debug info to clipboard
                  const debugText = JSON.stringify(errorDetails, null, 2);
                  navigator.clipboard.writeText(debugText).then(() => {
                    alert('Debug information copied to clipboard!');
                  });
                }}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Copy Debug Info
              </Button>
            )}
          </div>
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
