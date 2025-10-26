import { QRConfig, QRTemplate, ErrorCorrectionLevel } from './types';
import { QR_TEMPLATES, ERROR_CORRECTION_LEVELS } from './constants';
import { Button } from '@/components/ui/button';
import { ColorPicker } from './ColorPicker';
import { Wand2, Upload } from 'lucide-react';

interface QRStyleOptionsProps {
  config: QRConfig;
  onConfigChange: (config: Partial<QRConfig>) => void;
  fgColor: string;
  bgColor: string;
  onColorChange: {
    setFgColor: (color: string) => void;
    setBgColor: (color: string) => void;
  };
}

export function QRStyleOptions({
  config,
  onConfigChange,
  fgColor,
  bgColor,
  onColorChange
}: QRStyleOptionsProps) {
  const handleTemplateSelect = (template: QRTemplate) => {
    onConfigChange({
      style: template.style,
      errorCorrection: template.errorCorrection,
      gradient: template.gradient ? {
        ...template.gradient,
        enabled: false  // Keep gradient colors but disabled by default
      } : {
        enabled: false,
        colors: ['#6366f1', '#8b5cf6'],
        type: 'linear'
      }
    });
    onColorChange.setFgColor(template.fgColor);
    onColorChange.setBgColor(template.bgColor);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onConfigChange({
          logo: {
            url: reader.result as string,
            size: 50 // Default size
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-gray-800 text-lg font-semibold mb-4">Templates</h3>
        <div className="grid grid-cols-2 gap-3">
          {QR_TEMPLATES.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${
                config.style === template.style
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg hover:bg-blue-700'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              <Wand2 className="w-5 h-5" />
              <span className="font-medium">{template.name}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ColorPicker
          label="QR Color"
          value={fgColor}
          onChange={onColorChange.setFgColor}
        />
        <ColorPicker
          label="Background"
          value={bgColor}
          onChange={onColorChange.setBgColor}
        />
      </div>

      <div>
        <h3 className="text-gray-800 text-lg font-semibold mb-4">Error Correction</h3>
        <div className="grid grid-cols-2 gap-3">
          {ERROR_CORRECTION_LEVELS.map(({ value, label }) => (
            <Button
              key={value}
              variant="outline"
              className={`p-3 rounded-xl transition-all duration-300 ${
                config.errorCorrection === value
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg hover:bg-blue-700'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
              }`}
              onClick={() => onConfigChange({ errorCorrection: value as ErrorCorrectionLevel })}
            >
              <span className="font-medium">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-gray-800 text-lg font-semibold mb-4">Logo Overlay</h3>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400 flex-1 p-4 rounded-xl transition-all duration-300"
            onClick={() => document.getElementById('logo-upload')?.click()}
          >
            <Upload className="w-5 h-5 mr-3" />
            <span className="font-medium">Upload Logo</span>
          </Button>
          {config.logo && (
            <Button
              variant="outline"
              className="bg-red-100 border-red-300 text-red-700 hover:bg-red-200 hover:border-red-400 p-4 rounded-xl transition-all duration-300"
              onClick={() => onConfigChange({ logo: undefined })}
            >
              <span className="font-medium">Remove</span>
            </Button>
          )}
          <input
            type="file"
            id="logo-upload"
            className="hidden"
            accept="image/*"
            onChange={handleLogoUpload}
          />
        </div>
      </div>

      <div>
        <h3 className="text-gray-800 text-lg font-semibold mb-4">Gradient Background</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className={`p-4 rounded-xl transition-all duration-300 ${
              config.gradient.enabled
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg hover:bg-blue-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
            }`}
            onClick={() =>
              onConfigChange({
                gradient: {
                  enabled: !config.gradient.enabled,
                  colors: config.gradient.colors,
                  type: config.gradient.type
                }
              })
            }
          >
            <span className="font-medium">
              {config.gradient.enabled ? 'Disable' : 'Enable'} Gradient
            </span>
          </Button>
        </div>
        {config.gradient.enabled && config.gradient.colors.length > 0 && (
          <div className="mt-2 p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">Gradient Colors:</p>
            <div className="flex gap-2">
              {config.gradient.colors.map((color, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded-lg border-2 border-gray-300"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-gray-800 text-lg font-semibold mb-4">Animation</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className={`p-4 rounded-xl transition-all duration-300 ${
              config.animation.enabled
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg hover:bg-blue-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
            }`}
            onClick={() =>
              onConfigChange({
                animation: {
                  enabled: !config.animation.enabled,
                  type: config.animation.type
                }
              })
            }
          >
            <span className="font-medium">
              {config.animation.enabled ? 'Disable' : 'Enable'} Animation
            </span>
          </Button>
          {config.animation.enabled && (
            <select
              className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-4 text-gray-700 appearance-none cursor-pointer hover:bg-gray-200 hover:border-gray-400 transition-all duration-300 font-medium"
              value={config.animation.type}
              onChange={(e) =>
                onConfigChange({
                  animation: {
                    enabled: true,
                    type: e.target.value as 'fade' | 'scan' | 'rotate'
                  }
                })
              }
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none'
              }}
            >
              <option value="fade" className="bg-gray-100 text-gray-700">Fade</option>
              <option value="scan" className="bg-gray-100 text-gray-700">Scan</option>
              <option value="rotate" className="bg-gray-100 text-gray-700">Rotate</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
} 