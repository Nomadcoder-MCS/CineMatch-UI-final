import { Link, useNavigate } from 'react-router-dom';

/**
 * TopNavSignedOut - Navigation bar for signed-out users (Landing page)
 */
export default function TopNavSignedOut() {
  const navigate = useNavigate();

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
              onClick={() => navigate('/home')}
              className="text-sm text-brand-text-body hover:text-brand-orange transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/home')}
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

