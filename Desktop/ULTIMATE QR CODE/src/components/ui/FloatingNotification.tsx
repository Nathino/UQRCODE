import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface FloatingNotificationProps {
  show: boolean;
  onHide: () => void;
  type?: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

export function FloatingNotification({ 
  show, 
  onHide, 
  type = 'success', 
  title, 
  message,
  duration = 4000 
}: FloatingNotificationProps) {
  const getNotificationStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
          icon: Check,
          iconBg: 'bg-white/20'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-500',
          icon: X,
          iconBg: 'bg-white/20'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          icon: AlertCircle,
          iconBg: 'bg-white/20'
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          icon: Info,
          iconBg: 'bg-white/20'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
          icon: Check,
          iconBg: 'bg-white/20'
        };
    }
  };

  const styles = getNotificationStyles();
  const IconComponent = styles.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full mx-4"
          onAnimationComplete={() => {
            setTimeout(onHide, duration);
          }}
        >
          <div className={`${styles.bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-sm border border-white/20`}>
            <div className={`${styles.iconBg} rounded-full p-1 flex-shrink-0`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{title}</h3>
              {message && (
                <p className="text-xs text-white/80 mt-1 line-clamp-2">{message}</p>
              )}
            </div>
            <button
              onClick={onHide}
              className="flex-shrink-0 bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
