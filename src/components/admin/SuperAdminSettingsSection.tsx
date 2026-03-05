import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type SuperAdminSettings = {
  platform: {
    name: string;
    logo: string;
    supportEmail: string;
  };
  security: {
    minPasswordLength: number;
    requireMFA: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  logging: {
    retentionDays: number;
    detailedLogs: boolean;
    exportEnabled: boolean;
  };
  backup: {
    enabled: boolean;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    retentionPeriod: number;
  };
  maintenance: {
    enabled: boolean;
    startTime: string;
    duration: number;
  };
};

export default function SuperAdminSettingsSection() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SuperAdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/platform-settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError('Failed to load platform settings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');

      const response = await fetch('/api/admin/platform-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      setSuccessMessage('Settings saved successfully');
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {settings && (
        <div className="space-y-8">
          {/* Platform Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Platform Name</label>
                <input
                  type="text"
                  value={settings.platform.name}
                  onChange={(e) => setSettings({
                    ...settings,
                    platform: {
                      ...settings.platform,
                      name: e.target.value
                    }
                  })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Support Email</label>
                <input
                  type="email"
                  value={settings.platform.supportEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    platform: {
                      ...settings.platform,
                      supportEmail: e.target.value
                    }
                  })}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Minimum Password Length</label>
                <input
                  type="number"
                  value={settings.security.minPasswordLength}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      minPasswordLength: parseInt(e.target.value)
                    }
                  })}
                  className="form-input"
                  min="8"
                  max="32"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.security.requireMFA}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      requireMFA: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Require MFA for All Users</label>
              </div>

              <div>
                <label className="form-label">Session Timeout (hours)</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      sessionTimeout: parseInt(e.target.value)
                    }
                  })}
                  className="form-input"
                  min="1"
                  max="72"
                />
              </div>
            </div>
          </div>

          {/* Logging Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Logging Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Log Retention (days)</label>
                <input
                  type="number"
                  value={settings.logging.retentionDays}
                  onChange={(e) => setSettings({
                    ...settings,
                    logging: {
                      ...settings.logging,
                      retentionDays: parseInt(e.target.value)
                    }
                  })}
                  className="form-input"
                  min="1"
                  max="365"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.logging.detailedLogs}
                  onChange={(e) => setSettings({
                    ...settings,
                    logging: {
                      ...settings.logging,
                      detailedLogs: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Enable Detailed Logging</label>
              </div>
            </div>
          </div>

          {/* Backup Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.backup.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    backup: {
                      ...settings.backup,
                      enabled: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Enable Automated Backups</label>
              </div>

              <div>
                <label className="form-label">Backup Frequency</label>
                <select
                  value={settings.backup.frequency}
                  onChange={(e) => setSettings({
                    ...settings,
                    backup: {
                      ...settings.backup,
                      frequency: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY'
                    }
                  })}
                  className="form-select"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Maintenance Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.maintenance.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    maintenance: {
                      ...settings.maintenance,
                      enabled: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Enable Maintenance Mode</label>
              </div>

              <div>
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  value={settings.maintenance.startTime}
                  onChange={(e) => setSettings({
                    ...settings,
                    maintenance: {
                      ...settings.maintenance,
                      startTime: e.target.value
                    }
                  })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Duration (hours)</label>
                <input
                  type="number"
                  value={settings.maintenance.duration}
                  onChange={(e) => setSettings({
                    ...settings,
                    maintenance: {
                      ...settings.maintenance,
                      duration: parseInt(e.target.value)
                    }
                  })}
                  className="form-input"
                  min="1"
                  max="24"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 