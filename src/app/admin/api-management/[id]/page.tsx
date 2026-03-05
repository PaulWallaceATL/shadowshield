'use client';

import { useEffect, useState, ChangeEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  KeyIcon,
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { debounce } from 'lodash';

// Use dynamic imports to fix the module not found errors
// @ts-ignore - Component exists but TypeScript can't find it
const PerformanceChart = dynamic(() => import('@/components/admin/PerformanceChart'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-72 bg-gray-800/50 rounded-lg"></div>
});

// @ts-ignore - Component exists but TypeScript can't find it
const Pagination = dynamic(() => import('@/components/admin/Pagination'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-10 w-full bg-gray-800/50 rounded-lg"></div>
}) as any;

type Provider = 'ANTHROPIC' | 'OPENAI' | 'GOOGLE';

interface APIKeyData {
  id: string;
  provider: Provider;
  name: string;
  isActive: boolean;
  lastUsed: string | null;
  stats: {
    totalQueries: number;
    last24HQueries: number;
    averageLatency: number;
    totalTokens: number;
    failedQueries: number;
    dlpFlaggedQueries: number;
    successRate: number;
    uniqueUsers: number;
    averageTokensPerQuery: number;
    avgTokensPerQuery?: number;  // Alternative property name that might be used in the API response
    todayQueries: number;
    yesterdayQueries: number;
    trend: string | number;
  }
}

interface ChatData {
  id: string;
  username?: string;  
  user?: string;       // API returns user email
  createdAt?: string;
  timestamp?: string;  // API returns ISO timestamp
  queries?: number;
  queryCount?: number; // API returns queryCount
  tokens?: number;
  totalTokens?: number; // API returns totalTokens
  avgLatency?: number;
  averageLatency?: number; // API returns averageLatency
  status: string;
}

const providerInfo = {
  anthropic: {
    name: 'Anthropic',
    color: 'from-[#EBDBBC] to-[#EBDBBC]',
    lightColor: 'bg-[#EBDBBC]/30',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-700',
    logo: '/claude.svg'
  },
  openai: {
    name: 'OpenAI',
    color: 'from-white to-white',
    lightColor: 'bg-gray-100',
    textColor: 'text-black',
    borderColor: 'border-black',
    logo: '/openai.svg'
  },
  google: {
    name: 'Google',
    color: 'from-[#1E1E1E] to-[#1E1E1E]',
    lightColor: 'bg-[#1E1E1E]/30',
    textColor: 'text-white',
    borderColor: 'border-gray-700',
    logo: '/gemini.svg'
  }
};

// Format date strings to a consistent format
const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown date';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (err) {
    return 'Invalid date';
  }
};

