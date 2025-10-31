import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { DocumentMetadata } from './cloudinary';

const DOCUMENTS_COLLECTION = 'documents';

export class DocumentStorage {
  /**
   * Remove undefined values from an object (Firestore doesn't allow undefined)
   */
  private static removeUndefined(obj: any): any {
    const cleaned: any = {};
    for (const key in obj) {
      const value = obj[key];
      // Skip undefined values completely
      if (value === undefined) {
        continue;
      }
      // Handle null values (allowed by Firestore)
      if (value === null) {
        cleaned[key] = null;
        continue;
      }
      // Handle arrays
      if (Array.isArray(value)) {
        cleaned[key] = value;
        continue;
      }
      // Handle nested objects (but not Dates, Timestamps, etc.)
      if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        const nested = this.removeUndefined(value);
        if (Object.keys(nested).length > 0) {
          cleaned[key] = nested;
        }
        continue;
      }
      // All other values (strings, numbers, booleans, Dates, etc.)
      cleaned[key] = value;
    }
    return cleaned;
  }

  /**
   * Save a document to Firestore
   */
  static async saveDocument(userId: string, document: DocumentMetadata): Promise<void> {
    try {
      const docRef = doc(db, DOCUMENTS_COLLECTION, document.id);
      
      // Prepare document data, ensuring optional fields are never undefined
      const documentData: any = {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        size: document.size,
        url: document.url,
        publicId: document.publicId,
        uploadedAt: document.uploadedAt,
        userId,
        createdAt: document.uploadedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Only include optional fields if they are explicitly defined and not undefined
      if (document.originalSize !== undefined && document.originalSize !== null) {
        documentData.originalSize = document.originalSize;
      }
      
      // Only include compressionRatio if it's a valid number
      if (typeof document.compressionRatio === 'number' && !isNaN(document.compressionRatio)) {
        documentData.compressionRatio = document.compressionRatio;
      }
      
      // Remove any remaining undefined values (shouldn't be any, but double-check)
      const cleanedData = this.removeUndefined(documentData);
      
      // Final validation: ensure no undefined values slipped through
      const finalData: any = {};
      for (const key in cleanedData) {
        if (cleanedData[key] !== undefined) {
          finalData[key] = cleanedData[key];
        }
      }
      
      await setDoc(docRef, finalData);
    } catch (error) {
      console.error('Error saving document to Firestore:', error);
      throw error;
    }
  }

  /**
   * Get a document by ID
   */
  static async getDocument(documentId: string): Promise<DocumentMetadata | null> {
    try {
      const docRef = doc(db, DOCUMENTS_COLLECTION, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Remove userId before returning
        const { userId, ...document } = data;
        return document as DocumentMetadata;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting document from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get all documents for a user
   */
  static async getUserDocuments(userId: string): Promise<DocumentMetadata[]> {
    try {
      const q = query(
        collection(db, DOCUMENTS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const documents: DocumentMetadata[] = [];
      
      querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        const { userId, ...document } = data;
        documents.push(document as DocumentMetadata);
      });
      
      // Sort by uploaded date (newest first)
      documents.sort((a, b) => {
        const dateA = new Date(a.uploadedAt || 0).getTime();
        const dateB = new Date(b.uploadedAt || 0).getTime();
        return dateB - dateA;
      });
      
      return documents;
    } catch (error) {
      console.error('Error getting user documents from Firestore:', error);
      throw error;
    }
  }

  /**
   * Subscribe to documents for a user (real-time updates)
   */
  static subscribeToUserDocuments(
    userId: string,
    callback: (documents: DocumentMetadata[]) => void
  ): () => void {
    try {
      const q = query(
        collection(db, DOCUMENTS_COLLECTION),
        where('userId', '==', userId)
      );
      
      return onSnapshot(q, 
        (querySnapshot) => {
          try {
            const documents: DocumentMetadata[] = [];
            
            querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
              try {
                const data = docSnap.data();
                const { userId, ...document } = data;
                documents.push(document as DocumentMetadata);
              } catch (error) {
                console.error('Error parsing document:', error);
              }
            });
            
            // Sort by uploaded date (newest first)
            documents.sort((a, b) => {
              const dateA = new Date(a.uploadedAt || 0).getTime();
              const dateB = new Date(b.uploadedAt || 0).getTime();
              return dateB - dateA;
            });
            
            callback(documents);
          } catch (error) {
            console.error('Error processing documents snapshot:', error);
            // Fallback to one-time read on error
            this.getUserDocuments(userId).then(callback).catch(() => callback([]));
          }
        },
        (error) => {
          console.error('Error in documents subscription:', error);
          // Fallback to one-time read on subscription error
          this.getUserDocuments(userId).then(callback).catch(() => callback([]));
        }
      );
    } catch (error) {
      console.error('Error setting up documents subscription:', error);
      // Fallback to one-time read if subscription setup fails
      this.getUserDocuments(userId).then(callback).catch(() => callback([]));
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Delete a document from Firestore
   */
  static async deleteDocument(documentId: string): Promise<void> {
    try {
      const docRef = doc(db, DOCUMENTS_COLLECTION, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document from Firestore:', error);
      throw error;
    }
  }

  /**
   * Migrate documents from localStorage to Firestore
   */
  static async migrateFromLocalStorage(userId: string): Promise<void> {
    try {
      const localStorageKey = `documents_${userId}`;
      const savedDocuments = localStorage.getItem(localStorageKey);
      
      if (!savedDocuments) {
        return; // Nothing to migrate
      }
      
      const documents: DocumentMetadata[] = JSON.parse(savedDocuments);
      
      // Check if documents already exist in Firestore
      const existingDocs = await this.getUserDocuments(userId);
      const existingIds = new Set(existingDocs.map(doc => doc.id));
      
      // Only migrate documents that don't exist in Firestore
      for (const document of documents) {
        if (!existingIds.has(document.id)) {
          try {
            await this.saveDocument(userId, document);
          } catch (error) {
            console.error(`Error migrating document ${document.id}:`, error);
          }
        }
      }
      
      // Clear localStorage after successful migration
      localStorage.removeItem(localStorageKey);
    } catch (error) {
      console.error('Error migrating documents from localStorage:', error);
      // Don't throw - migration failure shouldn't break the app
    }
  }
}

