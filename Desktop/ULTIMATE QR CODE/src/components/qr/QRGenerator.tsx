import { useState } from 'react';
import { QRConfig, QRType } from './types';
import { generateQRData } from './utils';
import { QRTypeSelector } from './QRTypeSelector';
import { QRDisplay } from './QRDisplay';
import { QRStyleOptions } from './QRStyleOptions';
import { QR_TYPES } from './constants';
import { DocumentDashboard } from '../documents/DocumentDashboard';
import { QRCodeDashboard } from './QRCodeDashboard';
import { DocumentMetadata } from '@/lib/cloudinary';
import { SavedQRCode, QRCodeStorage } from '@/lib/qrStorage';
import { useAuth } from '@/hooks/useAuth';
import { FloatingNotification } from '@/components/ui/FloatingNotification';
import { QrCode, Smartphone, Wifi, Mail, MapPin, Calendar, CreditCard, FileText, Zap, FolderOpen, Save } from 'lucide-react';

const initialQRConfig: QRConfig = {
  type: '',
  data: '',
  style: 'squares',
  errorCorrection: 'M',
  gradient: {
    enabled: false,
    colors: ['#6366f1', '#8b5cf6'],
    type: 'linear'
  },
  animation: {
    enabled: false,
    type: 'fade'
  }
};

