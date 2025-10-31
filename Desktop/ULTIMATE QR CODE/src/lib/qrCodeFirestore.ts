import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  query, 
  where,
  onSnapshot,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { SavedQRCode, QRCodeStats } from './qrStorage';
import { QRType } from '@/components/qr/types';

const QR_CODES_COLLECTION = 'qr_codes';

/**
 * Convert Firestore timestamp to ISO string
 */
const convertTimestamp = (timestamp: any): string => {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date().toISOString();
};

/**
 * Remove undefined values from an object (Firestore doesn't allow undefined)
 */
const removeUndefined = (obj: any): any => {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      if (Array.isArray(obj[key])) {
        cleaned[key] = obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null && !(obj[key] instanceof Date)) {
        const nested = removeUndefined(obj[key]);
        if (Object.keys(nested).length > 0) {
          cleaned[key] = nested;
        }
      } else {
        cleaned[key] = obj[key];
      }
    }
  }
  return cleaned;
};

/**
 * Convert SavedQRCode to Firestore format
 */
const toFirestoreFormat = (qrCode: SavedQRCode): any => {
  const formatted = {
    ...qrCode,
    createdAt: Timestamp.fromDate(new Date(qrCode.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(qrCode.updatedAt)),
    lastAccessed: qrCode.lastAccessed ? Timestamp.fromDate(new Date(qrCode.lastAccessed)) : null,
    lastScanned: qrCode.lastScanned ? Timestamp.fromDate(new Date(qrCode.lastScanned)) : null,
    // Ensure tags and description are arrays/strings or null, never undefined
    tags: qrCode.tags || null,
    description: qrCode.description || null
  };
  
  // Remove undefined values (Firestore doesn't allow them)
  return removeUndefined(formatted);
};

/**
 * Convert Firestore document to SavedQRCode format
 */
const fromFirestoreFormat = (docSnap: QueryDocumentSnapshot<DocumentData>): SavedQRCode => {
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    lastAccessed: data.lastAccessed ? convertTimestamp(data.lastAccessed) : undefined,
    lastScanned: data.lastScanned ? convertTimestamp(data.lastScanned) : undefined
  } as SavedQRCode;
};

