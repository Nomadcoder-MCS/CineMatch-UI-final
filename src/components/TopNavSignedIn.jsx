import { Link } from 'react-router-dom';

/**
 * TopNavSignedIn - Navigation bar for signed-in users
 */
export default function TopNavSignedIn() {
  return (
    <nav className="bg-white border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold text-brand-text-primary">CineMatch</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link 
              to="/home"
              className="text-sm text-brand-text-body hover:text-brand-orange transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/watchlist"
              className="text-sm text-brand-text-body hover:text-brand-orange transition-colors"
            >
              Watchlist
            </Link>
            <Link 
              to="/profile"
              className="text-sm text-brand-text-body hover:text-brand-orange transition-colors"
            >
              Profile
            </Link>
          </div>

          {/* User avatar */}
          <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-brand-purple rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">A</span>
            </div>
            <span className="text-sm font-medium text-brand-text-primary">Alex</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

