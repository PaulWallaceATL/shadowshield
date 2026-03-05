'use client';

import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  KeyIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BeakerIcon,
  CloudIcon,
  CpuChipIcon,
  ChartBarIcon,
  BoltIcon,
  ShieldExclamationIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export interface APIManagementHandle {
  refreshData: () => void;
}

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
    avgTokensPerQuery: number;
    todayQueries: number;
    yesterdayQueries: number;
    trendPercentage: number;
    trend: 'up' | 'down' | 'stable';
    uniqueUsers?: number;
  }
}

const providerInfo = {
  ANTHROPIC: {
    name: 'Anthropic',
    color: 'bg-[#EBDBBC]',
    lightColor: 'bg-[#EBDBBC]/30',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-700',
    logo: '/claude.svg'
  },
  OPENAI: {
    name: 'OpenAI',
    color: 'bg-white',
    lightColor: 'bg-gray-100',
    textColor: 'text-black',
    borderColor: 'border-black',
    logo: '/openai.svg'
  },
  GOOGLE: {
    name: 'Google',
    color: 'bg-[#1E1E1E]',
    lightColor: 'bg-[#1E1E1E]/30',
    textColor: 'text-white',
    borderColor: 'border-gray-700',
    logo: '/gemini.svg'
  }
};

const APIManagementSection = forwardRef<APIManagementHandle, {}>((props, ref) => {
  const [apiKeys, setApiKeys] = useState<APIKeyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalQueriesLast24h, setTotalQueriesLast24h] = useState<number>(0);
  const [totalDlpBlocks, setTotalDlpBlocks] = useState<number>(0);
  const [dlpBlockPercentage, setDlpBlockPercentage] = useState<string>('0%');
  const { data: session } = useSession();

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/api-keys');
      if (!response.ok) {
        throw new Error('Failed to fetch API keys data');
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        setApiKeys(data);
        
        // Calculate total metrics
        const last24hQueries = data.reduce((sum, key) => sum + key.stats.last24HQueries, 0);
        const dlpBlocks = data.reduce((sum, key) => sum + key.stats.dlpFlaggedQueries, 0);
        
        setTotalQueriesLast24h(last24hQueries);
        setTotalDlpBlocks(dlpBlocks);
        
        // Calculate DLP block percentage
        if (last24hQueries > 0) {
          const percentage = (dlpBlocks / last24hQueries * 100).toFixed(1);
          setDlpBlockPercentage(`${percentage}% of queries`);
        } else {
          setDlpBlockPercentage('0% of queries');
        }
        
        // Update UI elements
        const queryTrendElement = document.getElementById('total-queries-trend');
        const queriesElement = document.getElementById('total-queries-24h');
        const dlpElement = document.getElementById('total-dlp-blocks');
        const dlpPercentElement = document.getElementById('dlp-percentage');
        
        if (queriesElement) queriesElement.textContent = last24hQueries.toLocaleString();
        if (dlpElement) dlpElement.textContent = dlpBlocks.toLocaleString();
        if (dlpPercentElement) dlpPercentElement.textContent = dlpBlockPercentage;
        
        // Calculate trend
        const todayTotal = data.reduce((sum, key) => sum + key.stats.todayQueries, 0);
        const yesterdayTotal = data.reduce((sum, key) => sum + key.stats.yesterdayQueries, 0);
        
        if (queryTrendElement && yesterdayTotal > 0) {
          const trendPercentage = ((todayTotal - yesterdayTotal) / yesterdayTotal * 100).toFixed(1);
          const isPositive = todayTotal >= yesterdayTotal;
          
          queryTrendElement.textContent = `${isPositive ? '+' : ''}${trendPercentage}% vs yesterday`;
          queryTrendElement.className = `text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`;
        } else if (queryTrendElement) {
          queryTrendElement.textContent = 'No data from yesterday';
        }
      } else {
        throw new Error('Invalid data format');
      }
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useImperativeHandle(ref, () => ({
    refreshData
  }));

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className="bg-gray-800/50 animate-pulse rounded-xl shadow-md h-64"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-700 text-red-300 p-4 rounded-lg">
          <p className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            {error}
          </p>
          <button 
            onClick={refreshData} 
            className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {apiKeys.map((apiKey) => {
            const provider = providerInfo[apiKey.provider];
            return (
              <motion.div
                key={apiKey.id}
                className={`${provider.color} rounded-xl shadow-xl overflow-hidden border ${apiKey.provider === 'OPENAI' ? 'border-gray-800' : 'border-transparent'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                transition={{ duration: 0.5 }}
              >
                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <img src={provider.logo} alt={provider.name} className="h-8 w-8 mr-2" />
                      <h3 className={`text-xl font-bold ${provider.textColor}`}>{provider.name}</h3>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${apiKey.stats.successRate >= 95 ? 'bg-green-900/40 text-green-300' : apiKey.stats.successRate >= 80 ? 'bg-yellow-900/40 text-yellow-300' : 'bg-red-900/40 text-red-300'}`}>
                      {apiKey.stats.successRate.toFixed(1)}% Success
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`${provider.lightColor} p-3 rounded-lg`}>
                      <p className={`text-xs ${provider.textColor} opacity-80 mb-1`}>Queries (24h)</p>
                      <p className={`text-lg font-bold ${provider.textColor}`}>{apiKey.stats.last24HQueries.toLocaleString()}</p>
                      {apiKey.stats.trendPercentage !== 0 && (
                        <div className="flex items-center text-xs mt-1">
                          {apiKey.stats.trend === 'up' ? (
                            <>
                              <ArrowUpIcon className="h-3 w-3 text-green-400 mr-1" />
                              <span className="text-green-400">+{apiKey.stats.trendPercentage.toFixed(1)}%</span>
                            </>
                          ) : apiKey.stats.trend === 'down' ? (
                            <>
                              <ArrowDownIcon className="h-3 w-3 text-red-400 mr-1" />
                              <span className="text-red-400">{apiKey.stats.trendPercentage.toFixed(1)}%</span>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                    
                    <div className={`${provider.lightColor} p-3 rounded-lg`}>
                      <p className={`text-xs ${provider.textColor} opacity-80 mb-1`}>Avg. Latency</p>
                      <p className={`text-lg font-bold ${provider.textColor}`}>{apiKey.stats.averageLatency.toFixed(0)}ms</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className={`${provider.lightColor} p-2 rounded-lg text-center`}>
                      <p className={`text-[10px] ${provider.textColor} opacity-80`}>Total</p>
                      <p className={`text-sm font-semibold ${provider.textColor}`}>{apiKey.stats.totalQueries.toLocaleString()}</p>
                    </div>
                    
                    <div className={`${provider.lightColor} p-2 rounded-lg text-center`}>
                      <p className={`text-[10px] ${provider.textColor} opacity-80`}>DLP Violations</p>
                      <p className={`text-sm font-semibold ${provider.textColor}`}>{apiKey.stats.dlpFlaggedQueries.toLocaleString()}</p>
                    </div>
                    
                    <div className={`${provider.lightColor} p-2 rounded-lg text-center`}>
                      <p className={`text-[10px] ${provider.textColor} opacity-80`}>Users</p>
                      <p className={`text-sm font-semibold ${provider.textColor}`}>{(apiKey.stats.uniqueUsers || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <Link href={`/admin/api-management/${apiKey.provider.toLowerCase()}`}>
                    <motion.div
                      className={`w-full text-center py-2 border ${provider.borderColor} rounded-lg ${provider.textColor} text-sm font-medium`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      View Details
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
});

APIManagementSection.displayName = 'APIManagementSection';
export default APIManagementSection; 