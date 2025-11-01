import { QRType } from './types';

// Maximum data length to keep QR code at lower version (fewer modules)
// Version 2 = 25x25 modules (625 modules total, ~47 chars max at L level)
// Version 3 = 29x29 modules (841 modules total, ~77 chars max at L level) 
// Limiting to ~60 chars ensures Version 2-3 maximum (fewer modules)
const MAX_DATA_LENGTH = 60;

function limitDataLength(data: string): string {
  if (data.length > MAX_DATA_LENGTH) {
    // Truncate to max length to reduce modules
    return data.substring(0, MAX_DATA_LENGTH);
  }
  return data;
}

export function generateQRData(type: QRType, data: string): string {
  const limitedData = limitDataLength(data);
  
  switch (type) {
    case 'location':
      return `geo:${limitedData}`;
    case 'email':
      return `mailto:${limitedData}`;
    case 'phone':
      return `tel:${limitedData}`;
    case 'wifi':
      return `WIFI:T:WPA;S:${limitedData};`;
    case 'event':
      return `BEGIN:VEVENT\nSUMMARY:${limitedData}\nEND:VEVENT`;
    default:
      return limitedData;
  }
}