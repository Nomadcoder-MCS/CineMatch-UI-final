import { useEffect } from 'react';

/**
 * Toast - Simple notification component for user feedback
 * 
 * Props:
 * - message: String to display
 * - type: 'error' | 'success' | 'info' (default: 'info')
 * - isOpen: Boolean to control visibility
 * - onClose: Callback when toast should close
 * - duration: Auto-close duration in ms (default: 5000, 0 = no auto-close)
 */
export default function Toast({ 
  message, 
  type = 'info', 
  isOpen, 
  onClose, 
  duration = 5000 
}) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen || !message) return null;

  const typeStyles = {
    error: 'bg-red-600 text-white',
    success: 'bg-green-600 text-white',
    info: 'bg-brand-purple text-white',
  };

  const typeIcons = {
    error: '⚠️',
    success: '✓',
    info: 'ℹ️',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={`
          ${typeStyles[type] || typeStyles.info}
          rounded-xl shadow-2xl px-6 py-4 pr-12
          max-w-md min-w-[300px]
          flex items-start gap-3
        `}
        role="alert"
        aria-live="assertive"
      >
        <span className="text-xl flex-shrink-0">
          {typeIcons[type] || typeIcons.info}
        </span>
        <p className="text-sm font-medium flex-1">
          {message}
        </p>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/80 hover:text-white text-lg font-bold transition-colors"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

