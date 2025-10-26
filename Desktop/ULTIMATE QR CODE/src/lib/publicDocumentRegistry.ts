import { DocumentMetadata } from './cloudinary';

/**
 * Public Document Registry
 * 
 * This is a simplified approach for making documents publicly accessible.
 * In a production app, you'd want a proper database and API endpoints.
 * 
 * For now, we'll use a global registry in localStorage that can be accessed
 * by any user visiting the app.
 */

const PUBLIC_DOCUMENTS_KEY = 'public_documents_registry';

export interface PublicDocumentEntry {
  documentId: string;
  documentMetadata: DocumentMetadata;
  isPublic: boolean;
  createdAt: string;
  lastAccessed?: string;
}

export class PublicDocumentRegistry {
  /**
   * Register a document as publicly accessible
   */
  static registerPublicDocument(documentMetadata: DocumentMetadata): void {
    const entry: PublicDocumentEntry = {
      documentId: documentMetadata.id,
      documentMetadata,
      isPublic: true,
      createdAt: new Date().toISOString()
    };

    const existingRegistry = this.getPublicDocuments();
    const updatedRegistry = [...existingRegistry, entry];
    
    localStorage.setItem(PUBLIC_DOCUMENTS_KEY, JSON.stringify(updatedRegistry));
  }

  /**
   * Get a public document by ID
   */
  static getPublicDocument(documentId: string): PublicDocumentEntry | null {
    const registry = this.getPublicDocuments();
    return registry.find(entry => entry.documentId === documentId) || null;
  }

  /**
   * Get all public documents
   */
  static getPublicDocuments(): PublicDocumentEntry[] {
    try {
      const stored = localStorage.getItem(PUBLIC_DOCUMENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading public documents registry:', error);
      return [];
    }
  }

  /**
   * Update document access timestamp
   */
  static updateAccessTime(documentId: string): void {
    const registry = this.getPublicDocuments();
    const entry = registry.find(entry => entry.documentId === documentId);
    
    if (entry) {
      entry.lastAccessed = new Date().toISOString();
      localStorage.setItem(PUBLIC_DOCUMENTS_KEY, JSON.stringify(registry));
    }
  }

  /**
   * Remove a document from public registry
   */
  static removePublicDocument(documentId: string): void {
    const registry = this.getPublicDocuments();
    const updatedRegistry = registry.filter(entry => entry.documentId !== documentId);
    localStorage.setItem(PUBLIC_DOCUMENTS_KEY, JSON.stringify(updatedRegistry));
  }

  /**
   * Check if a document is publicly accessible
   */
  static isDocumentPublic(documentId: string): boolean {
    const entry = this.getPublicDocument(documentId);
    return entry?.isPublic || false;
  }
}
