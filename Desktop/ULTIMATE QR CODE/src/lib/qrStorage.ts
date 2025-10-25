import { QRConfig, QRType } from '@/components/qr/types';

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

  /**
   * Save a QR code to localStorage
   */
  static saveQRCode(qrCode: Omit<SavedQRCode, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount' | 'scanCount'>): SavedQRCode {
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

    const existingCodes = this.getUserQRCodes(qrCode.userId);
    const updatedCodes = [...existingCodes, savedQRCode];
    
    localStorage.setItem(
      `${this.STORAGE_KEY_PREFIX}${qrCode.userId}`, 
      JSON.stringify(updatedCodes)
    );

    return savedQRCode;
  }

  /**
   * Get all QR codes for a user
   */
  static getUserQRCodes(userId: string): SavedQRCode[] {
    const stored = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${userId}`);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get a specific QR code by ID
   */
  static getQRCode(userId: string, qrCodeId: string): SavedQRCode | null {
    const codes = this.getUserQRCodes(userId);
    return codes.find(code => code.id === qrCodeId) || null;
  }

  /**
   * Update a QR code
   */
  static updateQRCode(userId: string, qrCodeId: string, updates: Partial<SavedQRCode>): boolean {
    const codes = this.getUserQRCodes(userId);
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

  /**
   * Delete a QR code
   */
  static deleteQRCode(userId: string, qrCodeId: string): boolean {
    const codes = this.getUserQRCodes(userId);
    const filteredCodes = codes.filter(code => code.id !== qrCodeId);
    
    if (filteredCodes.length === codes.length) return false;

    localStorage.setItem(
      `${this.STORAGE_KEY_PREFIX}${userId}`, 
      JSON.stringify(filteredCodes)
    );

    return true;
  }

  /**
   * Toggle QR code active status
   */
  static toggleQRCodeStatus(userId: string, qrCodeId: string): boolean {
    const code = this.getQRCode(userId, qrCodeId);
    if (!code) return false;

    return this.updateQRCode(userId, qrCodeId, { 
      isActive: !code.isActive,
      lastAccessed: new Date().toISOString()
    });
  }

  /**
   * Increment download count
   */
  static incrementDownloadCount(userId: string, qrCodeId: string): boolean {
    const code = this.getQRCode(userId, qrCodeId);
    if (!code) return false;

    return this.updateQRCode(userId, qrCodeId, { 
      downloadCount: code.downloadCount + 1,
      lastAccessed: new Date().toISOString()
    });
  }

  /**
   * Increment scan count
   */
  static incrementScanCount(userId: string, qrCodeId: string): boolean {
    const code = this.getQRCode(userId, qrCodeId);
    if (!code) return false;

    return this.updateQRCode(userId, qrCodeId, { 
      scanCount: code.scanCount + 1,
      lastScanned: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    });
  }

  /**
   * Get QR code statistics for a user
   */
  static getQRCodeStats(userId: string): QRCodeStats {
    const codes = this.getUserQRCodes(userId);
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

  /**
   * Search QR codes by name, type, or data
   */
  static searchQRCodes(userId: string, query: string): SavedQRCode[] {
    const codes = this.getUserQRCodes(userId);
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
  static filterQRCodesByType(userId: string, type: QRType): SavedQRCode[] {
    const codes = this.getUserQRCodes(userId);
    return codes.filter(code => code.type === type);
  }

  /**
   * Filter QR codes by active status
   */
  static filterQRCodesByStatus(userId: string, isActive: boolean): SavedQRCode[] {
    const codes = this.getUserQRCodes(userId);
    return codes.filter(code => code.isActive === isActive);
  }

  /**
   * Export QR codes as JSON
   */
  static exportQRCodes(userId: string): string {
    const codes = this.getUserQRCodes(userId);
    return JSON.stringify(codes, null, 2);
  }

  /**
   * Import QR codes from JSON
   */
  static importQRCodes(userId: string, jsonData: string): { success: number; errors: string[] } {
    try {
      const importedCodes: SavedQRCode[] = JSON.parse(jsonData);
      const existingCodes = this.getUserQRCodes(userId);
      const errors: string[] = [];
      let successCount = 0;

      for (const code of importedCodes) {
        try {
          // Validate required fields
          if (!code.name || !code.type || !code.data || !code.config) {
            errors.push(`Invalid QR code: ${code.name || 'Unknown'}`);
            continue;
          }

          // Generate new ID and timestamps
          const newCode: SavedQRCode = {
            ...code,
            id: this.generateId(),
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            downloadCount: 0,
            scanCount: 0
          };

          existingCodes.push(newCode);
          successCount++;
        } catch (error) {
          errors.push(`Error importing QR code: ${error}`);
        }
      }

      if (successCount > 0) {
        localStorage.setItem(
          `${this.STORAGE_KEY_PREFIX}${userId}`, 
          JSON.stringify(existingCodes)
        );
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
