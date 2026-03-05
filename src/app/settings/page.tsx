'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

type Settings = {
  llmProvider: 'ANTHROPIC' | 'OPENAI' | 'GOOGLE';
  model: string;
  temperature: number;
  maxTokens: number;
  notifications: {
    email: boolean;
    slack: boolean;
    teams: boolean;
  };
  integrations: {
    slackWebhook?: string;
    teamsWebhook?: string;
  };
};

const defaultSettings: Settings = {
  llmProvider: 'ANTHROPIC',
  model: 'claude-3-opus-20240229',
  temperature: 0.7,
  maxTokens: 1024,
  notifications: {
    email: true,
    slack: false,
    teams: false,
  },
  integrations: {},
};

const modelOptions = {
  ANTHROPIC: [
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  OPENAI: [
    { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  GOOGLE: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* LLM Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">LLM Configuration</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Provider</label>
              <select
                value={settings.llmProvider}
                onChange={(e) => setSettings({
                  ...settings,
                  llmProvider: e.target.value as Settings['llmProvider'],
                  model: modelOptions[e.target.value as Settings['llmProvider']][0].value,
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="ANTHROPIC">Anthropic Claude</option>
                <option value="OPENAI">OpenAI</option>
                <option value="GOOGLE">Google</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Model</label>
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {modelOptions[settings.llmProvider].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Temperature ({settings.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                className="mt-1 block w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Precise</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Tokens</label>
              <input
                type="number"
                value={settings.maxTokens}
                onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, email: e.target.checked },
                })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Email Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.slack}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, slack: e.target.checked },
                })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Slack Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.teams}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, teams: e.target.checked },
                })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Microsoft Teams Notifications
              </label>
            </div>
          </div>
        </div>

        {/* Integration Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Integrations</h2>
          <div className="space-y-4">
            {settings.notifications.slack && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Slack Webhook URL
                </label>
                <input
                  type="text"
                  value={settings.integrations.slackWebhook || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    integrations: { ...settings.integrations, slackWebhook: e.target.value },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="https://hooks.slack.com/..."
                />
              </div>
            )}
            {settings.notifications.teams && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Microsoft Teams Webhook URL
                </label>
                <input
                  type="text"
                  value={settings.integrations.teamsWebhook || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    integrations: { ...settings.integrations, teamsWebhook: e.target.value },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="https://outlook.office.com/webhook/..."
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
} 