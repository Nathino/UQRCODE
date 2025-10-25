import { motion } from 'framer-motion';
import { QrCode, Smartphone, Wifi, Mail, MapPin, Calendar, CreditCard, FileText, Zap } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-600 relative overflow-hidden">
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

      <motion.img
        src="/QRPRO.png"
        alt="ULTIMATE QR CODE"
        className="w-32 h-32 object-contain mb-8 relative z-10"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
          filter: [
            'drop-shadow(0 0 0rem rgba(255,255,255,0.5))',
            'drop-shadow(0 0 2rem rgba(255,255,255,0.8))',
            'drop-shadow(0 0 0rem rgba(255,255,255,0.5))'
          ]
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center relative z-10"
      >
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-white text-xl font-medium"
        >
          Loading...
        </motion.div>
        <div className="text-white/60 text-sm mt-2">
          Please wait while we prepare your experience
        </div>
      </motion.div>
    </div>
  );
}