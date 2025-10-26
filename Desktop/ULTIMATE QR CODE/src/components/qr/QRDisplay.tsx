import QRCode from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, Save, Eye, BarChart3 } from 'lucide-react';
import { QRConfig } from './types';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SuccessNotification } from '@/components/ui/SuccessNotification';
import { ScanTracker } from '@/lib/scanTracker';

interface QRDisplayProps {
  value: string;
  fgColor: string;
  bgColor: string;
  config: QRConfig;
  disabled?: boolean;
  onSave?: () => void;
  canSave?: boolean;
  qrCodeId?: string;
  userId?: string;
  scanCount?: number;
  showAnalytics?: boolean;
}

export function QRDisplay({ value, fgColor, bgColor, config, disabled, onSave, canSave, qrCodeId, userId, scanCount = 0, showAnalytics = false }: QRDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const downloadSize = 2048; // High resolution for downloads
  const displaySize = 160; // Smaller base size for mobile
  const [showSuccess, setShowSuccess] = useState(false);
  const [showScanAnalytics, setShowScanAnalytics] = useState(false);
  const [scanAnalytics, setScanAnalytics] = useState<any>(null);

  useEffect(() => {
    if (config?.animation?.enabled && qrRef.current) {
      const element = qrRef.current;
      
      switch (config.animation.type) {
        case 'fade':
          element.style.animation = 'qr-fade 2s infinite';
          break;
        case 'scan':
          element.style.animation = 'qr-scan 2s infinite';
          break;
        case 'rotate':
          element.style.animation = 'qr-rotate 3s infinite';
          break;
        default:
          element.style.animation = '';
      }
    } else if (qrRef.current) {
      qrRef.current.style.animation = '';
    }
  }, [config?.animation]);

  // Load scan analytics when component mounts
  useEffect(() => {
    if (showAnalytics && qrCodeId && userId) {
      const analytics = ScanTracker.getScanAnalytics(userId);
      setScanAnalytics(analytics);
    }
  }, [showAnalytics, qrCodeId, userId]);

  const handleDownload = () => {
    // Create a temporary canvas for high-resolution download with padding
    const padding = 80; // Padding around QR code (equivalent to p-4 lg:p-6)
    const canvas = document.createElement('canvas');
    canvas.width = downloadSize + (padding * 2);
    canvas.height = downloadSize + (padding * 2);
    
    const qrCode = (
      <QRCode
        value={value || ''}
        size={downloadSize}
        level={config?.errorCorrection || 'H'} // Using highest error correction for downloads
        fgColor={fgColor}
        bgColor={bgColor}
        imageSettings={config?.logo ? {
          src: config.logo.url,
          height: downloadSize * 0.25, // Scale logo proportionally
          width: downloadSize * 0.25,
          excavate: true
        } : undefined}
        renderAs="canvas"
        {...getQRStyle()}
      />
    );

    // Render the high-res QR code to the canvas
    const tempContainer = document.createElement('div');
    const root = createRoot(tempContainer);
    root.render(qrCode);

    // Wait for the QR code to render
    setTimeout(() => {
      const tempCanvas = tempContainer.querySelector('canvas');
      if (tempCanvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill background with white (like the container in the app)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Apply any gradient or effects
          if (config?.gradient?.enabled) {
            const gradient = ctx.createLinearGradient(padding, padding, downloadSize + padding, downloadSize + padding);
            config.gradient.colors.forEach((color, index) => {
              gradient.addColorStop(index / (config.gradient.colors.length - 1), color);
            });
            ctx.fillStyle = gradient;
            ctx.fillRect(padding, padding, downloadSize, downloadSize);
            ctx.globalCompositeOperation = 'multiply';
          }

          // Draw the QR code with padding (centered)
          ctx.drawImage(tempCanvas, padding, padding, downloadSize, downloadSize);

          // Create download link
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `ultimate-qr-code-${Date.now()}.png`;
          link.href = url;
          link.click();
          
          // Show success notification
          setShowSuccess(true);
        }
      }
      root.unmount();
    }, 100);
  };

  const getQRStyle = () => {
    switch (config?.style) {
      case 'dots':
        return { width: 0.5, height: 0.5, x: 0.25, y: 0.25 };
      case 'rounded':
        return { width: 0.9, height: 0.9, x: 0.05, y: 0.05, radius: 0.5 };
      case 'classy':
        return { width: 0.75, height: 0.75, x: 0.125, y: 0.125, radius: 0.2 };
      case 'edges':
        return { width: 1, height: 1, x: 0, y: 0, radius: 0.1 };
      default:
        return { width: 1, height: 1, x: 0, y: 0 };
    }
  };

  const renderQRCode = () => (
    <QRCode
      value={value || ''}
      size={displaySize} // Smaller size for mobile displays
      level={config?.errorCorrection || 'M'}
      fgColor={fgColor}
      bgColor={bgColor}
      imageSettings={config?.logo ? {
        src: config.logo.url,
        height: config.logo.size,
        width: config.logo.size,
        excavate: true
      } : undefined}
      renderAs="canvas"
      {...getQRStyle()}
    />
  );

  return (
    <>
      <div className="flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-2xl">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Your QR Code</h3>
          <p className="text-gray-600">Preview and download your generated QR code</p>
        </div>
        
        <div 
          ref={qrRef}
          className={`bg-white p-4 lg:p-6 rounded-2xl shadow-lg mb-8 ${
            config?.gradient?.enabled ? 'qr-gradient' : ''
          } max-w-full transition-all duration-500 hover:scale-105 overflow-hidden`}
          style={config?.gradient?.enabled ? {
            '--gradient-colors': config.gradient.colors.join(','),
            '--gradient-type': config.gradient.type
          } as React.CSSProperties : undefined}
        >
          {renderQRCode()}
        </div>
        
        <div className="w-full text-center space-y-3 sm:space-y-4">
          {/* Scan Count Display */}
          {showAnalytics && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-blue-800">
                  {scanCount} {scanCount === 1 ? 'Scan' : 'Scans'}
                </span>
              </div>
              <p className="text-sm text-blue-600">
                Track how many times this QR code has been scanned
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex-1 text-base sm:text-lg"
              disabled={disabled}
            >
              <Download className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" />
              <span className="leading-tight">Download</span>
            </Button>
            
            {onSave && canSave && (
              <Button
                onClick={onSave}
                className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex-1 text-base sm:text-lg"
              >
                <Save className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" />
                <span className="leading-tight">Save QR Code</span>
              </Button>
            )}

            {showAnalytics && (
              <Button
                onClick={() => setShowScanAnalytics(!showScanAnalytics)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex-1 text-base sm:text-lg"
              >
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4" />
                <span className="leading-tight">Analytics</span>
              </Button>
            )}
          </div>
          
          <div className="bg-blue-100 rounded-xl p-4 border border-blue-200">
            <p className="text-blue-800 text-sm font-medium">
              <span className="text-green-600">✓</span> Downloads in 2208x2208px resolution with padding
            </p>
            <p className="text-blue-600 text-xs mt-1">
              Professional quality for print and digital use with proper spacing
            </p>
          </div>
        </div>

        {/* Scan Analytics Modal */}
        {showScanAnalytics && scanAnalytics && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Scan Analytics</h3>
                <Button
                  onClick={() => setShowScanAnalytics(false)}
                  className="text-gray-500 hover:text-gray-700"
                  variant="ghost"
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Stats */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">Overall Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-600">Total Scans:</span>
                      <span className="font-semibold text-blue-800">{scanAnalytics.totalScans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">QR Codes Tracked:</span>
                      <span className="font-semibold text-blue-800">{scanAnalytics.uniqueQRCodes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Avg Scans/Code:</span>
                      <span className="font-semibold text-blue-800">{scanAnalytics.averageScansPerCode}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                  <h4 className="font-semibold text-green-800 mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-600">Last 24 Hours:</span>
                      <span className="font-semibold text-green-800">{scanAnalytics.recentScans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Last 7 Days:</span>
                      <span className="font-semibold text-green-800">{scanAnalytics.weeklyScans}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Most Scanned QR Codes */}
              {scanAnalytics.mostScanned.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Most Scanned QR Codes</h4>
                  <div className="space-y-2">
                    {scanAnalytics.mostScanned.map((item: any, index: number) => (
                      <div key={item.qrCode?.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-800">{item.qrCode?.name}</p>
                            <p className="text-sm text-gray-500">{item.qrCode?.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-purple-800">{item.scanCount} scans</p>
                          {item.lastScan && (
                            <p className="text-xs text-gray-500">
                              Last: {new Date(item.lastScan).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <SuccessNotification 
        show={showSuccess} 
        onHide={() => setShowSuccess(false)} 
      />
    </>
  );
}