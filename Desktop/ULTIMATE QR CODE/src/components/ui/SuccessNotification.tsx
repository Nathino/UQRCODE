import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface SuccessNotificationProps {
  show: boolean;
  onHide: () => void;
}

export function SuccessNotification({ show, onHide }: SuccessNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          onAnimationComplete={() => {
            setTimeout(onHide, 3000); // Hide after 3 seconds
          }}
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-1">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Download Complete!</h3>
              <p className="text-sm text-white/80">Your QR code has been saved successfully</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 