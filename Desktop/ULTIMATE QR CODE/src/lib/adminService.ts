import { 
  collection, 
  getDocs,
  query,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from './userProfile';
import { QRType } from '@/components/qr/types';
import { SavedQRCode } from './qrStorage';

const USERS_COLLECTION = 'users';
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
 * Convert Firestore document to UserProfile format
 */
const fromFirestoreFormat = (data: DocumentData, uid: string): UserProfile => {
  return {
    ...data,
    uid,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt)
  } as UserProfile;
};

export interface AdminStats {
  totalUsers: number;
  totalQRCodes: number;
  totalEmailQRCodes: number;
  totalDocuments: number;
  totalScans: number;
  totalDownloads: number;
  qrCodesByType: Record<QRType, number>;
}

export interface AdminUser extends UserProfile {
  // Additional admin-specific fields if needed
}

export class AdminService {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(): Promise<AdminUser[]> {
    try {
      const q = query(collection(db, USERS_COLLECTION));
      const querySnapshot = await getDocs(q);
      
      const users: AdminUser[] = [];
      querySnapshot.forEach((docSnap) => {
        try {
          users.push(fromFirestoreFormat(docSnap.data(), docSnap.id) as AdminUser);
        } catch (error) {
          console.error('Error parsing user:', error);
        }
      });
      
      // Sort by creation date (newest first)
      users.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Get all QR codes (admin only)
   */
  static async getAllQRCodes(): Promise<SavedQRCode[]> {
    try {
      const q = query(collection(db, QR_CODES_COLLECTION));
      const querySnapshot = await getDocs(q);
      
      const codes: SavedQRCode[] = [];
      querySnapshot.forEach((docSnap) => {
        try {
          const data = docSnap.data();
          codes.push({
            ...data,
            id: docSnap.id,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            lastAccessed: data.lastAccessed ? convertTimestamp(data.lastAccessed) : undefined,
            lastScanned: data.lastScanned ? convertTimestamp(data.lastScanned) : undefined
          } as SavedQRCode);
        } catch (error) {
          console.error('Error parsing QR code:', error);
        }
      });
      
      return codes;
    } catch (error) {
      console.error('Error getting all QR codes:', error);
      throw error;
    }
  }

  /**
   * Get aggregated statistics (admin only)
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const [users, qrCodes] = await Promise.all([
        this.getAllUsers(),
        this.getAllQRCodes()
      ]);

      // Calculate statistics
      const totalUsers = users.length;
      const totalQRCodes = qrCodes.length;
      const totalEmailQRCodes = qrCodes.filter(code => code.type === 'email').length;
      const totalDocuments = users.reduce((sum, user) => sum + (user.totalDocuments || 0), 0);
      const totalScans = qrCodes.reduce((sum, code) => sum + (code.scanCount || 0), 0);
      const totalDownloads = qrCodes.reduce((sum, code) => sum + (code.downloadCount || 0), 0);

      // Count QR codes by type
      const qrCodesByType = qrCodes.reduce((acc, code) => {
        acc[code.type] = (acc[code.type] || 0) + 1;
        return acc;
      }, {} as Record<QRType, number>);

      return {
        totalUsers,
        totalQRCodes,
        totalEmailQRCodes,
        totalDocuments,
        totalScans,
        totalDownloads,
        qrCodesByType
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      // Return empty stats on error
      return {
        totalUsers: 0,
        totalQRCodes: 0,
        totalEmailQRCodes: 0,
        totalDocuments: 0,
        totalScans: 0,
        totalDownloads: 0,
        qrCodesByType: {} as Record<QRType, number>
      };
    }
  }
}

