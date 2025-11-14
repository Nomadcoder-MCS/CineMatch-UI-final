import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute - Redirects to landing page if user is not authenticated
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Show nothing while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-brand-text-body">Loading...</div>
      </div>
    );
  }

  // Redirect to landing if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Render the protected content
  return children;
}

