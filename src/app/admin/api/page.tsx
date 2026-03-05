'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  KeyIcon, 
  ArrowPathIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import APIManagementSection, { APIManagementHandle } from '@/components/admin/APIManagementSection';
import SuperAdminAPIManagementSection from '@/components/admin/SuperAdminAPIManagementSection';
import { useRef, useState, useEffect } from 'react';

export default function APIManagementPage() {
  const { data: session } = useSession();
  const apiManagementRef = useRef<APIManagementHandle>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    activeKeys: 3,
    totalQueries: 84,
    queryTrend: -72.7,
    dlpViolations: 18,
    dlpPercentage: 0
  });

  useEffect(() => {
    // Set dynamic values for stats cards
    const totalQueriesEl = document.getElementById('total-queries-24h');
    const totalQueriesTrendEl = document.getElementById('total-queries-trend');
    const totalDlpBlocksEl = document.getElementById('total-dlp-blocks');
    const dlpPercentageEl = document.getElementById('dlp-percentage');
    
    if (totalQueriesEl) totalQueriesEl.textContent = stats.totalQueries.toString();
    if (totalQueriesTrendEl) totalQueriesTrendEl.textContent = `${stats.queryTrend}% vs yesterday`;
    if (totalDlpBlocksEl) totalDlpBlocksEl.textContent = stats.dlpViolations.toString();
    if (dlpPercentageEl) dlpPercentageEl.textContent = `${stats.dlpPercentage}%`;
  }, [stats]);

  if (!session?.user) {
    return null;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await apiManagementRef.current?.refreshData();
    setIsRefreshing(false);
  };

  return (
    <div className="h-full">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <div className="flex items-center gap-3">
              <KeyIcon className="h-8 w-8 text-[#00a0cb]" />
              <h1 className="text-xl sm:text-2xl font-semibold text-white">API Management</h1>
            </div>
            <p className="mt-1 text-sm text-gray-300">
              Manage and monitor your API keys for various providers
            </p>
          </div>
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#00a0cb] hover:bg-[#0090b7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00a0cb] disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>
        
        {session.user.role === 'SUPER_ADMIN' ? (
          <div>
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div 
                className="bg-gradient-to-br from-[#190b37] via-[#2d1657] to-[#00a0cb] rounded-lg shadow-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-300 text-sm">Active API Keys</p>
                    <h3 className="text-3xl font-bold text-white">{stats.activeKeys}</h3>
                  </div>
                  <div className="bg-[#3d1f77] bg-opacity-70 p-2 rounded-lg">
                    <KeyIcon className="h-6 w-6 text-[#00a0cb]" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-green-400 font-medium">100% Operational</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-[#190b37] via-[#2d1657] to-[#00a0cb] rounded-lg shadow-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-300 text-sm">Total Queries (24h)</p>
                    <h3 className="text-3xl font-bold text-white" id="total-queries-24h">{stats.totalQueries}</h3>
                  </div>
                  <div className="bg-[#3d1f77] bg-opacity-70 p-2 rounded-lg">
                    <ChartBarIcon className="h-6 w-6 text-[#00a0cb]" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-red-400 font-medium" id="total-queries-trend">{stats.queryTrend}% vs yesterday</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-[#190b37] via-[#2d1657] to-[#00a0cb] rounded-lg shadow-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-300 text-sm">DLP Violations (24h)</p>
                    <h3 className="text-3xl font-bold text-white" id="total-dlp-blocks">{stats.dlpViolations}</h3>
                  </div>
                  <div className="bg-[#3d1f77] bg-opacity-70 p-2 rounded-lg">
                    <ShieldCheckIcon className="h-6 w-6 text-[#00a0cb]" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-orange-400 font-medium" id="dlp-percentage">{stats.dlpPercentage}%</p>
                </div>
              </motion.div>
            </div>
            <SuperAdminAPIManagementSection ref={apiManagementRef} />
          </div>
        ) : (
          <div>
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div 
                className="bg-gradient-to-br from-[#190b37] via-[#2d1657] to-[#00a0cb] rounded-lg shadow-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-300 text-sm">Active API Keys</p>
                    <h3 className="text-3xl font-bold text-white">{stats.activeKeys}</h3>
                  </div>
                  <div className="bg-[#3d1f77] bg-opacity-70 p-2 rounded-lg">
                    <KeyIcon className="h-6 w-6 text-[#00a0cb]" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-green-400 font-medium">100% Operational</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-[#190b37] via-[#2d1657] to-[#00a0cb] rounded-lg shadow-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-300 text-sm">Total Queries (24h)</p>
                    <h3 className="text-3xl font-bold text-white" id="total-queries-24h">{stats.totalQueries}</h3>
                  </div>
                  <div className="bg-[#3d1f77] bg-opacity-70 p-2 rounded-lg">
                    <ChartBarIcon className="h-6 w-6 text-[#00a0cb]" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-red-400 font-medium" id="total-queries-trend">{stats.queryTrend}% vs yesterday</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-[#190b37] via-[#2d1657] to-[#00a0cb] rounded-lg shadow-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-300 text-sm">DLP Violations (24h)</p>
                    <h3 className="text-3xl font-bold text-white" id="total-dlp-blocks">{stats.dlpViolations}</h3>
                  </div>
                  <div className="bg-[#3d1f77] bg-opacity-70 p-2 rounded-lg">
                    <ShieldCheckIcon className="h-6 w-6 text-[#00a0cb]" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-orange-400 font-medium" id="dlp-percentage">{stats.dlpPercentage}%</p>
                </div>
              </motion.div>
            </div>
            <APIManagementSection ref={apiManagementRef} />
          </div>
        )}
      </div>
    </div>
  );
} 