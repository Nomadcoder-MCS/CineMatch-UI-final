import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNavSignedIn from '../components/TopNavSignedIn';
import TagChip from '../components/TagChip';
import api from '../api/client';

/**
 * ProfilePage - User account, preferences, and settings
 */
export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    preferred_genres: [],
    services: [],
    original_languages: [],
    runtime_min: null,
    runtime_max: null
  });
  
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [editedPreferences, setEditedPreferences] = useState(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Available options for preferences
  const availableGenres = ['action', 'adventure', 'animation', 'comedy', 'crime', 'documentary', 'drama', 'fantasy', 'horror', 'mystery', 'romance', 'sci-fi', 'thriller', 'western'];
  const availableServices = ['Netflix', 'Hulu', 'Amazon Prime', 'HBO Max', 'Disney+'];
  const availableLanguages = ['en', 'es', 'fr', 'de', 'ja', 'ko'];

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Load preferences from backend
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      try {
        const prefs = await api.get('/api/preferences/me');
        setPreferences(prefs);
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, [user]);

  const handleEditPreferences = () => {
    setEditedPreferences({ ...preferences });
    setIsEditingPreferences(true);
  };

  const handleCancelEditPreferences = () => {
    setEditedPreferences(null);
    setIsEditingPreferences(false);
  };

  const handleSavePreferences = async () => {
    if (!editedPreferences) return;

    setIsSavingPreferences(true);
    try {
      const updated = await api.put('/api/preferences/me', editedPreferences);
      setPreferences(updated);
      setIsEditingPreferences(false);
      setEditedPreferences(null);
      alert('Preferences updated successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const toggleGenre = (genre) => {
    if (!editedPreferences) return;
    const genres = editedPreferences.preferred_genres || [];
    const newGenres = genres.includes(genre)
      ? genres.filter(g => g !== genre)
      : [...genres, genre];
    setEditedPreferences({ ...editedPreferences, preferred_genres: newGenres });
  };

  const toggleService = (service) => {
    if (!editedPreferences) return;
    const services = editedPreferences.services || [];
    const newServices = services.includes(service)
      ? services.filter(s => s !== service)
      : [...services, service];
    setEditedPreferences({ ...editedPreferences, services: newServices });
  };

  const toggleLanguage = (lang) => {
    if (!editedPreferences) return;
    const langs = editedPreferences.original_languages || [];
    const newLangs = langs.includes(lang)
      ? langs.filter(l => l !== lang)
      : [...langs, lang];
    setEditedPreferences({ ...editedPreferences, original_languages: newLangs });
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Get user's first initial
  const initial = user.name?.[0]?.toUpperCase() || 'U';
  const firstName = user.name?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen bg-brand-bg">
      <TopNavSignedIn />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile summary */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-brand-purple rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-3xl">{initial}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-brand-text-primary mb-1">
                {user.name}
              </h1>
              <p className="text-base text-brand-text-secondary mb-3">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Account details */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-6 mb-6">
          <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
            Account
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="text-sm font-medium text-brand-text-primary">Name</p>
                <p className="text-sm text-brand-text-body">{user.name}</p>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-brand-border">
              <div>
                <p className="text-sm font-medium text-brand-text-primary">Email</p>
                <a href={`mailto:${user.email}`} className="text-sm text-brand-text-body hover:text-brand-orange">
                  {user.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-brand-text-primary">
              Preferences
            </h2>
            {!isEditingPreferences ? (
              <button 
                onClick={handleEditPreferences}
                className="text-sm text-brand-orange hover:text-brand-purple transition-colors font-medium"
              >
                Edit preferences
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={handleCancelEditPreferences}
                  className="px-4 py-2 text-sm text-brand-text-body border border-brand-border rounded-lg hover:bg-brand-bg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSavePreferences}
                  disabled={isSavingPreferences}
                  className="px-4 py-2 text-sm bg-brand-orange text-white rounded-lg hover:bg-[#e05d00] transition-colors disabled:opacity-50"
                >
                  {isSavingPreferences ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {!isEditingPreferences ? (
            // Display mode
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-brand-text-secondary mb-2">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.preferred_genres.length > 0 ? (
                    preferences.preferred_genres.map((genre) => (
                      <TagChip key={genre} label={genre} variant="genre" />
                    ))
                  ) : (
                    <p className="text-sm text-brand-text-secondary">No genres selected</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text-secondary mb-2">Services</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.services.length > 0 ? (
                    preferences.services.map((service) => (
                      <TagChip key={service} label={service} variant="service" />
                    ))
                  ) : (
                    <p className="text-sm text-brand-text-secondary">No services selected</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text-secondary mb-2">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.original_languages.length > 0 ? (
                    preferences.original_languages.map((lang) => (
                      <TagChip key={lang} label={lang} variant="default" />
                    ))
                  ) : (
                    <p className="text-sm text-brand-text-secondary">No languages selected</p>
                  )}
                </div>
              </div>
              {(preferences.runtime_min || preferences.runtime_max) && (
                <div>
                  <p className="text-sm font-medium text-brand-text-secondary mb-2">Runtime</p>
                  <p className="text-sm text-brand-text-body">
                    {preferences.runtime_min || 0} - {preferences.runtime_max || 240} minutes
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Edit mode
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-brand-text-primary mb-3">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {availableGenres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        editedPreferences?.preferred_genres?.includes(genre)
                          ? 'bg-brand-orange text-white'
                          : 'bg-brand-bg text-brand-text-body hover:bg-brand-orange/20'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text-primary mb-3">Services</p>
                <div className="flex flex-wrap gap-2">
                  {availableServices.map((service) => (
                    <button
                      key={service}
                      onClick={() => toggleService(service)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        editedPreferences?.services?.includes(service)
                          ? 'bg-brand-orange text-white'
                          : 'bg-brand-bg text-brand-text-body hover:bg-brand-orange/20'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text-primary mb-3">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        editedPreferences?.original_languages?.includes(lang)
                          ? 'bg-brand-orange text-white'
                          : 'bg-brand-bg text-brand-text-body hover:bg-brand-orange/20'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text-primary mb-3">Runtime (minutes)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-brand-text-secondary">Minimum</label>
                    <input
                      type="number"
                      value={editedPreferences?.runtime_min || ''}
                      onChange={(e) => setEditedPreferences({ ...editedPreferences, runtime_min: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-brand-text-secondary">Maximum</label>
                    <input
                      type="number"
                      value={editedPreferences?.runtime_max || ''}
                      onChange={(e) => setEditedPreferences({ ...editedPreferences, runtime_max: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange"
                      placeholder="240"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-6">
          <p className="text-sm text-brand-text-secondary text-center">
            Your preferences will be used to personalize your movie recommendations. Update them anytime to get better matches!
          </p>
        </div>
      </main>
    </div>
  );
}

