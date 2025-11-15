import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute - Redirects to landing page if user is not authenticated
 * 
 * Waits for authReady before checking authentication status to avoid race conditions.
 * This ensures localStorage hydration is complete before making routing decisions.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading, authReady } = useAuth();

  // Show loading while auth is initializing (checking localStorage)
  // This prevents premature redirects before auth hydration completes
  if (loading || !authReady) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎬</div>
          <div className="text-brand-text-body">Loading...</div>
        </div>
      </div>
    );
  }

  // Auth hydration complete - now safe to check authentication
  // Redirect to landing if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated - render the protected content
  return children;
}

