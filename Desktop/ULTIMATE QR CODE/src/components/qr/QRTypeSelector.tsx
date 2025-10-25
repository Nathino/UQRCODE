import { QRType, QRTypeOption } from './types';
import { QR_TYPES } from './constants';
import { Button } from '@/components/ui/button';

interface QRTypeSelectorProps {
  selectedType: QRType | '';
  onTypeChange: (type: QRType) => void;
}

export function QRTypeSelector({ selectedType, onTypeChange }: QRTypeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {QR_TYPES.map(({ type, icon: Icon, label }: QRTypeOption) => (
        <Button
          key={type}
          variant="outline"
          className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${
            selectedType === type 
              ? 'bg-blue-600 text-white border-blue-400 shadow-lg hover:bg-blue-700' 
              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
          }`}
          onClick={() => onTypeChange(type)}
        >
          <Icon className="w-5 h-5" />
          <span className="text-sm font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
}