const APIManagementDetail = () => {
  const params = useParams();
  const resolvedParams = typeof params.id === 'string' ? { id: params.id } : { id: params.id?.[0] || '' };
  
  const [apiData, setApiData] = useState<APIKeyData | null>(null);
  const [loadingApiData, setLoadingApiData] = useState(true);
  const [chartData, setChartData] = useState<any>(null);
  const [loadingChartData, setLoadingChartData] = useState(true);
  const [chats, setChats] = useState<ChatData[]>([]);
  const [loadingChats, setLoadingChats] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

  // Get the provider info based on the ID parameter
  const provider = providerInfo[resolvedParams.id as keyof typeof providerInfo] || {
    name: 'Unknown Provider',
    color: 'from-gray-600 to-gray-700',
    lightColor: 'bg-gray-800/30',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500'
  };

  // Debounce search term updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
      setCurrentPage(1); // Reset to first page on new search
    }, 500),
    []
  );

  // Handle search input changes
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Reset to page 1 when search term changes
    setCurrentPage(1);
    // Use debounced function to prevent excessive API calls
    debouncedSetSearchTerm(value);
  };

  // Fetch API data
  useEffect(() => {
    const fetchApiData = async () => {
      setLoadingApiData(true);
      try {
        const response = await fetch(`/api/admin/api-keys/${resolvedParams.id.toUpperCase()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch API key data');
        }
        const data = await response.json();
        
        // Calculate adjusted success rate considering DLP violations as failures
        if (data && data.stats) {
          const totalRequests = data.stats.totalQueries;
          const failedRequests = data.stats.failedQueries;
          const dlpViolations = data.stats.dlpFlaggedQueries;
          
          // If there are queries, recalculate success rate including DLP violations
          if (totalRequests > 0) {
            const successfulRequests = totalRequests - failedRequests - dlpViolations;
            data.stats.successRate = (successfulRequests / totalRequests) * 100;
          }
        }
        
        setApiData(data);
      } catch (err) {
        console.error('Error fetching API key data:', err);
        setError('Failed to load API key data');
        setApiData(null);
      } finally {
        setLoadingApiData(false);
      }
    };

    fetchApiData();
  }, [resolvedParams.id]);

  // Fetch performance chart data
  useEffect(() => {
    const fetchChartData = async () => {
      setLoadingChartData(true);
      try {
        const response = await fetch(`/api/admin/api-keys/${resolvedParams.id.toUpperCase()}/performance`);
        if (!response.ok) {
          throw new Error('Failed to fetch performance data');
        }
        const data = await response.json();
        
        // Convert API response format to the format expected by PerformanceChart
        if (data && data.labels && data.queries && data.latency) {
          const formattedData = data.labels.map((label: string, index: number) => ({
            label: label,
            queries: data.queries[index] || 0,
            latency: data.latency[index] || 0
          }));
          setChartData(formattedData);
        } else {
          setChartData([]);
        }
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setChartData([]);
      } finally {
        setLoadingChartData(false);
      }
    };

    fetchChartData();
  }, [resolvedParams.id]);

  // Fetch chat data
  useEffect(() => {
    const fetchChatData = async () => {
      setLoadingChats(true);
      try {
        // Include search term in the API request
        const searchParam = debouncedSearchTerm ? `&search=${encodeURIComponent(debouncedSearchTerm)}` : '';
        const response = await fetch(
          `/api/admin/api-keys/${resolvedParams.id.toUpperCase()}/chats?page=${currentPage}${searchParam}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch chat data');
        }
        
        const data = await response.json();
        setChats(data.chats || []);
        setPagination(data.pagination || null);
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setChats([]);
        setPagination(null);
      } finally {
        setLoadingChats(false);
      }
    };

    fetchChatData();
  }, [currentPage, debouncedSearchTerm, provider]);

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href="/admin/api" className="mr-4">
          <motion.div
            className="flex items-center text-gray-300 hover:text-white"
            whileHover={{ x: -3 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            <span>Back</span>
          </motion.div>
        </Link>
        <h1 className="text-2xl font-semibold text-white">{provider.name} API Management</h1>
      </div>

      {/* API Key Information Card */}
      {loadingApiData ? (
        <div className="mb-6 bg-gray-800/50 animate-pulse rounded-xl h-48 w-full"></div>
      ) : apiData ? (
        <motion.div
          className={`mb-6 bg-gradient-to-r ${provider.color} rounded-xl shadow-xl overflow-hidden`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div className="flex items-center mb-4 md:mb-0">
                <img src={provider.logo} alt={provider.name} className="h-8 w-8 mr-3" />
                <div>
                  <h2 className={`text-2xl font-bold ${provider.textColor}`}>{provider.name}</h2>
                  <p className={`${provider.textColor} opacity-80 mt-1 flex items-center`}>
                    <ClockIcon className={`h-4 w-4 mr-1 ${provider.textColor}`} />
                    {apiData.lastUsed 
                      ? `Last used: ${new Date(apiData.lastUsed).toLocaleString()}`
                      : 'Not used yet'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className={`px-3 py-1.5 rounded-lg ${apiData.provider === 'OPENAI' ? 'bg-gray-800 text-white' : 'bg-gray-900/40'} ${provider.textColor}`}>
                  <span className="text-sm font-semibold">
                    {apiData.stats?.successRate.toFixed(1)}% Success Rate
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`${provider.lightColor} rounded-lg p-4`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className={`${provider.textColor} text-xs opacity-80`}>Total Queries</p>
                    <h4 className={`text-xl font-bold ${provider.textColor}`}>{apiData.stats?.totalQueries.toLocaleString()}</h4>
                  </div>
                  <div className={`${resolvedParams.id === 'openai' ? 'bg-gray-200/20' : 'bg-white/10'} p-2 rounded-md`}>
                    <ChartBarIcon className={`h-5 w-5 ${provider.textColor}`} />
                  </div>
                </div>
                <div className="text-sm mt-2">
                  <p className={`${provider.textColor} opacity-80`}>Last 24h: <span className={`${provider.textColor} font-medium`}>{apiData.stats?.last24HQueries.toLocaleString()}</span></p>
                  {apiData.stats?.trend !== 0 && (
                    <div className="flex items-center mt-1">
                      {typeof apiData.stats?.trend === 'number' && apiData.stats?.trend > 0 ? (
                        <>
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
                          <span className="text-green-400">+{typeof apiData.stats?.trend === 'number' ? apiData.stats?.trend.toFixed(1) : apiData.stats?.trend}% vs yesterday</span>
                        </>
                      ) : (
                        <>
                          <ArrowTrendingDownIcon className="h-4 w-4 text-red-400 mr-1" />
                          <span className="text-red-400">{typeof apiData.stats?.trend === 'number' ? apiData.stats?.trend.toFixed(1) : apiData.stats?.trend}% vs yesterday</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={`${provider.lightColor} rounded-lg p-4`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className={`${provider.textColor} text-xs opacity-80`}>Avg Latency</p>
                    <h4 className={`text-xl font-bold ${provider.textColor}`}>{apiData.stats?.averageLatency.toFixed(0)}ms</h4>
                  </div>
                  <div className={`${resolvedParams.id === 'openai' ? 'bg-gray-200/20' : 'bg-white/10'} p-2 rounded-md`}>
                    <ClockIcon className={`h-5 w-5 ${provider.textColor}`} />
                  </div>
                </div>
                <div className="text-sm mt-2">
                  <p className={`${provider.textColor} opacity-80`}>Avg Tokens: <span className={`${provider.textColor} font-medium`}>{apiData.stats?.averageTokensPerQuery?.toFixed(0) || apiData.stats?.avgTokensPerQuery?.toFixed(0) || '0'}/query</span></p>
                  <p className={`${provider.textColor} opacity-80 mt-1`}>Total: <span className={`${provider.textColor} font-medium`}>{apiData.stats?.totalTokens?.toLocaleString() || '0'}</span></p>
                </div>
              </div>

              <div className={`${provider.lightColor} rounded-lg p-4`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className={`${provider.textColor} text-xs opacity-80`}>DLP Violations</p>
                    <h4 className={`text-xl font-bold ${provider.textColor}`}>{apiData.stats?.dlpFlaggedQueries.toLocaleString()}</h4>
                  </div>
                  <div className={`${resolvedParams.id === 'openai' ? 'bg-gray-200/20' : 'bg-white/10'} p-2 rounded-md`}>
                    <ShieldCheckIcon className={`h-5 w-5 ${provider.textColor}`} />
                  </div>
                </div>
                <div className="text-sm mt-2">
                  <p className={`${provider.textColor} opacity-80`}>Failed Queries: <span className={`${provider.textColor} font-medium`}>{apiData.stats?.failedQueries.toLocaleString()}</span></p>
                  {apiData.stats?.dlpFlaggedQueries > 0 && apiData.stats?.totalQueries > 0 && (
                    <p className={`${provider.textColor} opacity-80 mt-1`}>
                      {((apiData.stats?.dlpFlaggedQueries / apiData.stats?.totalQueries) * 100).toFixed(1)}% of total queries
                    </p>
                  )}
                </div>
              </div>

              <div className={`${provider.lightColor} rounded-lg p-4`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className={`${provider.textColor} text-xs opacity-80`}>Unique Users</p>
                    <h4 className={`text-xl font-bold ${provider.textColor}`}>{apiData.stats?.uniqueUsers.toLocaleString()}</h4>
                  </div>
                  <div className={`${resolvedParams.id === 'openai' ? 'bg-gray-200/20' : 'bg-white/10'} p-2 rounded-md`}>
                    <UserGroupIcon className={`h-5 w-5 ${provider.textColor}`} />
                  </div>
                </div>
                <div className="text-sm mt-2">
                  <p className={`${provider.textColor} opacity-80`}>Avg Queries: <span className={`${provider.textColor} font-medium`}>
                    {apiData.stats?.uniqueUsers > 0 
                      ? (apiData.stats?.totalQueries / apiData.stats?.uniqueUsers).toFixed(1) 
                      : '0'}/user
                  </span></p>
                  <p className={`${provider.textColor} opacity-80 mt-1`}>Today: <span className={`${provider.textColor} font-medium`}>{apiData.stats?.todayQueries.toLocaleString()}</span></p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : error ? (
        <div className="mb-6 bg-red-900/20 border border-red-700 text-red-300 p-4 rounded-lg">
          <p className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            {error}
          </p>
        </div>
      ) : null}

      {/* Performance Chart */}
      <div className="w-full bg-gray-900 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">Performance (Last 24h)</h3>
        {loadingChartData ? (
          <div className="animate-pulse h-72 bg-gray-800/50 rounded-lg"></div>
        ) : chartData && chartData.length > 0 ? (
          // @ts-ignore - Component exists but TypeScript doesn't recognize its props
          <PerformanceChart data={chartData} />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p>No performance data available.</p>
          </div>
        )}
      </div>

      {/* Chat History */}
      <div className="w-full bg-gray-900 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Chat History</h3>
          
          {/* Search bar */}
          <div className="relative w-full max-w-xs ml-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by user..."
              className="bg-gray-700 border border-gray-600 rounded-lg py-2 px-10 w-full text-white font-medium placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ color: 'white' }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {loadingChats ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800/50 rounded"></div>
            <div className="h-16 bg-gray-800/50 rounded"></div>
            <div className="h-16 bg-gray-800/50 rounded"></div>
          </div>
        ) : chats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">USER</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">TIME</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">QUERIES</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">TOKENS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">AVG. LATENCY</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {chats.map((chat) => (
                  <tr key={chat.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{chat.user || chat.username}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{formatDate(chat.timestamp || chat.createdAt || '')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{chat.queries || chat.queryCount || 0}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{chat.tokens || chat.totalTokens || 0}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{(chat.avgLatency || chat.averageLatency || 0).toFixed(0)}ms</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        chat.status === 'completed' ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'
                      }`}>
                        {chat.status === 'completed' ? 'Completed' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <AnimatePresence mode="wait">
                  <Pagination 
                    key={`pagination-${pagination.currentPage}`}
                    currentPage={pagination.currentPage} 
                    totalPages={pagination.totalPages} 
                    onPageChange={(page: number) => setCurrentPage(page)}
                  />
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-400 text-center">No chat history available</p>
            <p className="text-gray-500 text-sm text-center mt-2">
              {searchTerm ? 'Try a different search term' : 'Chat data will appear here when users interact with this provider'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIManagementDetail; 