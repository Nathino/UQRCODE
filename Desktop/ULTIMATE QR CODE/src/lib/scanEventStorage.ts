import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { ScanEvent } from './scanTracker';
import { QRCodeFirestore } from './qrCodeFirestore';

const SCAN_EVENTS_COLLECTION = 'scan_events';

/**
 * Remove undefined values from an object (Firestore doesn't allow undefined)
 */
const removeUndefined = (obj: any): any => {
  const cleaned: any = {};
  for (const key in obj) {
    const value = obj[key];
    if (value === undefined) {
      continue;
    }
    if (value === null) {
      cleaned[key] = null;
      continue;
    }
    if (Array.isArray(value)) {
      cleaned[key] = value;
      continue;
    }
    if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      const nested = removeUndefined(value);
      if (Object.keys(nested).length > 0) {
        cleaned[key] = nested;
      }
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
};

export class ScanEventStorage {
  /**
   * Save a scan event to Firestore
   */
  static async saveScanEvent(event: ScanEvent): Promise<void> {
    try {
      const eventId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, SCAN_EVENTS_COLLECTION, eventId);
      
      const eventData = removeUndefined({
        qrCodeId: event.qrCodeId,
        userId: event.userId,
        timestamp: Timestamp.fromDate(new Date(event.timestamp)),
        createdAt: Timestamp.now(),
        userAgent: event.userAgent || null,
        referrer: event.referrer || null,
        ipAddress: event.ipAddress || null,
        documentId: event.documentId || null
      });
      
      await setDoc(docRef, eventData);
    } catch (error) {
      console.error('Error saving scan event to Firestore:', error);
      throw error;
    }
  }

  /**
   * Get scan events for a specific QR code
   */
  static async getScanEvents(qrCodeId: string, userId: string): Promise<ScanEvent[]> {
    try {
      const q = query(
        collection(db, SCAN_EVENTS_COLLECTION),
        where('qrCodeId', '==', qrCodeId),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const events: ScanEvent[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        events.push({
          qrCodeId: data.qrCodeId,
          userId: data.userId,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp || new Date().toISOString(),
          userAgent: data.userAgent,
          referrer: data.referrer,
          ipAddress: data.ipAddress,
          documentId: data.documentId
        });
      });
      
      return events;
    } catch (error) {
      console.error('Error getting scan events from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get all scan events for a user
   */
  static async getUserScanEvents(userId: string, limitCount: number = 1000): Promise<ScanEvent[]> {
    try {
      const q = query(
        collection(db, SCAN_EVENTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const events: ScanEvent[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        events.push({
          qrCodeId: data.qrCodeId,
          userId: data.userId,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp || new Date().toISOString(),
          userAgent: data.userAgent,
          referrer: data.referrer,
          ipAddress: data.ipAddress,
          documentId: data.documentId
        });
      });
      
      return events;
    } catch (error) {
      console.error('Error getting user scan events from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get scan events by document ID (for document QR codes)
   */
  static async getScanEventsByDocumentId(documentId: string, userId: string): Promise<ScanEvent[]> {
    try {
      // First, find all QR codes that point to this document
      const qrCode = await QRCodeFirestore.findQRCodeByDocumentId(documentId, userId);
      
      if (!qrCode) {
        // No QR code found for this document, check if there are events with documentId field
        const allEvents = await this.getUserScanEvents(userId, 10000);
        return allEvents.filter(event => event.documentId === documentId);
      }
      
      // Found QR code - get all scan events for this QR code
      const events = await this.getScanEvents(qrCode.id, userId);
      
      // Also check for any events that have the documentId field set (for backward compatibility)
      const allEvents = await this.getUserScanEvents(userId, 10000);
      const eventsByDocumentId = allEvents.filter(event => event.documentId === documentId);
      
      // Combine events from QR code and events with documentId field
      // Remove duplicates by combining unique events based on timestamp and qrCodeId
      const combinedEvents = [...events, ...eventsByDocumentId];
      const uniqueEvents = combinedEvents.filter((event, index, self) => 
        index === self.findIndex(e => 
          e.qrCodeId === event.qrCodeId && 
          e.timestamp === event.timestamp
        )
      );
      
      // Sort by timestamp (newest first)
      uniqueEvents.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
      });
      
      return uniqueEvents;
    } catch (error) {
      console.error('Error getting scan events by document ID:', error);
      return [];
    }
  }
}

