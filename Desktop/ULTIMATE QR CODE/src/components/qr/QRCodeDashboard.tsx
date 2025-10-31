import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { QRCodeStorage, SavedQRCode, QRCodeStats } from '@/lib/qrStorage';
import { QRCodeFirestore } from '@/lib/qrCodeFirestore';
import { QRType } from './types';
import { generateQRData } from './utils';
import { 
  Eye, 
  Download, 
  Trash2, 
  Power, 
  PowerOff, 
  Search, 
  BarChart3,
  Download as DownloadIcon,
  Calendar,
  FolderOpen,
  Plus,
  ScanLine
} from 'lucide-react';
import QRCode from 'qrcode.react';
import { createRoot } from 'react-dom/client';

interface QRCodeDashboardProps {
  userId: string;
  onQRCodeSelect: (qrCode: SavedQRCode) => void;
  onBack: () => void;
}

export function QRCodeDashboard({ userId, onQRCodeSelect, onBack }: QRCodeDashboardProps) {
  const [qrCodes, setQrCodes] = useState<SavedQRCode[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<SavedQRCode[]>([]);
  const [stats, setStats] = useState<QRCodeStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<QRType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCode, setSelectedCode] = useState<SavedQRCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    show: boolean;
    qrCodeId: string | null;
    qrCodeName: string;
  }>({
    show: false,
    qrCodeId: null,
    qrCodeName: ''
  });

  // Load QR codes on mount
  useEffect(() => {
    loadQRCodes();
    
    // Subscribe to real-time updates
    const unsubscribe = QRCodeFirestore.subscribeToUserQRCodes(userId, (updatedCodes) => {
      setQrCodes(updatedCodes);
      // Update stats when codes change
      QRCodeFirestore.getQRCodeStats(userId).then(setStats);
    });
    
    return () => unsubscribe();
  }, [userId]);

  // Apply filters when codes or filters change
  useEffect(() => {
    applyFilters().catch(error => {
      console.error('Error applying filters:', error);
    });
  }, [qrCodes, searchQuery, filterType, filterStatus]);

  const loadQRCodes = async () => {
    try {
      const codes = await QRCodeStorage.getUserQRCodes(userId);
      setQrCodes(codes);
      const statsData = await QRCodeStorage.getQRCodeStats(userId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading QR codes:', error);
    }
  };

  const applyFilters = async () => {
    let filtered = [...qrCodes];

    // Apply search filter
    if (searchQuery) {
      try {
        filtered = await QRCodeStorage.searchQRCodes(userId, searchQuery);
      } catch (error) {
        // Fallback to local filtering
        const lowercaseQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(code => 
          code.name.toLowerCase().includes(lowercaseQuery) ||
          code.type.toLowerCase().includes(lowercaseQuery) ||
          code.data.toLowerCase().includes(lowercaseQuery) ||
          code.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
      }
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(code => code.type === filterType);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(code => code.isActive === (filterStatus === 'active'));
    }

    setFilteredCodes(filtered);
  };

  const handleToggleStatus = async (qrCodeId: string) => {
    setIsLoading(true);
    try {
      const success = await QRCodeStorage.toggleQRCodeStatus(userId, qrCodeId);
      if (success) {
        // Codes will be updated via subscription
        await loadQRCodes();
      }
    } catch (error) {
      console.error('Error toggling QR code status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQRCode = (qrCodeId: string) => {
    const qrCode = qrCodes.find(code => code.id === qrCodeId);
    if (!qrCode) return;

    setConfirmationDialog({
      show: true,
      qrCodeId,
      qrCodeName: qrCode.name
    });
  };

  const confirmDeleteQRCode = async () => {
    if (!confirmationDialog.qrCodeId) return;

    setIsLoading(true);
    try {
      const success = await QRCodeStorage.deleteQRCode(userId, confirmationDialog.qrCodeId);
      if (success) {
        // Codes will be updated via subscription
        if (selectedCode?.id === confirmationDialog.qrCodeId) {
          setSelectedCode(null);
        }
      }
    } catch (error) {
      console.error('Error deleting QR code:', error);
    } finally {
      setIsLoading(false);
      setConfirmationDialog({
        show: false,
        qrCodeId: null,
        qrCodeName: ''
      });
    }
  };

  const handleDownloadQRCode = async (qrCode: SavedQRCode) => {
    await QRCodeStorage.incrementDownloadCount(userId, qrCode.id);
    // Codes will be updated via subscription

    // Create download link
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    
    const qrCodeElement = (
      <QRCode
        value={generateQRData(qrCode.type, qrCode.data)}
        size={2048}
        level={qrCode.config.errorCorrection}
        fgColor={qrCode.fgColor}
        bgColor={qrCode.bgColor}
        renderAs="canvas"
      />
    );

    // Render and download
    const tempContainer = document.createElement('div');
    const root = createRoot(tempContainer);
    root.render(qrCodeElement);

    setTimeout(() => {
      const tempCanvas = tempContainer.querySelector('canvas');
      if (tempCanvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempCanvas, 0, 0, 2048, 2048);
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `${qrCode.name}-${Date.now()}.png`;
          link.href = url;
          link.click();
        }
      }
      root.unmount();
    }, 100);
  };

  const handleExportAll = async () => {
    const data = await QRCodeStorage.exportQRCodes(userId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-codes-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  return (
    <div className="min-h-screen bg-blue-600 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={onBack}
            className="text-white/70 hover:text-white mb-4 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to QR Generator</span>
          </button>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">QR Code Library</h1>
              <p className="text-white/70 text-lg">Manage and organize your generated QR codes</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowStats(!showStats)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {showStats ? 'Hide Stats' : 'Show Stats'}
              </Button>
              <Button
                onClick={handleExportAll}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && stats && (
          <div className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.totalCodes}</div>
                <div className="text-white/70 text-sm">Total Codes</div>
              </div>
              <div className="bg-green-500/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-300">{stats.activeCodes}</div>
                <div className="text-white/70 text-sm">Active</div>
              </div>
              <div className="bg-red-500/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-300">{stats.inactiveCodes}</div>
                <div className="text-white/70 text-sm">Inactive</div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-300">{stats.totalDownloads}</div>
                <div className="text-white/70 text-sm">Downloads</div>
              </div>
              <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-300">{stats.totalScans}</div>
                <div className="text-white/70 text-sm">Total Scans</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-white/70 text-sm">
                Most used type: <span className="font-semibold text-white">{stats.mostUsedType}</span>
                {stats.mostScannedCode && (
                  <span className="ml-4">
                    Most scanned: <span className="font-semibold text-white">{stats.mostScannedCode.name}</span> ({stats.mostScannedCode.scanCount} scans)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <input
                type="text"
                placeholder="Search QR codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 text-white placeholder-white/50 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as QRType | 'all')}
              className="px-4 py-3 bg-white/20 text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="all">All Types</option>
              <option value="url">URL</option>
              <option value="location">Location</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="wifi">WiFi</option>
              <option value="event">Event</option>
              <option value="vcard">Contact</option>
              <option value="crypto">Crypto</option>
              <option value="text">Text</option>
              <option value="document">Document</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-3 bg-white/20 text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* QR Codes Grid */}
        {filteredCodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCodes.map((qrCode) => (
              <div
                key={qrCode.id}
                className={`bg-white/10 rounded-xl p-6 border transition-all duration-300 hover:bg-white/15 ${
                  selectedCode?.id === qrCode.id
                    ? 'border-blue-400 bg-blue-500/20'
                    : 'border-white/20'
                } ${!qrCode.isActive ? 'opacity-60' : ''}`}
              >
                {/* QR Code Preview */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-3 rounded-lg">
                    <QRCode
                      value={generateQRData(qrCode.type, qrCode.data)}
                      size={120}
                      level={qrCode.config.errorCorrection}
                      fgColor={qrCode.fgColor}
                      bgColor={qrCode.bgColor}
                      renderAs="canvas"
                    />
                  </div>
                </div>

                {/* QR Code Info */}
                <div className="space-y-2 mb-4">
                  <h3 className="text-white font-semibold truncate">{qrCode.name}</h3>
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <span className="bg-white/20 px-2 py-1 rounded text-xs">
                      {qrCode.type.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      qrCode.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {qrCode.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs truncate">{qrCode.data}</p>
                  <div className="flex items-center gap-4 text-white/50 text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(qrCode.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {qrCode.downloadCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <ScanLine className="w-3 h-3" />
                      {qrCode.scanCount || 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => onQRCodeSelect(qrCode)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Use
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleDownloadQRCode(qrCode)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleToggleStatus(qrCode.id)}
                    disabled={isLoading}
                    className={`${
                      qrCode.isActive 
                        ? 'bg-orange-600 hover:bg-orange-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {qrCode.isActive ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleDeleteQRCode(qrCode.id)}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/10 rounded-xl p-12 text-center border border-white/20">
            <FolderOpen className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                ? 'No QR codes match your filters' 
                : 'No QR codes yet'
              }
            </h3>
            <p className="text-white/70 mb-6">
              {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Generate your first QR code to get started'
              }
            </p>
            {(!searchQuery && filterType === 'all' && filterStatus === 'all') && (
              <Button
                onClick={onBack}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create QR Code
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        show={confirmationDialog.show}
        onConfirm={confirmDeleteQRCode}
        onCancel={() => setConfirmationDialog({
          show: false,
          qrCodeId: null,
          qrCodeName: ''
        })}
        title="Delete QR Code"
        message={`Are you sure you want to delete "${confirmationDialog.qrCodeName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
