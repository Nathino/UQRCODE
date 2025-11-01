import { Link, MapPin, Mail, Phone, Wifi, Calendar, CreditCard, Coins, FileText, File } from 'lucide-react';
import { QRTypeOption, QRTemplate } from './types';

export const QR_TYPES: QRTypeOption[] = [
  { 
    type: 'url', 
    icon: Link, 
    label: 'URL',
    placeholder: 'https://example.com',
    validation: /^https?:\/\/.+/,
    format: (input) => input.startsWith('http') ? input : `https://${input}`
  },
  { 
    type: 'location', 
    icon: MapPin, 
    label: 'Location',
    placeholder: '40.7128,-74.0060',
    validation: /^-?\d+\.\d+,-?\d+\.\d+$/
  },
  { 
    type: 'email', 
    icon: Mail, 
    label: 'Email',
    placeholder: 'example@email.com',
    validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  { 
    type: 'phone', 
    icon: Phone, 
    label: 'Phone',
    placeholder: '+1234567890',
    validation: /^\+?\d{10,}$/,
    format: (input) => input.startsWith('+') ? input : `+${input.replace(/\D/g, '')}`
  },
  { 
    type: 'wifi', 
    icon: Wifi, 
    label: 'WiFi',
    placeholder: 'SSID,password,WPA',
    format: (input) => {
      const [ssid, pass, type = 'WPA'] = input.split(',');
      return `WIFI:T:${type};S:${ssid};P:${pass};;`;
    }
  },
  { 
    type: 'event', 
    icon: Calendar, 
    label: 'Event',
    placeholder: 'Title,2024-03-30T15:00:00Z,2024-03-30T17:00:00Z',
    format: (input) => {
      const [title, start, end] = input.split(',');
      return `BEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT`;
    }
  },
  { 
    type: 'vcard', 
    icon: CreditCard, 
    label: 'Contact',
    placeholder: 'John Doe,john@email.com,+1234567890',
    format: (input) => {
      const [name, email, phone] = input.split(',');
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nEMAIL:${email}\nTEL:${phone}\nEND:VCARD`;
    }
  },
  { 
    type: 'crypto', 
    icon: Coins, 
    label: 'Crypto',
    placeholder: 'BTC:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    validation: /^(BTC|ETH|XRP):.+$/
  },
  { 
    type: 'text', 
    icon: FileText, 
    label: 'Text',
    placeholder: 'Enter any text...'
  },
  { 
    type: 'document', 
    icon: File, 
    label: 'Document',
    placeholder: 'https://example.com/document.pdf',
    validation: /^https?:\/\/.+/,
    format: (input) => input.startsWith('http') ? input : `https://${input}`
  }
];

export const QR_TEMPLATES: QRTemplate[] = [
  {
    id: 'modern',
    name: 'Modern',
    style: 'rounded',
    fgColor: '#000000',
    bgColor: '#ffffff',
    errorCorrection: 'M',
    gradient: {
      enabled: true,
      colors: ['#6366f1', '#8b5cf6'],
      type: 'linear'
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    style: 'dots',
    fgColor: '#18181b',
    bgColor: '#fafafa',
    errorCorrection: 'M'
  },
  {
    id: 'corporate',
    name: 'Corporate',
    style: 'classy',
    fgColor: '#1e40af',
    bgColor: '#ffffff',
    errorCorrection: 'M',
    gradient: {
      enabled: true,
      colors: ['#1e40af', '#3b82f6'],
      type: 'radial'
    }
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    style: 'edges',
    fgColor: '#000000',
    bgColor: '#ffffff',
    errorCorrection: 'M',
    gradient: {
      enabled: true,
      colors: ['#f59e0b', '#ef4444', '#ec4899'],
      type: 'linear'
    }
  }
];

export const ERROR_CORRECTION_LEVELS = [
  { value: 'L', label: 'Low (7%)', description: 'Best for clean environments' },
  { value: 'M', label: 'Medium (15%)', description: 'Balanced recovery capability' },
  { value: 'Q', label: 'Quartile (25%)', description: 'Good for logo overlay' },
  { value: 'H', label: 'High (30%)', description: 'Best for customization' }
];