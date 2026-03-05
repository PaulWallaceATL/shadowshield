'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

type APIKeys = {
  anthropic?: string;
  openai?: string;
  google?: string;
  googleDLP?: string;
  microsoftPurview?: string;
  amazonMacie?: string;
};

export default function OrganizationSetup({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [apiKeys, setApiKeys] = useState<APIKeys>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/organizations/${resolvedParams.slug}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            apiKeys: {
              ...apiKeys
            }
          }
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error updating organization settings');
      }

      setSuccessMessage('Settings updated successfully');
      router.push(`/organizations/${resolvedParams.slug}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Configure Your Organization
            </h1>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">LLM Providers</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure your LLM provider API keys.
                  </p>
                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="anthropic" className="block text-sm font-medium text-gray-700">
                        Anthropic API Key
                      </label>
                      <input
                        type="password"
                        name="anthropic"
                        id="anthropic"
                        value={apiKeys.anthropic || ''}
                        onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="openai" className="block text-sm font-medium text-gray-700">
                        OpenAI API Key
                      </label>
                      <input
                        type="password"
                        name="openai"
                        id="openai"
                        value={apiKeys.openai || ''}
                        onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="google" className="block text-sm font-medium text-gray-700">
                        Google AI API Key
                      </label>
                      <input
                        type="password"
                        name="google"
                        id="google"
                        value={apiKeys.google || ''}
                        onChange={(e) => setApiKeys({ ...apiKeys, google: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900">DLP Providers</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure your DLP provider API keys.
                  </p>
                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="googleDLP" className="block text-sm font-medium text-gray-700">
                        Google Cloud DLP API Key
                      </label>
                      <input
                        type="password"
                        name="googleDLP"
                        id="googleDLP"
                        value={apiKeys.googleDLP || ''}
                        onChange={(e) => setApiKeys({ ...apiKeys, googleDLP: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="microsoftPurview" className="block text-sm font-medium text-gray-700">
                        Microsoft Purview API Key
                      </label>
                      <input
                        type="password"
                        name="microsoftPurview"
                        id="microsoftPurview"
                        value={apiKeys.microsoftPurview || ''}
                        onChange={(e) => setApiKeys({ ...apiKeys, microsoftPurview: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="amazonMacie" className="block text-sm font-medium text-gray-700">
                        Amazon Macie API Key
                      </label>
                      <input
                        type="password"
                        name="amazonMacie"
                        id="amazonMacie"
                        value={apiKeys.amazonMacie || ''}
                        onChange={(e) => setApiKeys({ ...apiKeys, amazonMacie: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save and continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 