import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type OrgSettings = {
  llmProvider: {
    provider: 'ANTHROPIC' | 'OPENAI' | 'GOOGLE';
    defaultModel: string;
    maxTokens: number;
    temperature: number;
  };
  dlp: {
    enabled: boolean;
    autoBlock: boolean;
    sensitivityThreshold: number;
  };
  notifications: {
    email: boolean;
    slack: boolean;
    teams: boolean;
  };
  apiKeys: {
    anthropic?: string;
    openai?: string;
    google?: string;
  };
};

export default function OrgSettingsSection() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/organizations/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError('Failed to load organization settings');
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

      const response = await fetch('/api/organizations/settings', {
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
        <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
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
          {/* LLM Provider Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">LLM Provider Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Default Provider</label>
                <select
                  value={settings.llmProvider.provider}
                  onChange={(e) => setSettings({
                    ...settings,
                    llmProvider: {
                      ...settings.llmProvider,
                      provider: e.target.value as 'ANTHROPIC' | 'OPENAI' | 'GOOGLE'
                    }
                  })}
                  className="form-select"
                >
                  <option value="ANTHROPIC">Anthropic</option>
                  <option value="OPENAI">OpenAI</option>
                  <option value="GOOGLE">Google</option>
                </select>
              </div>

              <div>
                <label className="form-label">Default Model</label>
                <input
                  type="text"
                  value={settings.llmProvider.defaultModel}
                  onChange={(e) => setSettings({
                    ...settings,
                    llmProvider: {
                      ...settings.llmProvider,
                      defaultModel: e.target.value
                    }
                  })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Max Tokens</label>
                <input
                  type="number"
                  value={settings.llmProvider.maxTokens}
                  onChange={(e) => setSettings({
                    ...settings,
                    llmProvider: {
                      ...settings.llmProvider,
                      maxTokens: parseInt(e.target.value)
                    }
                  })}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* DLP Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">DLP Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.dlp.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    dlp: {
                      ...settings.dlp,
                      enabled: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Enable DLP</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.dlp.autoBlock}
                  onChange={(e) => setSettings({
                    ...settings,
                    dlp: {
                      ...settings.dlp,
                      autoBlock: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Auto-block Sensitive Content</label>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Keys</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Anthropic API Key</label>
                <input
                  type="password"
                  value={settings.apiKeys.anthropic || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    apiKeys: {
                      ...settings.apiKeys,
                      anthropic: e.target.value
                    }
                  })}
                  className="form-input"
                  placeholder="Enter Anthropic API key"
                />
              </div>

              <div>
                <label className="form-label">OpenAI API Key</label>
                <input
                  type="password"
                  value={settings.apiKeys.openai || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    apiKeys: {
                      ...settings.apiKeys,
                      openai: e.target.value
                    }
                  })}
                  className="form-input"
                  placeholder="Enter OpenAI API key"
                />
              </div>

              <div>
                <label className="form-label">Google API Key</label>
                <input
                  type="password"
                  value={settings.apiKeys.google || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    apiKeys: {
                      ...settings.apiKeys,
                      google: e.target.value
                    }
                  })}
                  className="form-input"
                  placeholder="Enter Google API key"
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      email: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Email Notifications</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.slack}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      slack: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Slack Notifications</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.teams}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      teams: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Microsoft Teams Notifications</label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 