export function QRGenerator() {
  const { user } = useAuth();
  const [qrConfig, setQrConfig] = useState<QRConfig>(initialQRConfig);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showDocumentDashboard, setShowDocumentDashboard] = useState(false);
  const [showQRCodeDashboard, setShowQRCodeDashboard] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
  const [qrCodeName, setQrCodeName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<SavedQRCode | null>(null);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message?: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  const currentType = QR_TYPES.find(t => t.type === qrConfig.type);
  const isValid = !currentType?.validation || currentType.validation.test(qrConfig.data);
  const formattedData = currentType?.format ? currentType.format(qrConfig.data) : qrConfig.data;

  const handleDataChange = (input: string) => {
    setQrConfig(prev => ({ ...prev, data: input }));
  };

  const handleConfigChange = (updates: Partial<QRConfig>) => {
    setQrConfig(prev => ({ ...prev, ...updates }));
  };

  const handleDocumentSelect = (document: DocumentMetadata) => {
    setSelectedDocument(document);
    // Create an app URL that will handle document viewing
    const documentViewerUrl = `${window.location.origin}/document/${document.id}`;
    setQrConfig(prev => ({
      ...prev,
      type: 'document',
      data: documentViewerUrl
    }));
    setShowDocumentDashboard(false);
    
    // Update the browser URL to reflect the document selection
    window.history.pushState({}, '', `/document/${document.id}`);
  };

  const handleQRCodeSelect = (qrCode: SavedQRCode) => {
    setQrConfig(qrCode.config);
    setFgColor(qrCode.fgColor);
    setBgColor(qrCode.bgColor);
    setQrCodeName(qrCode.name);
    setSelectedQRCode(qrCode);
    setShowQRCodeDashboard(false);
  };

  const handleSaveQRCode = () => {
    if (!qrCodeName.trim() || !qrConfig.data || !isValid || !user) return;

    const savedQRCode = QRCodeStorage.saveQRCode({
      name: qrCodeName.trim(),
      type: qrConfig.type as QRType,
      data: qrConfig.data,
      config: qrConfig,
      fgColor,
      bgColor,
      userId: user.uid,
      isActive: true
    });

    setShowSaveForm(false);
    setQrCodeName('');
    
    // Show floating notification instead of alert
    setNotification({
      show: true,
      type: 'success',
      title: 'QR Code Saved!',
      message: `"${savedQRCode.name}" has been saved successfully`
    });
  };

  const handleQuickGenerate = () => {
    // Set default URL QR code with sample data
    setQrConfig(prev => ({
      ...prev,
      type: 'url',
      data: 'https://example.com'
    }));
    setFgColor('#000000');
    setBgColor('#ffffff');
  };

  if (showDocumentDashboard) {
    return (
      <div className="min-h-screen bg-blue-600 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setShowDocumentDashboard(false)}
              className="text-white/70 hover:text-white mb-4"
            >
              ← Back to QR Generator
            </button>
            <h1 className="text-4xl font-bold text-white">Document Management</h1>
          </div>
          <DocumentDashboard
            userId={user?.uid || ''}
            onDocumentSelect={handleDocumentSelect}
          />
        </div>
      </div>
    );
  }

  if (showQRCodeDashboard) {
    return (
      <QRCodeDashboard
        userId={user?.uid || ''}
        onQRCodeSelect={handleQRCodeSelect}
        onBack={() => setShowQRCodeDashboard(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-blue-600 relative overflow-hidden p-4 lg:p-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating QR Code Icons */}
        <div className="absolute top-10 left-10 animate-float">
          <QrCode className="w-8 h-8 text-white/20" />
        </div>
        <div className="absolute top-20 right-20 animate-float-delayed">
          <QrCode className="w-6 h-6 text-white/15" />
        </div>
        <div className="absolute top-40 left-1/4 animate-float-slow">
          <QrCode className="w-10 h-10 text-white/10" />
        </div>
        <div className="absolute top-60 right-1/4 animate-float">
          <QrCode className="w-7 h-7 text-white/25" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float-delayed">
          <QrCode className="w-9 h-9 text-white/20" />
        </div>
        <div className="absolute bottom-20 right-10 animate-float-slow">
          <QrCode className="w-5 h-5 text-white/30" />
        </div>
        
        {/* Floating Tech Icons */}
        <div className="absolute top-32 left-1/3 animate-float">
          <Smartphone className="w-6 h-6 text-white/15" />
        </div>
        <div className="absolute top-50 right-1/3 animate-float-delayed">
          <Wifi className="w-8 h-8 text-white/20" />
        </div>
        <div className="absolute bottom-32 left-1/3 animate-float-slow">
          <Mail className="w-7 h-7 text-white/25" />
        </div>
        <div className="absolute bottom-50 right-1/3 animate-float">
          <MapPin className="w-5 h-5 text-white/20" />
        </div>
        <div className="absolute top-80 left-1/2 animate-float-delayed">
          <Calendar className="w-6 h-6 text-white/15" />
        </div>
        <div className="absolute bottom-80 right-1/2 animate-float-slow">
          <CreditCard className="w-8 h-8 text-white/20" />
        </div>
        <div className="absolute top-100 left-10 animate-float">
          <FileText className="w-7 h-7 text-white/25" />
        </div>
        <div className="absolute bottom-100 right-20 animate-float-delayed">
          <Zap className="w-6 h-6 text-white/30" />
        </div>
        
        {/* Additional QR Code Elements */}
        <div className="absolute top-1/4 left-1/4 animate-qr-pulse">
          <QrCode className="w-12 h-12 text-white/5" />
        </div>
        <div className="absolute top-3/4 right-1/4 animate-qr-bounce">
          <QrCode className="w-8 h-8 text-white/8" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 animate-qr-rotate">
          <QrCode className="w-6 h-6 text-white/6" />
        </div>
        <div className="absolute top-1/2 right-1/3 animate-qr-scale">
          <QrCode className="w-10 h-10 text-white/4" />
        </div>
      </div>

      {/* Professional Header */}
      <div className="max-w-7xl mx-auto mb-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-5xl font-bold text-white mb-2">
              Future Tech QR Generator
            </h1>
            <p className="text-white/70 text-lg">Create professional QR codes with advanced customization</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0 lg:ml-4">
            <button
              onClick={() => setShowQRCodeDashboard(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30 flex items-center gap-2 font-medium"
            >
              <FolderOpen className="w-5 h-5" />
              <span>QR Library</span>
            </button>
            <button
              onClick={() => setShowDocumentDashboard(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30 flex items-center gap-2 font-medium"
            >
              <span className="text-lg">📁</span>
              <span>Manage Documents</span>
            </button>
            <button 
              onClick={handleQuickGenerate}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30 flex items-center gap-2 font-medium"
            >
              <span className="text-lg">⚡</span>
              <span>Quick Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8 lg:gap-12">
          {/* Left Panel - Controls */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-2xl h-fit">
            <div className="space-y-4 sm:space-y-6">
              {/* QR Type Selection - Only show if no type selected */}
              {!qrConfig.type && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">QR Code Type</h3>
                  <QRTypeSelector
                    selectedType={qrConfig.type as QRType}
                    onTypeChange={(type) => setQrConfig({ ...qrConfig, type })}
                  />
                </div>
              )}

              {/* Data Input - Only show after QR type is selected */}
              {qrConfig.type && (
                <div className="space-y-3">
                  <label className="text-gray-800 font-medium">Content</label>
                  {selectedDocument && (
                    <div className="bg-green-100 border border-green-300 rounded-xl p-3 mb-3">
                      <p className="text-green-800 text-sm font-medium">
                        📄 Selected: {selectedDocument.originalName}
                      </p>
                      <p className="text-green-600 text-xs">
                        Click "Manage Documents" to change
                      </p>
                    </div>
                  )}
                  <input
                    type="text"
                    value={qrConfig.data}
                    onChange={(e) => handleDataChange(e.target.value)}
                    placeholder={currentType?.placeholder || `Enter ${qrConfig.type}...`}
                    className={`w-full px-4 py-4 rounded-xl bg-gray-50 border text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      isValid 
                        ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-200' 
                        : 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    }`}
                  />
                  {!isValid && qrConfig.data && (
                    <p className="text-red-600 text-sm flex items-center gap-2">
                      <span>⚠️</span>
                      Please enter a valid {qrConfig.type} format
                    </p>
                  )}
                </div>
              )}

              {/* Style Options - Only show after QR type is selected */}
              {qrConfig.type && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Customization</h3>
                  <QRStyleOptions
                    config={qrConfig}
                    onConfigChange={handleConfigChange}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    onColorChange={{
                      setFgColor,
                      setBgColor
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - QR Display */}
          <div className="flex flex-col justify-start lg:justify-center lg:sticky lg:top-8 lg:self-start">
            <QRDisplay
              value={qrConfig.type ? generateQRData(qrConfig.type as QRType, formattedData) : ''}
              fgColor={fgColor}
              bgColor={bgColor}
              config={qrConfig}
              disabled={!qrConfig.data || !isValid}
              onSave={() => setShowSaveForm(true)}
              canSave={!!qrConfig.data && isValid}
              qrCodeId={selectedQRCode?.id}
              userId={user?.uid}
              scanCount={selectedQRCode?.scanCount || 0}
              showAnalytics={!!selectedQRCode}
            />
            
            {/* Save QR Code Form */}
            {showSaveForm && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-2xl mt-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Save QR Code</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">QR Code Name</label>
                    <input
                      type="text"
                      value={qrCodeName}
                      onChange={(e) => setQrCodeName(e.target.value)}
                      placeholder="Enter a name for your QR code..."
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveQRCode}
                      disabled={!qrCodeName.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save QR Code
                    </button>
                    <button
                      onClick={() => setShowSaveForm(false)}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-300 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Notification */}
      <FloatingNotification
        show={notification.show}
        onHide={() => setNotification(prev => ({ ...prev, show: false }))}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}