import { useState } from 'react';
import TopNavSignedIn from '../components/TopNavSignedIn';
import TagChip from '../components/TagChip';
import {
  rebuildRecommendations,
  exportUserData,
  clearRecommendationHistory,
  updatePreferences,
} from '../services/recommendations';

/**
 * ProfilePage - User account, preferences, and settings
 */
export default function ProfilePage() {
  const userId = 'user123'; // In production, get from auth context
  
  const [preferences] = useState({
    genres: ['Action', 'Comedy', 'Drama'],
    languages: ['English', 'Spanish'],
    services: ['Netflix'],
  });

  const [services, setServices] = useState([
    { id: 'netflix', name: 'Netflix', enabled: true },
    { id: 'hulu', name: 'Hulu', enabled: false },
    { id: 'prime', name: 'Amazon Prime', enabled: false },
    { id: 'hbo', name: 'HBO Max', enabled: false },
  ]);

  const [notifications, setNotifications] = useState([
    { id: 'new_picks', label: 'New picks', description: 'Alerts when we add fresh matches', enabled: true },
    { id: 'watchlist', label: 'Watchlist reminders', description: 'Get reminders about your watchlist', enabled: false },
  ]);

  const toggleService = (serviceId) => {
    setServices(prev =>
      prev.map(s => s.id === serviceId ? { ...s, enabled: !s.enabled } : s)
    );
    console.log(`Toggled service: ${serviceId}`);
  };

  const toggleNotification = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, enabled: !n.enabled } : n)
    );
    console.log(`Toggled notification: ${notificationId}`);
  };

  const handleRebuildRecommendations = async () => {
    try {
      await rebuildRecommendations(userId);
      alert('Your recommendations are being rebuilt! This may take a few minutes.');
    } catch (error) {
      console.error('Error rebuilding recommendations:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const blob = await exportUserData(userId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cinematch-data.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear all your recommendation history? This cannot be undone.')) {
      try {
        await clearRecommendationHistory(userId);
        alert('Your recommendation history has been cleared.');
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <TopNavSignedIn />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile summary */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-brand-purple rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-3xl">A</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-brand-text-primary mb-1">
                Alex Johnson
              </h1>
              <p className="text-base text-brand-text-secondary mb-3">
                alex.johnson@email.com
              </p>
              <button className="text-sm text-brand-orange hover:text-brand-purple transition-colors font-medium">
                Edit account
              </button>
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
                <p className="text-sm text-brand-text-body">Alex Johnson</p>
              </div>
              <button className="text-sm text-brand-orange hover:text-brand-purple transition-colors">
                Edit
              </button>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-brand-border">
              <div>
                <p className="text-sm font-medium text-brand-text-primary">Email</p>
                <a href="mailto:alex.johnson@email.com" className="text-sm text-brand-text-body hover:text-brand-orange">
                  alex.johnson@email.com
                </a>
              </div>
              <button className="text-sm text-brand-orange hover:text-brand-purple transition-colors">
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-brand-text-primary">
              Preferences
            </h2>
            <button 
              onClick={() => alert('Edit preferences modal would open here')}
              className="text-sm text-brand-orange hover:text-brand-purple transition-colors font-medium"
            >
              Edit preferences
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-brand-text-secondary mb-2">Genres</p>
              <div className="flex flex-wrap gap-2">
                {preferences.genres.map((genre) => (
                  <TagChip key={genre} label={genre} variant="genre" />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-brand-text-secondary mb-2">Languages</p>
              <div className="flex flex-wrap gap-2">
                {preferences.languages.map((language) => (
                  <TagChip key={language} label={language} variant="default" />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-brand-text-secondary mb-2">Services</p>
              <div className="flex flex-wrap gap-2">
                {preferences.services.map((service) => (
                  <TagChip key={service} label={service} variant="service" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Connected services */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-6 mb-6">
          <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
            Connected services
          </h2>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="flex justify-between items-center py-3 border-b border-brand-border last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {service.name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-brand-text-primary">
                    {service.name}
                  </span>
                </div>
                <button
                  onClick={() => toggleService(service.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    service.enabled ? 'bg-brand-orange' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      service.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-6 mb-6">
          <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
            Data & privacy
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full text-left py-3 border-b border-brand-border hover:bg-brand-bg transition-colors rounded-lg px-2"
            >
              <p className="text-sm font-medium text-brand-text-primary mb-1">
                Export my data
              </p>
              <p className="text-xs text-brand-text-secondary">
                Download your data in CSV format
              </p>
            </button>
            <button
              onClick={handleClearHistory}
              className="w-full text-left py-3 hover:bg-brand-bg transition-colors rounded-lg px-2"
            >
              <p className="text-sm font-medium text-brand-text-primary mb-1">
                Clear recommendation history
              </p>
              <p className="text-xs text-brand-text-secondary">
                Remove all history and start fresh
              </p>
            </button>
          </div>
          <p className="text-xs text-brand-text-secondary mt-4">
            You're in control of your data.
          </p>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-6 mb-6">
          <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
            Notifications
          </h2>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex justify-between items-center py-3 border-b border-brand-border last:border-b-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-text-primary mb-1">
                    {notification.label}
                  </p>
                  <p className="text-xs text-brand-text-secondary">
                    {notification.description}
                  </p>
                </div>
                <button
                  onClick={() => toggleNotification(notification.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notification.enabled ? 'bg-brand-orange' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notification.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rebuild recommendations CTA */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-8">
          <button
            onClick={handleRebuildRecommendations}
            className="w-full px-8 py-4 bg-brand-orange text-white rounded-xl font-semibold text-base hover:bg-[#e05d00] transition-colors mb-3"
          >
            Rebuild my recommendations
          </button>
          <p className="text-sm text-brand-text-secondary text-center">
            Use your latest preferences and history to refresh your picks
          </p>
        </div>
      </main>
    </div>
  );
}

