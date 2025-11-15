import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * SignInModal - Email-only sign-in modal for returning users
 * 
 * Flow:
 * 1. User enters email
 * 2. Calls signInWithEmail(email) from AuthContext
 * 3. On success: Closes modal and navigates to home
 * 4. On 404: Shows "No account found" error
 * 5. On other errors: Shows generic error
 */
export default function SignInModal({ isOpen, onClose, onSuccess }) {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  const handleClose = () => {
    setEmail('');
    setError('');
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic email validation
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Call signInWithEmail - throws error with status 404 if user not found
      await signInWithEmail(email.trim());
      
      // Success - close modal and trigger navigation
      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Handle 404 (user not found) vs other errors
      if (error.status === 404) {
        setError(error.message || 'No account found for that email. Use "Get started" to create one.');
      } else {
        setError(error.message || 'Could not sign in. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-brand-text-primary mb-2">
            Sign in
          </h2>
          <p className="text-sm text-brand-text-secondary">
            Enter your email to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-text-primary mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(''); // Clear error when user types
              }}
              className="w-full px-4 py-3 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-brand-border rounded-xl text-brand-text-body hover:bg-brand-bg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="flex-1 px-4 py-3 bg-brand-orange text-white rounded-xl font-semibold hover:bg-[#e05d00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Footer hint */}
        <div className="mt-6 pt-6 border-t border-brand-border text-center">
          <p className="text-xs text-brand-text-secondary">
            Don't have an account?{' '}
            <button
              onClick={handleClose}
              className="text-brand-orange hover:text-brand-purple font-medium"
            >
              Get started
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

