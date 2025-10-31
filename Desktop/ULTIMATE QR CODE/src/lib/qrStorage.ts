import { QRConfig, QRType } from '@/components/qr/types';
import { QRCodeFirestore } from './qrCodeFirestore';

export interface SavedQRCode {
  id: string;
  name: string;
  type: QRType;
  data: string;
  config: QRConfig;
  fgColor: string;
  bgColor: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  userId: string;
  downloadCount: number;
  scanCount: number;
  lastAccessed?: string;
  lastScanned?: string;
  tags?: string[];
  description?: string;
}

export interface QRCodeStats {
  totalCodes: number;
  activeCodes: number;
  inactiveCodes: number;
  totalDownloads: number;
  totalScans: number;
  mostUsedType: QRType;
  mostScannedCode: SavedQRCode | null;
  recentCodes: SavedQRCode[];
}

export class QRCodeStorage {
  private static readonly STORAGE_KEY_PREFIX = 'qr_codes_';
  private static firestoreCache: Map<string, SavedQRCode[]> = new Map();

  /**
   * Save a QR code to Firestore
   */
  static async saveQRCode(qrCode: Omit<SavedQRCode, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount' | 'scanCount'>): Promise<SavedQRCode> {
    try {
      const savedQRCode = await QRCodeFirestore.saveQRCode(qrCode);
      return savedQRCode;
    } catch (error) {
      console.error('Error saving QR code to Firestore, falling back to localStorage:', error);
      // Fallback to localStorage
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

      const existingCodes = this.getUserQRCodesLocal(qrCode.userId);
      const updatedCodes = [...existingCodes, savedQRCode];
      
      localStorage.setItem(
        `${this.STORAGE_KEY_PREFIX}${qrCode.userId}`, 
        JSON.stringify(updatedCodes)
      );

      return savedQRCode;
    }
  }

  /**
   * Get all QR codes for a user from Firestore (async)
   */
  static async getUserQRCodes(userId: string): Promise<SavedQRCode[]> {
    try {
      // Migrate from localStorage if needed
      await QRCodeFirestore.migrateFromLocalStorage(userId);
      
      const codes = await QRCodeFirestore.getUserQRCodes(userId);
      this.firestoreCache.set(userId, codes);
      return codes;
    } catch (error) {
      console.error('Error getting QR codes from Firestore, falling back to localStorage:', error);
      // Fallback to localStorage
      return this.getUserQRCodesLocal(userId);
    }
  }

