import { QRCodeStorage } from './qrStorage';
import { ScanEventStorage } from './scanEventStorage';

export interface ScanEvent {
  qrCodeId: string;
  userId: string;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
  ipAddress?: string;
  documentId?: string; // For document QR codes
}

export class ScanTracker {
  private static readonly SCAN_EVENTS_KEY = 'qr_scan_events_';

  /**
   * Track a QR code scan
   */
  static async trackScan(qrCodeId: string, userId: string, additionalData?: Partial<ScanEvent>): Promise<boolean> {
    try {
      // Increment scan count in QR code storage (Firestore)
      const success = await QRCodeStorage.incrementScanCount(userId, qrCodeId);
      
      if (!success) {
        console.warn(`Failed to increment scan count for QR code: ${qrCodeId}`);
        return false;
      }

      // Store detailed scan event
      const scanEvent: ScanEvent = {
        qrCodeId,
        userId,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
        ...additionalData
      };

      // Store scan event in Firestore (primary) and localStorage (fallback)
      try {
        await ScanEventStorage.saveScanEvent(scanEvent);
      } catch (error) {
        console.error('Error saving scan event to Firestore, using localStorage fallback:', error);
        // Fallback to localStorage if Firestore fails
        this.storeScanEvent(scanEvent);
      }

      return true;
    } catch (error) {
      console.error('Error tracking scan:', error);
      return false;
    }
  }

  /**
   * Get scan events for a specific QR code (async - from Firestore)
   */
  static async getScanEvents(userId: string, qrCodeId?: string): Promise<ScanEvent[]> {
    try {
      if (qrCodeId) {
        // Get events for specific QR code from Firestore
        return await ScanEventStorage.getScanEvents(qrCodeId, userId);
      } else {
        // Get all events for user from Firestore
        return await ScanEventStorage.getUserScanEvents(userId);
      }
    } catch (error) {
      console.error('Error getting scan events from Firestore, falling back to localStorage:', error);
      // Fallback to localStorage
      return this.getScanEventsLocal(userId, qrCodeId);
    }
  }

  /**
   * Get scan events from localStorage (fallback)
   */
  private static getScanEventsLocal(userId: string, qrCodeId?: string): ScanEvent[] {
    const key = `${this.SCAN_EVENTS_KEY}${userId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return [];

    const events: ScanEvent[] = JSON.parse(stored);
    
    if (qrCodeId) {
      return events.filter(event => event.qrCodeId === qrCodeId);
    }
    
    return events;
  }

  /**
   * Get scan analytics for a user (async - from Firestore)
   */
  static async getScanAnalytics(userId: string) {
    const events = await this.getScanEvents(userId);
    const qrCodes = await QRCodeStorage.getUserQRCodes(userId);
    
    // Group events by QR code
    const eventsByQR = events.reduce((acc, event) => {
      if (!acc[event.qrCodeId]) {
        acc[event.qrCodeId] = [];
      }
      acc[event.qrCodeId].push(event);
      return acc;
    }, {} as Record<string, ScanEvent[]>);

    // Calculate analytics
    const totalScans = events.length;
    const uniqueQRCodes = Object.keys(eventsByQR).length;
    const averageScansPerCode = uniqueQRCodes > 0 ? totalScans / uniqueQRCodes : 0;

    // Most scanned QR codes
    const mostScanned = Object.entries(eventsByQR)
      .map(([qrCodeId, events]) => {
        const qrCode = qrCodes.find(code => code.id === qrCodeId);
        return {
          qrCode,
          scanCount: events.length,
          lastScan: events[events.length - 1]?.timestamp
        };
      })
      .filter(item => item.qrCode)
      .sort((a, b) => b.scanCount - a.scanCount)
      .slice(0, 5);

    // Recent scans (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentScans = events.filter(event => 
      new Date(event.timestamp) > last24Hours
    ).length;

    // Scan trends (last 7 days)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyScans = events.filter(event => 
      new Date(event.timestamp) > last7Days
    ).length;

    return {
      totalScans,
      uniqueQRCodes,
      averageScansPerCode: Math.round(averageScansPerCode * 100) / 100,
      recentScans,
      weeklyScans,
      mostScanned,
      eventsByQR
    };
  }

  /**
   * Clear scan events for a user
   */
  static clearScanEvents(userId: string): void {
    const key = `${this.SCAN_EVENTS_KEY}${userId}`;
    localStorage.removeItem(key);
  }

  /**
   * Store a scan event in localStorage (fallback when Firestore fails)
   */
  private static storeScanEvent(event: ScanEvent): void {
    const key = `${this.SCAN_EVENTS_KEY}${event.userId}`;
    // Use the synchronous localStorage method instead of async Firestore method
    const existing = this.getScanEventsLocal(event.userId);
    const updated = [...existing, event];
    
    // Keep only last 1000 events to prevent storage bloat
    const trimmed = updated.slice(-1000);
    
    localStorage.setItem(key, JSON.stringify(trimmed));
  }

  /**
   * Generate a scan tracking URL for a QR code
   */
  static generateScanTrackingUrl(qrCodeId: string, userId: string, baseUrl?: string): string {
    const currentUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${currentUrl}/scan?qrCodeId=${qrCodeId}&user=${userId}`;
  }

  /**
   * Extract QR code ID and user ID from scan tracking URL
   */
  static parseScanTrackingUrl(url: string): { qrCodeId: string; userId: string } | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const qrCodeId = pathParts[pathParts.length - 1];
      const userId = urlObj.searchParams.get('user');
      
      if (!qrCodeId || !userId) return null;
      
      return { qrCodeId, userId };
    } catch {
      return null;
    }
  }
}
