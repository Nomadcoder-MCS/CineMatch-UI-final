import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * TopNavSignedIn - Navigation bar for signed-in users
 */
export default function TopNavSignedIn() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  // Get first initial from name
  const initial = user?.name?.[0]?.toUpperCase() || 'U';
  const firstName = user?.name?.split(' ')[0] || 'User';

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

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-brand-purple rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{initial}</span>
              </div>
              <span className="text-sm font-medium text-brand-text-primary">{firstName}</span>
              <svg className="w-4 h-4 text-brand-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-brand-border py-2 z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-brand-text-body hover:bg-brand-bg transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/watchlist"
                  className="block px-4 py-2 text-sm text-brand-text-body hover:bg-brand-bg transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  Watchlist
                </Link>
                <hr className="my-2 border-brand-border" />
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

