'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type SecuritySettings = {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expiryDays: number;
  };
  mfa: {
    required: boolean;
    allowedMethods: string[];
  };
  sessionPolicy: {
    maxSessionLength: number;
    inactivityTimeout: number;
  };
  ipWhitelist: string[];
  apiRateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
  };
};

const defaultSettings: SecuritySettings = {
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expiryDays: 90
  },
  mfa: {
    required: false,
    allowedMethods: ['authenticator', 'sms']
  },
  sessionPolicy: {
    maxSessionLength: 24,
    inactivityTimeout: 30
  },
  ipWhitelist: [],
  apiRateLimit: {
    enabled: true,
    requestsPerMinute: 100
  }
};

export default function SecuritySection() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newIpAddress, setNewIpAddress] = useState('');

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      const response = await fetch('/api/admin/security');
      if (!response.ok) throw new Error('Failed to fetch security settings');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError('Failed to load security settings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setError('');
      setSuccessMessage('');
      
      const response = await fetch('/api/admin/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Failed to update security settings');
      
      setSuccessMessage('Security settings updated successfully');
    } catch (err) {
      setError('Failed to update security settings');
      console.error(err);
    }
  };

  const handleIPWhitelistChange = (value: string) => {
    if (!value) return;
    
    // Basic IP address validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(value)) {
      setError('Invalid IP address format');
      return;
    }

    setSettings(prev => ({
      ...prev,
      ipWhitelist: [...prev.ipWhitelist, value]
    }));
    setNewIpAddress('');
    setError('');
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading security settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
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

      <div className="bg-white shadow rounded-lg">
        {/* Password Policy */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Password Policy</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Length
              </label>
              <input
                type="number"
                value={settings.passwordPolicy.minLength}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  passwordPolicy: {
                    ...prev.passwordPolicy,
                    minLength: parseInt(e.target.value)
                  }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.passwordPolicy.requireUppercase}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    passwordPolicy: {
                      ...prev.passwordPolicy,
                      requireUppercase: e.target.checked
                    }
                  }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Require Uppercase Letters
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.passwordPolicy.requireNumbers}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    passwordPolicy: {
                      ...prev.passwordPolicy,
                      requireNumbers: e.target.checked
                    }
                  }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Require Numbers
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.passwordPolicy.requireSpecialChars}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    passwordPolicy: {
                      ...prev.passwordPolicy,
                      requireSpecialChars: e.target.checked
                    }
                  }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Require Special Characters
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* MFA Settings */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Multi-Factor Authentication</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.mfa.required}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  mfa: {
                    ...prev.mfa,
                    required: e.target.checked
                  }
                }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Require MFA for all users
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Allowed Methods
              </label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.mfa.allowedMethods.includes('authenticator')}
                    onChange={(e) => {
                      const methods = e.target.checked
                        ? [...settings.mfa.allowedMethods, 'authenticator']
                        : settings.mfa.allowedMethods.filter(m => m !== 'authenticator');
                      setSettings(prev => ({
                        ...prev,
                        mfa: {
                          ...prev.mfa,
                          allowedMethods: methods
                        }
                      }));
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Authenticator App
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.mfa.allowedMethods.includes('sms')}
                    onChange={(e) => {
                      const methods = e.target.checked
                        ? [...settings.mfa.allowedMethods, 'sms']
                        : settings.mfa.allowedMethods.filter(m => m !== 'sms');
                      setSettings(prev => ({
                        ...prev,
                        mfa: {
                          ...prev.mfa,
                          allowedMethods: methods
                        }
                      }));
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    SMS
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Session Policy */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Policy</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Session Length (hours)
              </label>
              <input
                type="number"
                value={settings.sessionPolicy.maxSessionLength}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  sessionPolicy: {
                    ...prev.sessionPolicy,
                    maxSessionLength: parseInt(e.target.value)
                  }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Inactivity Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.sessionPolicy.inactivityTimeout}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  sessionPolicy: {
                    ...prev.sessionPolicy,
                    inactivityTimeout: parseInt(e.target.value)
                  }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* IP Whitelist */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">IP Whitelist</h3>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
                placeholder="Enter IP address"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleIPWhitelistChange(newIpAddress)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {settings.ipWhitelist.map((ip, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm text-gray-700">{ip}</span>
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      ipWhitelist: prev.ipWhitelist.filter((_, i) => i !== index)
                    }))}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Rate Limiting */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">API Rate Limiting</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.apiRateLimit.enabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  apiRateLimit: {
                    ...prev.apiRateLimit,
                    enabled: e.target.checked
                  }
                }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Enable API Rate Limiting
              </label>
            </div>
            {settings.apiRateLimit.enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Requests per Minute
                </label>
                <input
                  type="number"
                  value={settings.apiRateLimit.requestsPerMinute}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    apiRateLimit: {
                      ...prev.apiRateLimit,
                      requestsPerMinute: parseInt(e.target.value)
                    }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 