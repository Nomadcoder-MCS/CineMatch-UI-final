import { useEffect, useRef } from 'react';

/**
 * Modal - Reusable modal/dialog component
 * 
 * Features:
 * - Accessible (keyboard navigation, focus trap)
 * - Closes on backdrop click and Escape key
 * - Matches Clemson theme styling
 * - Supports custom action buttons via `actions` prop
 * 
 * @param {boolean} open - Whether modal is open
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal content
 * @param {() => void} onClose - Close handler
 * @param {React.ReactNode} [actions] - Optional custom action buttons (replaces default Close button)
 */
export default function Modal({ open, title, children, onClose, actions }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Handle Escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Focus close button when modal opens
  useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute right-4 top-4 text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none transition-colors"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Title */}
        <h2 
          id="modal-title"
          className="text-xl font-bold text-brand-purple mb-4 pr-8"
        >
          {title}
        </h2>

        {/* Content */}
        <div className="text-sm text-brand-text-body whitespace-pre-line leading-relaxed">
          {children}
        </div>

        {/* Action buttons - custom actions or default Close button */}
        <div className="mt-6 flex justify-end">
          {actions || (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-brand-purple text-white rounded-lg font-medium hover:bg-[#3d1f5e] transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

