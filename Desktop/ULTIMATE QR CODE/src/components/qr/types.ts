import { LucideIcon } from 'lucide-react';

export type QRType = 'url' | 'location' | 'email' | 'phone' | 'wifi' | 'event' | 'vcard' | 'crypto' | 'text' | 'document';
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export type QRStyle = 'squares' | 'dots' | 'rounded' | 'classy' | 'edges';

export interface QRConfig {
  type: QRType | '';
  data: string;
  style: QRStyle;
  errorCorrection: ErrorCorrectionLevel;
  gradient: {
    enabled: boolean;
    colors: string[];
    type: 'linear' | 'radial';
  };
  logo?: {
    url: string;
    size: number;
  };
  animation: {
    enabled: boolean;
    type: 'fade' | 'scan' | 'rotate';
  };
}

export interface QRTypeOption {
  type: QRType;
  icon: LucideIcon;
  label: string;
  placeholder?: string;
  validation?: RegExp;
  format?: (input: string) => string;
}

export interface QRTemplate {
  id: string;
  name: string;
  style: QRStyle;
  fgColor: string;
  bgColor: string;
  errorCorrection: ErrorCorrectionLevel;
  gradient?: QRConfig['gradient'];
}