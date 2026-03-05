'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type APIKey = {
  id: string;
  provider: 'ANTHROPIC' | 'OPENAI' | 'GOOGLE';
  name: string;
  isActive: boolean;
  lastUsed?: string;
  organization?: {
    name: string;
    slug: string;
  };
};

export default function APIKeyRequestSection() {
  const [apiKeys, setApiKeys] = useState<Record<string, APIKey[]>>({
    ANTHROPIC: [],
    OPENAI: [],
    GOOGLE: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys');
      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }
      const data = await response.json();
      
      // Group keys by provider
      const grouped = data.reduce((acc: Record<string, APIKey[]>, key: APIKey) => {
        if (!acc[key.provider]) acc[key.provider] = [];
        acc[key.provider].push(key);
        return acc;
      }, {
        ANTHROPIC: [],
        OPENAI: [],
        GOOGLE: []
      });
      
      setApiKeys(grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* API Keys Section */}
      <div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* API Keys List */}
        <div className="space-y-6">
          {Object.entries(apiKeys).map(([provider, keys]) => (
            <div key={provider} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{provider} API Keys</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {keys.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-gray-500">
                    No API keys for {provider}
                  </div>
                ) : (
                  keys.map((key) => (
                    <div key={key.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{key.name}</h4>
                          {key.lastUsed && (
                            <p className="text-xs text-gray-500">
                              Last used: {new Date(key.lastUsed).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            key.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {key.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 