  /**
   * Get all QR codes for a user from localStorage (sync fallback)
   */
  private static getUserQRCodesLocal(userId: string): SavedQRCode[] {
    const stored = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${userId}`);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get a specific QR code by ID
   */
  static async getQRCode(userId: string, qrCodeId: string): Promise<SavedQRCode | null> {
    try {
      return await QRCodeFirestore.getQRCode(qrCodeId);
    } catch (error) {
      console.error('Error getting QR code from Firestore, falling back to localStorage:', error);
      const codes = this.getUserQRCodesLocal(userId);
      return codes.find(code => code.id === qrCodeId) || null;
    }
  }

  /**
   * Update a QR code
   */
  static async updateQRCode(userId: string, qrCodeId: string, updates: Partial<SavedQRCode>): Promise<boolean> {
    try {
      await QRCodeFirestore.updateQRCode(qrCodeId, updates);
      return true;
    } catch (error) {
      console.error('Error updating QR code in Firestore, falling back to localStorage:', error);
      // Fallback to localStorage
      const codes = this.getUserQRCodesLocal(userId);
      const index = codes.findIndex(code => code.id === qrCodeId);
      
      if (index === -1) return false;

      codes[index] = {
        ...codes[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(
        `${this.STORAGE_KEY_PREFIX}${userId}`, 
        JSON.stringify(codes)
      );

      return true;
    }
  }

  /**
   * Delete a QR code
   */
  static async deleteQRCode(userId: string, qrCodeId: string): Promise<boolean> {
    try {
      await QRCodeFirestore.deleteQRCode(qrCodeId);
      return true;
    } catch (error) {
      console.error('Error deleting QR code from Firestore, falling back to localStorage:', error);
      // Fallback to localStorage
      const codes = this.getUserQRCodesLocal(userId);
      const filteredCodes = codes.filter(code => code.id !== qrCodeId);
      
      if (filteredCodes.length === codes.length) return false;

      localStorage.setItem(
        `${this.STORAGE_KEY_PREFIX}${userId}`, 
        JSON.stringify(filteredCodes)
      );

      return true;
    }
  }

  /**
   * Toggle QR code active status
   */
  static async toggleQRCodeStatus(userId: string, qrCodeId: string): Promise<boolean> {
    try {
      return await QRCodeFirestore.toggleQRCodeStatus(qrCodeId);
    } catch (error) {
      console.error('Error toggling QR code status in Firestore, falling back to localStorage:', error);
      // Fallback to localStorage
      const code = await this.getQRCode(userId, qrCodeId);
      if (!code) return false;

      return await this.updateQRCode(userId, qrCodeId, { 
        isActive: !code.isActive,
        lastAccessed: new Date().toISOString()
      });
    }
  }

  /**
   * Increment download count
   */
  static async incrementDownloadCount(userId: string, qrCodeId: string): Promise<boolean> {
    try {
      return await QRCodeFirestore.incrementDownloadCount(qrCodeId);
    } catch (error) {
      console.error('Error incrementing download count in Firestore, falling back to localStorage:', error);
      // Fallback to localStorage
      const code = await this.getQRCode(userId, qrCodeId);
      if (!code) return false;

      return await this.updateQRCode(userId, qrCodeId, { 
        downloadCount: code.downloadCount + 1,
        lastAccessed: new Date().toISOString()
      });
    }
  }

  /**
   * Increment scan count
   */
  static async incrementScanCount(userId: string, qrCodeId: string): Promise<boolean> {
    try {
      return await QRCodeFirestore.incrementScanCount(qrCodeId);
    } catch (error) {
      console.error('Error incrementing scan count in Firestore, falling back to localStorage:', error);
      // Fallback to localStorage
      const code = await this.getQRCode(userId, qrCodeId);
      if (!code) return false;

      return await this.updateQRCode(userId, qrCodeId, { 
        scanCount: code.scanCount + 1,
        lastScanned: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      });
    }
  }

  /**
   * Get QR code statistics for a user (async)
   */
  static async getQRCodeStats(userId: string): Promise<QRCodeStats> {
    try {
      return await QRCodeFirestore.getQRCodeStats(userId);
    } catch (error) {
      console.error('Error getting QR code stats from Firestore, falling back to localStorage:', error);
      // Fallback to localStorage
      const codes = this.getUserQRCodesLocal(userId);
      const activeCodes = codes.filter(code => code.isActive);
      const inactiveCodes = codes.filter(code => !code.isActive);
      
      // Handle empty codes array
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
    }
  }

  /**
   * Search QR codes by name, type, or data
   */
  static async searchQRCodes(userId: string, query: string): Promise<SavedQRCode[]> {
    const codes = await this.getUserQRCodes(userId);
    const lowercaseQuery = query.toLowerCase();
    
    return codes.filter(code => 
      code.name.toLowerCase().includes(lowercaseQuery) ||
      code.type.toLowerCase().includes(lowercaseQuery) ||
      code.data.toLowerCase().includes(lowercaseQuery) ||
      code.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Filter QR codes by type
   */
  static async filterQRCodesByType(userId: string, type: QRType): Promise<SavedQRCode[]> {
    const codes = await this.getUserQRCodes(userId);
    return codes.filter(code => code.type === type);
  }

  /**
   * Filter QR codes by active status
   */
  static async filterQRCodesByStatus(userId: string, isActive: boolean): Promise<SavedQRCode[]> {
    const codes = await this.getUserQRCodes(userId);
    return codes.filter(code => code.isActive === isActive);
  }

  /**
   * Export QR codes as JSON
   */
  static async exportQRCodes(userId: string): Promise<string> {
    const codes = await this.getUserQRCodes(userId);
    return JSON.stringify(codes, null, 2);
  }

  /**
   * Import QR codes from JSON
   */
  static async importQRCodes(userId: string, jsonData: string): Promise<{ success: number; errors: string[] }> {
    try {
      const importedCodes: SavedQRCode[] = JSON.parse(jsonData);
      const existingCodes = await this.getUserQRCodes(userId);
      const errors: string[] = [];
      let successCount = 0;

      // Create a set of existing code identifiers to check for duplicates
      // Check by name+type+data combination since IDs will be different
      const existingCodeIdentifiers = new Set(
        existingCodes.map(code => `${code.name}|${code.type}|${code.data}`)
      );

      for (const code of importedCodes) {
        try {
          // Validate required fields
          if (!code.name || !code.type || !code.data || !code.config) {
            errors.push(`Invalid QR code: ${code.name || 'Unknown'}`);
            continue;
          }

          // Check if code already exists (by name, type, and data combination)
          const codeIdentifier = `${code.name}|${code.type}|${code.data}`;
          if (existingCodeIdentifiers.has(codeIdentifier)) {
            errors.push(`QR code "${code.name}" already exists and was skipped`);
            continue;
          }

          // Save to Firestore
          await this.saveQRCode({
            name: code.name,
            type: code.type,
            data: code.data,
            config: code.config,
            fgColor: code.fgColor,
            bgColor: code.bgColor,
            userId,
            isActive: code.isActive ?? true,
            tags: code.tags,
            description: code.description
          });
          
          // Add to existing codes set to prevent duplicates within the import
          existingCodeIdentifiers.add(codeIdentifier);
          successCount++;
        } catch (error) {
          errors.push(`Error importing QR code: ${error}`);
        }
      }

      return { success: successCount, errors };
    } catch (error) {
      return { success: 0, errors: ['Invalid JSON format'] };
    }
  }

  /**
   * Clear all QR codes for a user
   */
  static clearUserQRCodes(userId: string): void {
    localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${userId}`);
  }

  /**
   * Generate a unique ID
   */
  private static generateId(): string {
    return `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
