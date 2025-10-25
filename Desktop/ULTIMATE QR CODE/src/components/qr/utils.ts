import { QRType } from './types';

export function generateQRData(type: QRType, data: string): string {
  switch (type) {
    case 'location':
      return `geo:${data}`;
    case 'email':
      return `mailto:${data}`;
    case 'phone':
      return `tel:${data}`;
    case 'wifi':
      return `WIFI:T:WPA;S:${data};`;
    case 'event':
      return `BEGIN:VEVENT\nSUMMARY:${data}\nEND:VEVENT`;
    default:
      return data;
  }
}