import { 
  doc, 
  setDoc, 
  getDoc,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
  totalQRCodes: number;
  totalEmailQRCodes: number;
  totalDocuments: number;
  totalScans: number;
  totalDownloads: number;
}

const USERS_COLLECTION = 'users';

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
 * Convert UserProfile to Firestore format
 */
const toFirestoreFormat = (profile: UserProfile): any => {
  const formatted = {
    ...profile,
    createdAt: Timestamp.fromDate(new Date(profile.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(profile.updatedAt))
  };
  
  return removeUndefined(formatted);
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

export class UserProfileService {
  /**
   * Create or update a user profile
   */
  static async createOrUpdateProfile(uid: string, email: string, displayName?: string): Promise<UserProfile> {
    try {
      const docRef = doc(db, USERS_COLLECTION, uid);
      const existingDoc = await getDoc(docRef);
      const now = new Date().toISOString();
      
      let profile: UserProfile;
      
      if (existingDoc.exists()) {
        // Update existing profile
        const existingData = existingDoc.data();
        profile = {
          uid,
          email,
          displayName: displayName || existingData.displayName,
          createdAt: convertTimestamp(existingData.createdAt),
          updatedAt: now,
          totalQRCodes: existingData.totalQRCodes || 0,
          totalEmailQRCodes: existingData.totalEmailQRCodes || 0,
          totalDocuments: existingData.totalDocuments || 0,
          totalScans: existingData.totalScans || 0,
          totalDownloads: existingData.totalDownloads || 0
        };
      } else {
        // Create new profile
        profile = {
          uid,
          email,
          displayName,
          createdAt: now,
          updatedAt: now,
          totalQRCodes: 0,
          totalEmailQRCodes: 0,
          totalDocuments: 0,
          totalScans: 0,
          totalDownloads: 0
        };
      }
      
      await setDoc(docRef, toFirestoreFormat(profile), { merge: true });
      return profile;
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get a user profile by UID
   */
  static async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, USERS_COLLECTION, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return fromFirestoreFormat(docSnap.data(), uid);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update profile statistics
   */
  static async updateProfileStats(
    uid: string, 
    updates: {
      totalQRCodes?: number;
      totalEmailQRCodes?: number;
      totalDocuments?: number;
      totalScans?: number;
      totalDownloads?: number;
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, USERS_COLLECTION, uid);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      await setDoc(docRef, updateData, { merge: true });
    } catch (error) {
      console.error('Error updating profile stats:', error);
      throw error;
    }
  }

  /**
   * Increment profile statistics
   */
  static async incrementStats(
    uid: string,
    statType: 'totalQRCodes' | 'totalEmailQRCodes' | 'totalDocuments' | 'totalScans' | 'totalDownloads',
    amount: number = 1
  ): Promise<void> {
    try {
      const profile = await this.getProfile(uid);
      if (profile) {
        const currentValue = profile[statType] || 0;
        await this.updateProfileStats(uid, { [statType]: currentValue + amount });
      }
    } catch (error) {
      console.error('Error incrementing profile stats:', error);
      throw error;
    }
  }
}

