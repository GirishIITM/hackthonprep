import { useEffect, useState } from 'react';
import { getCurrentUser } from '../utils/apiCalls/auth';
import '../styles/Settings.css';

const Settings = () => {
  const [user, setUser] = useState(getCurrentUser());
  const [settings, setSettings] = useState({
    theme: localStorage.getItem('theme') || 'light',
    notifications: {
      email: true,
      desktop: false,
      taskReminders: true,
      projectUpdates: true
    },
    privacy: {
      profileVisibility: 'team',
      activityStatus: true
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/dd/yyyy'
    }
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(prev => ({
        ...prev,
        ...JSON.parse(savedSettings)
      }));
    }
  }, []);

  const handleThemeChange = (newTheme) => {
    setSettings(prev => ({
      ...prev,
      theme: newTheme
    }));
    
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('theme-dark', newTheme === 'dark');
  };

  const handleNotificationChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handlePrivacyChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const handlePreferenceChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      theme: 'light',
      notifications: {
        email: true,
        desktop: false,
        taskReminders: true,
        projectUpdates: true
      },
      privacy: {
        profileVisibility: 'team',
        activityStatus: true
      },
      preferences: {
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/dd/yyyy'
      }
    };
    
    setSettings(defaultSettings);
    localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('theme-dark');
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Customize your SynergySphere experience</p>
      </div>

      {saved && (
        <div className="success-message">
          Settings saved successfully!
        </div>
      )}

      <div className="settings-content">
        {/* Appearance Settings */}
        <div className="settings-section">
          <h2>Appearance</h2>
          <div className="setting-item">
            <label className="setting-label">Theme</label>
            <div className="theme-options">
              <button
                className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                ☀️ Light
              </button>
              <button
                className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                🌙 Dark
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="settings-section">
          <h2>Notifications</h2>
          <div className="setting-item">
            <label className="setting-label">Email Notifications</label>
            <input
              type="checkbox"
              checked={settings.notifications.email}
              onChange={(e) => handleNotificationChange('email', e.target.checked)}
              className="setting-checkbox"
            />
          </div>
          <div className="setting-item">
            <label className="setting-label">Task Reminders</label>
            <input
              type="checkbox"
              checked={settings.notifications.taskReminders}
              onChange={(e) => handleNotificationChange('taskReminders', e.target.checked)}
              className="setting-checkbox"
            />
          </div>
          <div className="setting-item">
            <label className="setting-label">Project Updates</label>
            <input
              type="checkbox"
              checked={settings.notifications.projectUpdates}
              onChange={(e) => handleNotificationChange('projectUpdates', e.target.checked)}
              className="setting-checkbox"
            />
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="settings-section">
          <h2>Privacy</h2>
          <div className="setting-item">
            <label className="setting-label">Profile Visibility</label>
            <select
              value={settings.privacy.profileVisibility}
              onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
              className="setting-select"
            >
              <option value="public">Public</option>
              <option value="team">Team Members Only</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="setting-item">
            <label className="setting-label">Show Activity Status</label>
            <input
              type="checkbox"
              checked={settings.privacy.activityStatus}
              onChange={(e) => handlePrivacyChange('activityStatus', e.target.checked)}
              className="setting-checkbox"
            />
          </div>
        </div>

          {/* Action Buttons */}
        <div className="settings-actions">
          <button
            onClick={handleSaveSettings}
            className="btn btn-primary"
          >
            Save Settings
          </button>
          <button
            onClick={handleResetSettings}
            className="btn btn-secondary"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