export class QRCodeFirestore {
  /**
   * Save a QR code to Firestore
   */
  static async saveQRCode(qrCode: Omit<SavedQRCode, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount' | 'scanCount'>): Promise<SavedQRCode> {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();
      
      const savedQRCode: SavedQRCode = {
        ...qrCode,
        id,
        createdAt: now,
        updatedAt: now,
        downloadCount: 0,
        scanCount: 0,
        isActive: qrCode.isActive ?? true
      };

      const docRef = doc(db, QR_CODES_COLLECTION, id);
      await setDoc(docRef, toFirestoreFormat(savedQRCode));
      
      return savedQRCode;
    } catch (error) {
      console.error('Error saving QR code to Firestore:', error);
      throw error;
    }
  }

  /**
   * Get all QR codes for a user
   */
  static async getUserQRCodes(userId: string): Promise<SavedQRCode[]> {
    try {
      const q = query(
        collection(db, QR_CODES_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const codes: SavedQRCode[] = [];
      
      querySnapshot.forEach((docSnap) => {
        codes.push(fromFirestoreFormat(docSnap));
      });
      
      // Sort by updated date (newest first)
      codes.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      });
      
      return codes;
    } catch (error) {
      console.error('Error getting user QR codes from Firestore:', error);
      throw error;
    }
  }

  /**
   * Subscribe to QR codes for a user (real-time updates)
   */
  static subscribeToUserQRCodes(
    userId: string,
    callback: (codes: SavedQRCode[]) => void
  ): () => void {
    try {
      const q = query(
        collection(db, QR_CODES_COLLECTION),
        where('userId', '==', userId)
      );
      
      return onSnapshot(q,
        (querySnapshot) => {
          try {
            const codes: SavedQRCode[] = [];
            
            querySnapshot.forEach((docSnap) => {
              try {
                codes.push(fromFirestoreFormat(docSnap));
              } catch (error) {
                console.error('Error parsing QR code:', error);
              }
            });
            
            // Sort by updated date (newest first)
            codes.sort((a, b) => {
              const dateA = new Date(a.updatedAt).getTime();
              const dateB = new Date(b.updatedAt).getTime();
              return dateB - dateA;
            });
            
            callback(codes);
          } catch (error) {
            console.error('Error processing QR codes snapshot:', error);
            // Fallback to one-time read on error
            this.getUserQRCodes(userId).then(callback).catch(() => callback([]));
          }
        },
        (error) => {
          console.error('Error in QR codes subscription:', error);
          // Fallback to one-time read on subscription error
          this.getUserQRCodes(userId).then(callback).catch(() => callback([]));
        }
      );
    } catch (error) {
      console.error('Error setting up QR codes subscription:', error);
      // Fallback to one-time read if subscription setup fails
      this.getUserQRCodes(userId).then(callback).catch(() => callback([]));
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Get a specific QR code by ID
   */
  static async getQRCode(qrCodeId: string): Promise<SavedQRCode | null> {
    try {
      const docRef = doc(db, QR_CODES_COLLECTION, qrCodeId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return fromFirestoreFormat(docSnap as QueryDocumentSnapshot<DocumentData>);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting QR code from Firestore:', error);
      throw error;
    }
  }

  /**
   * Find QR code by document ID (for document QR codes)
   */
  static async findQRCodeByDocumentId(documentId: string, userId: string): Promise<SavedQRCode | null> {
    try {
      const codes = await this.getUserQRCodes(userId);
      // Find QR code that points to this document
      const documentUrl = `${window.location.origin}/document/${documentId}`;
      return codes.find(code => 
        code.type === 'document' && 
        (code.data.includes(documentId) || code.data === documentUrl)
      ) || null;
    } catch (error) {
      console.error('Error finding QR code by document ID:', error);
      return null;
    }
  }

  /**
   * Update a QR code
   */
  static async updateQRCode(qrCodeId: string, updates: Partial<SavedQRCode>): Promise<void> {
    try {
      const docRef = doc(db, QR_CODES_COLLECTION, qrCodeId);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      // Convert date fields if present
      if (updates.lastAccessed) {
        updateData.lastAccessed = Timestamp.fromDate(new Date(updates.lastAccessed));
      }
      if (updates.lastScanned) {
        updateData.lastScanned = Timestamp.fromDate(new Date(updates.lastScanned));
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating QR code in Firestore:', error);
      throw error;
    }
  }

  /**
   * Delete a QR code
   */
  static async deleteQRCode(qrCodeId: string): Promise<void> {
    try {
      const docRef = doc(db, QR_CODES_COLLECTION, qrCodeId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting QR code from Firestore:', error);
      throw error;
    }
  }

  /**
   * Toggle QR code active status
   */
  static async toggleQRCodeStatus(qrCodeId: string): Promise<boolean> {
    try {
      const code = await this.getQRCode(qrCodeId);
      if (!code) return false;
      
      await this.updateQRCode(qrCodeId, { 
        isActive: !code.isActive,
        lastAccessed: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error toggling QR code status:', error);
      return false;
    }
  }

  /**
   * Increment download count
   */
  static async incrementDownloadCount(qrCodeId: string): Promise<boolean> {
    try {
      const code = await this.getQRCode(qrCodeId);
      if (!code) return false;
      
      await this.updateQRCode(qrCodeId, { 
        downloadCount: code.downloadCount + 1,
        lastAccessed: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return false;
    }
  }

  /**
   * Increment scan count
   */
  static async incrementScanCount(qrCodeId: string): Promise<boolean> {
    try {
      const code = await this.getQRCode(qrCodeId);
      if (!code) return false;
      
      await this.updateQRCode(qrCodeId, { 
        scanCount: code.scanCount + 1,
        lastScanned: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error incrementing scan count:', error);
      return false;
    }
  }

  /**
   * Get QR code statistics for a user
   */
  static async getQRCodeStats(userId: string): Promise<QRCodeStats> {
    try {
      const codes = await this.getUserQRCodes(userId);
      
      if (codes.length === 0) {
        return {
          totalCodes: 0,
          activeCodes: 0,
          inactiveCodes: 0,
          totalDownloads: 0,
          totalScans: 0,
          mostUsedType: 'url' as QRType,
          mostScannedCode: null,
          recentCodes: []
        };
      }
      
      const activeCodes = codes.filter(code => code.isActive);
      const inactiveCodes = codes.filter(code => !code.isActive);
      
      // Find most used type
      const typeCounts = codes.reduce((acc, code) => {
        acc[code.type] = (acc[code.type] || 0) + 1;
        return acc;
      }, {} as Record<QRType, number>);
      
      const mostUsedType = Object.entries(typeCounts).length > 0 
        ? Object.entries(typeCounts).reduce((a, b) => 
            typeCounts[a[0] as QRType] > typeCounts[b[0] as QRType] ? a : b
          )[0] as QRType
        : 'url' as QRType;

      // Find most scanned code
      const mostScannedCode = codes.reduce((max, code) => 
        code.scanCount > (max?.scanCount || 0) ? code : max, null as SavedQRCode | null
      );

      // Get recent codes (last 5)
      const recentCodes = codes
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

      return {
        totalCodes: codes.length,
        activeCodes: activeCodes.length,
        inactiveCodes: inactiveCodes.length,
        totalDownloads: codes.reduce((sum, code) => sum + code.downloadCount, 0),
        totalScans: codes.reduce((sum, code) => sum + code.scanCount, 0),
        mostUsedType,
        mostScannedCode,
        recentCodes
      };
    } catch (error) {
      console.error('Error getting QR code stats:', error);
      return {
        totalCodes: 0,
        activeCodes: 0,
        inactiveCodes: 0,
        totalDownloads: 0,
        totalScans: 0,
        mostUsedType: 'url' as QRType,
        mostScannedCode: null,
        recentCodes: []
      };
    }
  }

  /**
   * Migrate QR codes from localStorage to Firestore
   */
  static async migrateFromLocalStorage(userId: string): Promise<void> {
    try {
      const localStorageKey = `qr_codes_${userId}`;
      const savedCodes = localStorage.getItem(localStorageKey);
      
      if (!savedCodes) {
        return; // Nothing to migrate
      }
      
      const codes: SavedQRCode[] = JSON.parse(savedCodes);
      
      // Check if codes already exist in Firestore
      const existingCodes = await this.getUserQRCodes(userId);
      const existingIds = new Set(existingCodes.map(code => code.id));
      
      // Only migrate codes that don't exist in Firestore
      for (const code of codes) {
        if (!existingIds.has(code.id)) {
          try {
            await this.saveQRCode({
              name: code.name,
              type: code.type,
              data: code.data,
              config: code.config,
              fgColor: code.fgColor,
              bgColor: code.bgColor,
              userId: code.userId,
              isActive: code.isActive,
              tags: code.tags,
              description: code.description
            });
          } catch (error) {
            console.error(`Error migrating QR code ${code.id}:`, error);
          }
        }
      }
      
      // Clear localStorage after successful migration
      localStorage.removeItem(localStorageKey);
    } catch (error) {
      console.error('Error migrating QR codes from localStorage:', error);
      // Don't throw - migration failure shouldn't break the app
    }
  }

  /**
   * Generate a unique ID
   */
  private static generateId(): string {
    return `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

