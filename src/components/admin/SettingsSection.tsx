'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type SystemSettings = {
  llmProvider: {
    provider: 'ANTHROPIC' | 'OPENAI' | 'GOOGLE';
    apiKey: string;
    defaultModel: string;
    maxTokens: number;
    temperature: number;
  };
  notifications: {
    email: {
      enabled: boolean;
      smtpServer: string;
      smtpPort: number;
      smtpUser: string;
      smtpPassword: string;
      fromEmail: string;
    };
    slack: {
      enabled: boolean;
      webhookUrl: string;
      channel: string;
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    retention: number;
    externalService: {
      enabled: boolean;
      url: string;
      apiKey: string;
    };
  };
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number;
    location: string;
  };
};

export default function SettingsSection() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setError('');
      setSuccessMessage('');
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Failed to update settings');
      
      setSuccessMessage('Settings updated successfully');
    } catch (err) {
      setError('Failed to update settings');
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="text-center py-8 text-red-600">Failed to load settings</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
        <button
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Save Changes
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {/* LLM Provider Settings */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">LLM Provider</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Provider</label>
              <select
                value={settings.llmProvider.provider}
                onChange={(e) => setSettings({
                  ...settings,
                  llmProvider: {
                    ...settings.llmProvider,
                    provider: e.target.value as 'ANTHROPIC' | 'OPENAI' | 'GOOGLE'
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="ANTHROPIC">Anthropic</option>
                <option value="OPENAI">OpenAI</option>
                <option value="GOOGLE">Google</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">API Key</label>
              <input
                type="password"
                value={settings.llmProvider.apiKey}
                onChange={(e) => setSettings({
                  ...settings,
                  llmProvider: {
                    ...settings.llmProvider,
                    apiKey: e.target.value
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Default Model</label>
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Email Notifications</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email.enabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        email: {
                          ...settings.notifications.email,
                          enabled: e.target.checked
                        }
                      }
                    })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Enable Email Notifications
                  </label>
                </div>
                {settings.notifications.email.enabled && (
                  <div className="ml-6 space-y-2">
                    <input
                      type="text"
                      placeholder="SMTP Server"
                      value={settings.notifications.email.smtpServer}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          email: {
                            ...settings.notifications.email,
                            smtpServer: e.target.value
                          }
                        }
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder="SMTP Port"
                      value={settings.notifications.email.smtpPort}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          email: {
                            ...settings.notifications.email,
                            smtpPort: parseInt(e.target.value)
                          }
                        }
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Slack Notifications</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.slack.enabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        slack: {
                          ...settings.notifications.slack,
                          enabled: e.target.checked
                        }
                      }
                    })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Enable Slack Notifications
                  </label>
                </div>
                {settings.notifications.slack.enabled && (
                  <div className="ml-6 space-y-2">
                    <input
                      type="text"
                      placeholder="Webhook URL"
                      value={settings.notifications.slack.webhookUrl}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          slack: {
                            ...settings.notifications.slack,
                            webhookUrl: e.target.value
                          }
                        }
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Channel"
                      value={settings.notifications.slack.channel}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          slack: {
                            ...settings.notifications.slack,
                            channel: e.target.value
                          }
                        }
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Logging Settings */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Logging</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Log Level</label>
              <select
                value={settings.logging.level}
                onChange={(e) => setSettings({
                  ...settings,
                  logging: {
                    ...settings.logging,
                    level: e.target.value as 'debug' | 'info' | 'warn' | 'error'
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Retention Period (days)</label>
              <input
                type="number"
                value={settings.logging.retention}
                onChange={(e) => setSettings({
                  ...settings,
                  logging: {
                    ...settings.logging,
                    retention: parseInt(e.target.value)
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Backup Settings */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Backup</h3>
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
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Enable Automated Backups
              </label>
            </div>
            {settings.backup.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency</label>
                  <select
                    value={settings.backup.frequency}
                    onChange={(e) => setSettings({
                      ...settings,
                      backup: {
                        ...settings.backup,
                        frequency: e.target.value as 'daily' | 'weekly' | 'monthly'
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Retention Period (days)</label>
                  <input
                    type="number"
                    value={settings.backup.retention}
                    onChange={(e) => setSettings({
                      ...settings,
                      backup: {
                        ...settings.backup,
                        retention: parseInt(e.target.value)
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Backup Location</label>
                  <input
                    type="text"
                    value={settings.backup.location}
                    onChange={(e) => setSettings({
                      ...settings,
                      backup: {
                        ...settings.backup,
                        location: e.target.value
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 