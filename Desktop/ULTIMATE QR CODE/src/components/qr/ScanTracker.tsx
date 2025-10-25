import { useEffect, useState } from 'react';
import { QRCodeStorage, SavedQRCode } from '@/lib/qrStorage';
import { ScanTracker as ScanTrackerLib } from '@/lib/scanTracker';
import { generateQRData } from './utils';
import QRCode from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Eye, BarChart3 } from 'lucide-react';

interface ScanTrackerProps {
  onBack: () => void;
  qrCodeId?: string;
  userId?: string;
}

export function ScanTracker({ onBack, qrCodeId, userId }: ScanTrackerProps) {
  // Get parameters from URL if not provided as props
  const urlParams = new URLSearchParams(window.location.search);
  const finalQrCodeId = qrCodeId || urlParams.get('qrCodeId');
  const finalUserId = userId || urlParams.get('user');
  
  const [qrCode, setQrCode] = useState<SavedQRCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scanTracked, setScanTracked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!finalQrCodeId || !finalUserId) {
      setError('Invalid QR code or user ID');
      setIsLoading(false);
      return;
    }

    // Load QR code data
    const code = QRCodeStorage.getQRCode(finalUserId, finalQrCodeId);
    if (!code) {
      setError('QR code not found');
      setIsLoading(false);
      return;
    }

    setQrCode(code);

    // Track the scan
    const success = ScanTrackerLib.trackScan(finalQrCodeId, finalUserId, {
      userAgent: navigator.userAgent,
      referrer: document.referrer || undefined
    });

    if (success) {
      setScanTracked(true);
      // Update the QR code with new scan count
      const updatedCode = QRCodeStorage.getQRCode(finalUserId, finalQrCodeId);
      if (updatedCode) {
        setQrCode(updatedCode);
      }
    }

    setIsLoading(false);
  }, [finalQrCodeId, finalUserId]);

  const handleRedirect = () => {
    if (!qrCode) return;

    const qrData = generateQRData(qrCode.type, qrCode.data);
    
    // Handle different QR code types
    switch (qrCode.type) {
      case 'url':
        window.open(qrData, '_blank');
        break;
      case 'document':
        // Open document in new tab
        window.open(qrData, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:${qrData}`;
        break;
      case 'phone':
        window.location.href = `tel:${qrData}`;
        break;
      case 'location':
        window.open(`https://maps.google.com/?q=${encodeURIComponent(qrData)}`, '_blank');
        break;
      case 'wifi':
        // For WiFi, we can't automatically connect, so show the details
        alert(`WiFi Network: ${qrData}`);
        break;
      case 'vcard':
        // For contact QR codes, try to open contact app or show formatted contact
        try {
          // Try to create a downloadable vCard file
          const blob = new Blob([qrData], { type: 'text/vcard' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'contact.vcf';
          link.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          // Fallback to showing contact info
          alert(`Contact Information:\n${qrData}`);
        }
        break;
      case 'event':
        // For event QR codes, try to open calendar or show formatted event
        try {
          // Try to create a downloadable calendar file
          const blob = new Blob([qrData], { type: 'text/calendar' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'event.ics';
          link.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          // Fallback to showing event info
          alert(`Event Information:\n${qrData}`);
        }
        break;
      case 'crypto':
        // For crypto QR codes, try to open wallet or show formatted address
        const cryptoInfo = qrData.split(':');
        if (cryptoInfo.length === 2) {
          const [currency, address] = cryptoInfo;
          alert(`${currency.toUpperCase()} Address:\n${address}\n\nCopy this address to your wallet app.`);
        } else {
          alert(`Cryptocurrency Address:\n${qrData}`);
        }
        break;
      case 'text':
        // For text QR codes, show the content
        alert(qrData);
        break;
      default:
        // For other types, show the data
        alert(qrData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading QR code...</p>
        </div>
      </div>
    );
  }

  if (error || !qrCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-white/80 mb-6">{error || 'QR code not found'}</p>
          <Button
            onClick={onBack}
            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center">
        {/* Success Message */}
        {scanTracked && (
          <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 mb-6">
            <div className="text-green-400 text-4xl mb-2">✓</div>
            <p className="text-green-300 font-semibold">Scan Tracked Successfully!</p>
            <p className="text-green-200 text-sm mt-1">
              This QR code has been scanned {qrCode.scanCount} times
            </p>
          </div>
        )}

        {/* QR Code Preview */}
        <div className="bg-white p-4 rounded-xl mb-6">
          <QRCode
            value={generateQRData(qrCode.type, qrCode.data)}
            size={200}
            level={qrCode.config.errorCorrection}
            fgColor={qrCode.fgColor}
            bgColor={qrCode.bgColor}
            renderAs="canvas"
          />
        </div>

        {/* QR Code Info */}
        <div className="text-white mb-6">
          <h2 className="text-2xl font-bold mb-2">{qrCode.name}</h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {qrCode.type.toUpperCase()}
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {qrCode.scanCount} scans
            </span>
          </div>
          <p className="text-white/80 text-sm mb-4">{qrCode.data}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleRedirect}
            className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20 py-3"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            {qrCode.type === 'url' ? 'Open Link' : 
             qrCode.type === 'document' ? 'Open Document' :
             qrCode.type === 'email' ? 'Send Email' :
             qrCode.type === 'phone' ? 'Call Number' :
             qrCode.type === 'location' ? 'Open in Maps' :
             qrCode.type === 'wifi' ? 'View WiFi Details' :
             qrCode.type === 'vcard' ? 'Add Contact' :
             qrCode.type === 'event' ? 'Add to Calendar' :
             qrCode.type === 'crypto' ? 'View Address' :
             qrCode.type === 'text' ? 'View Text' :
             'View Content'}
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={onBack}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Eye className="w-4 h-4 mr-2" />
              Track Again
            </Button>
          </div>
        </div>

        {/* Scan Analytics Info */}
        <div className="mt-6 bg-white/5 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-sm">Scan Analytics</span>
          </div>
          <p className="text-white/50 text-xs">
            This scan has been recorded and will appear in your analytics dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
