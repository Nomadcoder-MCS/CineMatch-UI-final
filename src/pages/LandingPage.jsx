import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNavSignedOut from '../components/TopNavSignedOut';
import TagChip from '../components/TagChip';

/**
 * LandingPage - Marketing page for signed-out users
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const { identifyUser } = useAuth();

  const handleGetStarted = async () => {
    try {
      // Auto-identify as demo user for simplicity (school project)
      // In production, you'd have a proper sign-up/sign-in form
      await identifyUser('Alex Johnson', 'alex.johnson@email.com');
      navigate('/home');
    } catch (error) {
      console.error('Failed to identify user:', error);
      // Navigate anyway for demo purposes
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <TopNavSignedOut />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-text-primary mb-6 leading-tight">
              Quick movie picks for busy students
            </h1>
            <p className="text-lg text-brand-text-body mb-8">
              Set your preferences once and get smart movie recommendations every night.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGetStarted}
                className="px-8 py-3 bg-brand-orange text-white rounded-xl font-semibold text-base hover:bg-[#e05d00] transition-colors"
              >
                Get started
              </button>
              <button
                onClick={handleGetStarted}
                className="px-8 py-3 text-brand-orange hover:text-brand-purple transition-colors font-medium text-base"
              >
                Try a sample recommendation →
              </button>
            </div>
          </div>

          {/* Right side - Mock recommendation card */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex gap-4 mb-4">
              <div className="w-24 h-36 bg-brand-purple rounded-lg flex items-center justify-center text-white text-xs text-center px-2">
                Movie Poster
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-brand-text-primary mb-1">
                  Neon City
                </h3>
                <p className="text-xs text-brand-text-secondary mb-2">
                  2023 · 2h 10m
                </p>
                <p className="text-sm text-brand-text-body line-clamp-3">
                  A cyberpunk thriller set in a dystopian future where a hacker discovers a conspiracy...
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <TagChip label="Sci-Fi" variant="genre" />
              <TagChip label="Action" variant="genre" />
              <TagChip label="Netflix" variant="service" />
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-brand-orange/10 text-brand-orange rounded-lg text-sm font-medium">
                + Watchlist
              </button>
              <button className="px-3 py-2 text-xs text-brand-purple">
                Why this?
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-brand-text-primary text-center mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-brand-bg rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-brand-text-primary mb-3">
                Tell us what you like
              </h3>
              <p className="text-sm text-brand-text-body">
                Choose your favorite genres, languages, and streaming services. Takes less than a minute.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-brand-bg rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-purple rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-brand-text-primary mb-3">
                We score the catalog
              </h3>
              <p className="text-sm text-brand-text-body">
                Our algorithm ranks movies using content-based filtering matched to your taste.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-brand-bg rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-brand-text-primary mb-3">
                You pick tonight's movie
              </h3>
              <p className="text-sm text-brand-text-body">
                Browse curated picks with clear explanations. No endless scrolling required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For students section */}
      <section id="for-students" className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-brand-text-primary text-center mb-12">
          Built for students
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Benefit 1 */}
          <div className="text-center">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
              Fast setup
            </h3>
            <p className="text-sm text-brand-text-body">
              Get started in under 60 seconds. No complex questionnaires or surveys.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="text-center">
            <div className="text-5xl mb-4">📺</div>
            <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
              Works with your services
            </h3>
            <p className="text-sm text-brand-text-body">
              Connect Netflix, Hulu, Prime, and more. Only see movies you can actually watch.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="text-center">
            <div className="text-5xl mb-4">💡</div>
            <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
              Explainable picks
            </h3>
            <p className="text-sm text-brand-text-body">
              Understand why each movie was recommended. No mysterious black-box algorithms.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/home')}
            className="px-10 py-4 bg-brand-orange text-white rounded-xl font-semibold text-lg hover:bg-[#e05d00] transition-colors"
          >
            Get started free
          </button>
          <p className="text-sm text-brand-text-secondary mt-3">
            No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-text-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm">
            © 2024 CineMatch. Built for students, by students.
          </p>
        </div>
      </footer>
    </div>
  );
}

