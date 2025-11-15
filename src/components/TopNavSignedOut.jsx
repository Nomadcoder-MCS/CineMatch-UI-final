import { Link, useNavigate } from 'react-router-dom';

/**
 * TopNavSignedOut - Navigation bar for signed-out users (Landing page)
 * 
 * Props:
 * - onSignInClick: Callback to open sign-in modal
 */
export default function TopNavSignedOut({ onSignInClick }) {
  const navigate = useNavigate();

  /**
   * Handle "Sign in" button click
   * Opens sign-in modal if handler provided, otherwise navigates to home
   */
  const handleSignIn = () => {
    if (onSignInClick) {
      onSignInClick();
    } else {
      // Fallback: navigate to home (for backward compatibility)
      navigate('/home');
    }
  };

  /**
   * Handle "Get started" button click
   * Scrolls to the form on landing page
   */
  const handleGetStarted = () => {
    // Scroll to the form section
    const formSection = document.querySelector('form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="bg-white border-b border-brand-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold text-brand-text-primary">CineMatch</span>
          </Link>

          {/* Right side - Links and CTA */}
          <div className="flex items-center gap-8">
            <a 
              href="#how-it-works" 
              className="text-sm text-brand-text-body hover:text-brand-orange transition-colors"
            >
              How it works
            </a>
            <a 
              href="#for-students" 
              className="text-sm text-brand-text-body hover:text-brand-orange transition-colors"
            >
              For students
            </a>
            <button
              onClick={handleSignIn}
              className="text-sm text-brand-text-body hover:text-brand-orange transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={handleGetStarted}
              className="px-6 py-2 bg-brand-orange text-white rounded-xl font-semibold text-sm hover:bg-[#e05d00] transition-colors"
            >
              Get started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

