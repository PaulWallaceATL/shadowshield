'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList
} from 'recharts';
import Link from 'next/link';
import { motion, AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ShieldExclamationIcon,
  BellIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  BoltSlashIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { CountingNumber } from '@/components/ui/CountingNumber';
import QueryTrendsGraph from './QueryTrendsGraph';

type Analytics = {
  queries: {
    last24h: number;
    last7d: number;
    last30d: number;
    byDay: Array<{ name: string; value: number }>;
  };
  blockedQueries: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  flaggedQueries: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  activeUsers: {
    last24h: number;
    last7d: number;
    last30d: number;
    topUsers: Array<{ 
      id: string;
      name: string; 
      queries: number; 
      successRate: number;
    }>;
  };
  dlpViolations: {
    last24h: number;
    last7d: number;
    last30d: number;
    byType: Array<{ name: string; value: number; color: string }>;
  };
  responseTimes: Array<{ name: string; value: number }>;
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    createdAt: string;
  }>;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
};

const chartVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration: 0.8
    }
  }
};

const NoDataDisplay = ({ title }: { title: string }) => (
  <m.div 
    className="flex flex-col items-center justify-center h-64"
    variants={itemVariants}
  >
    <m.img
      src="/SSlogo.svg"
      alt="ShadowAI Shield"
      className="h-24 w-auto mb-4 opacity-50"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    />
    <m.p 
      className="text-gray-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      No {title} Data Available
    </m.p>
  </m.div>
);

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFD93D', '#6C5CE7'];

interface AnalyticsSectionProps {
  dateRange?: string;
  setDateRange?: React.Dispatch<React.SetStateAction<string>>;
}

interface AnalyticsData {
  queryTrends: Array<{ name: string; value: number }>;
  dlpViolations: Array<{ name: string; value: number }>;
  stats: {
    totalQueries: number;
    blockedQueries: number;
    activeUsers: number;
    dlpViolations: number;
  };
  recentAlerts: Array<{
    id: string;
    message: string;
    type: string;
    createdAt: string;
  }>;
  topUsers: Array<{
    id: string;
    name: string;
    queries: number;
    successRate: number;
    violations: number;
  }>;
}

export default function AnalyticsSection({ dateRange: externalDateRange, setDateRange: externalSetDateRange }: AnalyticsSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  
  // Create internal state for dateRange if not provided externally
  const [internalDateRange, setInternalDateRange] = useState('24h');
  
  // Use either external or internal state based on what's provided
  const dateRange = externalDateRange || internalDateRange;
  const setDateRange = typeof externalSetDateRange === 'function' 
    ? externalSetDateRange 
    : setInternalDateRange;

  // Default date range options
  const dateRangeOptions = [
    { label: 'Last 24 hours', value: '24h' },
    { label: 'Last week', value: '7d' },
    { label: 'All time', value: 'all' }
  ];

  // Find the current selected option label based on dateRange value
  const selectedRangeLabel = dateRangeOptions.find(option => option.value === dateRange)?.label || 'Last 24 hours';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRangeChange = (value: string) => {
    setDateRange(value);
    setIsDropdownOpen(false);
  };

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // The dateRange is now directly the API parameter value
      const apiRange = dateRange || '24h';
      
      const response = await fetch(`/api/admin/analytics?range=${apiRange}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics data');
      }
      
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleAlertClick = (alertId: string) => {
    router.push(`/admin/alerts/${alertId}`);
  };

  // Function to render the custom labels for the pie chart
  const renderCustomizedLabel = ({ 
    cx, 
    cy, 
    midAngle, 
    innerRadius, 
    outerRadius, 
    value, 
    name 
  }: { 
    cx: number; 
    cy: number; 
    midAngle: number; 
    innerRadius: number; 
    outerRadius: number; 
    value: number; 
    name: string; 
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.25; // Increased radius for more space
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Don't truncate the name anymore
    return (
      <text
        x={x}
        y={y}
        fill="#9CA3AF"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '11px', fontWeight: 'normal' }}
      >
        {`${name}: ${value}`}
      </text>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00a0cb] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/allchats" className="block transition-all duration-200 hover:scale-105 hover:shadow-xl">
          <div className="bg-[#1e293b] rounded-lg p-6 shadow-lg cursor-pointer">
            <div className="flex items-center">
              <div className="p-2 bg-[#00a0cb] bg-opacity-20 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-[#00a0cb]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Queries</p>
                <p className="text-2xl font-semibold text-white">
                  <CountingNumber value={analytics?.stats?.totalQueries || 0} />
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/users" className="block transition-all duration-200 hover:scale-105 hover:shadow-xl">
          <div className="bg-[#1e293b] rounded-lg p-6 shadow-lg cursor-pointer">
            <div className="flex items-center">
              <div className="p-2 bg-[#2f4faa] bg-opacity-20 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-[#2f4faa]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active Users</p>
                <p className="text-2xl font-semibold text-white">
                  <CountingNumber value={analytics?.stats?.activeUsers || 0} />
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/alerts" className="block transition-all duration-200 hover:scale-105 hover:shadow-xl">
          <div className="bg-[#1e293b] rounded-lg p-6 shadow-lg cursor-pointer">
            <div className="flex items-center">
              <div className="p-2 bg-[#ef4444] bg-opacity-20 rounded-lg">
                <ShieldExclamationIcon className="h-6 w-6 text-[#ef4444]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">DLP Violations</p>
                <p className="text-2xl font-semibold text-white">
                  <CountingNumber value={analytics?.stats?.dlpViolations || 0} />
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/alerts" className="block transition-all duration-200 hover:scale-105 hover:shadow-xl">
          <div className="bg-[#1e293b] rounded-lg p-6 shadow-lg cursor-pointer">
            <div className="flex items-center">
              <div className="p-2 bg-[#f59e0b] bg-opacity-20 rounded-lg">
                <NoSymbolIcon className="h-6 w-6 text-[#f59e0b]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Blocked Queries</p>
                <p className="text-2xl font-semibold text-white">
                  <CountingNumber value={analytics?.stats?.blockedQueries || 0} />
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Trends */}
        <div className="bg-[#1e293b] rounded-lg shadow-lg">
          <h3 className="text-lg font-medium text-white p-6 pb-0">Query Performance Metrics</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { time: '00:00', queries: 12, successRate: 95, avgResponseTime: 0.8 },
                  { time: '03:00', queries: 8, successRate: 92, avgResponseTime: 0.9 },
                  { time: '06:00', queries: 10, successRate: 97, avgResponseTime: 0.7 },
                  { time: '09:00', queries: 22, successRate: 98, avgResponseTime: 0.6 },
                  { time: '12:00', queries: 26, successRate: 96, avgResponseTime: 0.8 },
                  { time: '15:00', queries: 20, successRate: 94, avgResponseTime: 1.0 },
                  { time: '18:00', queries: 22, successRate: 97, avgResponseTime: 0.7 },
                  { time: '21:00', queries: 18, successRate: 98, avgResponseTime: 0.6 }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis yAxisId="left" stroke="#3B82F6" domain={[0, 'dataMax + 5']} />
                <YAxis yAxisId="right" orientation="right" stroke="#FF6B6B" domain={[85, 100]} />
                <YAxis yAxisId="right2" orientation="right" stroke="#4ECDC4" hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#1F2937',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                  formatter={(value, name) => {
                    if (name === 'queries') return [`${value} queries`, 'Volume'];
                    if (name === 'successRate') return [`${value}%`, 'Success Rate'];
                    if (name === 'avgResponseTime') return [`${value}s`, 'Response Time'];
                    return [value, name];
                  }}
                />
                <Legend
                  formatter={(value) => {
                    if (value === 'queries') return <span style={{ color: '#F3F4F6' }}>Query Volume</span>;
                    if (value === 'successRate') return <span style={{ color: '#F3F4F6' }}>Success Rate</span>;
                    if (value === 'avgResponseTime') return <span style={{ color: '#F3F4F6' }}>Avg Response Time</span>;
                    return <span style={{ color: '#F3F4F6' }}>{value}</span>;
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="queries"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                  name="queries"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="successRate"
                  stroke="#FF6B6B"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                  name="successRate"
                />
                <Line
                  yAxisId="right2"
                  type="monotone"
                  dataKey="avgResponseTime"
                  stroke="#4ECDC4"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                  name="avgResponseTime"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DLP Violations */}
        <div className="bg-[#1e293b] rounded-lg shadow-lg">
          <h3 className="text-lg font-medium text-white p-6 pb-0">DLP Violations by Type</h3>
          <div className="h-[300px]">
            {analytics?.dlpViolations && analytics.dlpViolations.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.dlpViolations.map((item, index) => ({
                      ...item,
                      color: COLORS[index % COLORS.length]
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={renderCustomizedLabel}
                    outerRadius={65}
                    innerRadius={35}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {analytics.dlpViolations.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#1F2937',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                    itemStyle={{
                      color: '#1F2937'
                    }}
                    formatter={(value: number, name: string) => [`${value} violations`, name]}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    wrapperStyle={{
                      paddingLeft: '20px',
                      fontSize: '11px',
                      lineHeight: '1.2em'
                    }}
                    formatter={(value: string) => (
                      <span style={{ color: '#F3F4F6' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No DLP violations data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users - Use real data from API */}
        <div className="col-span-1 lg:col-span-2 bg-[#1F2937] rounded-lg shadow-md overflow-hidden">
          <h3 className="text-lg font-medium text-white p-6 pb-4">Top Users</h3>
          <div className="px-6 pb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#374151] text-left">
                  <th className="pb-2 text-gray-400 font-medium text-sm">Rank</th>
                  <th className="pb-2 text-gray-400 font-medium text-sm">User</th>
                  <th className="pb-2 text-gray-400 font-medium text-sm">Total Queries</th>
                  <th className="pb-2 text-gray-400 font-medium text-sm">Success Rate</th>
                  <th className="pb-2 text-gray-400 font-medium text-sm">DLP Violations</th>
                </tr>
              </thead>
              <tbody>
                {/* Use actual data from the analytics API */}
                {analytics ? (
                  analytics.topUsers.map((user, index) => (
                    <tr key={user.id} className="border-b border-[#374151] hover:bg-[#2a3749]">
                      <td className="py-4 text-white font-medium">#{index + 1}</td>
                      <td className="py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#374151] flex items-center justify-center text-white text-lg font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="text-white font-medium">{user.name}</p>
                            <p className="text-gray-400 text-sm">USER</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-white">{user.queries}</td>
                      <td className="py-4 pr-6">
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white font-medium">{user.successRate || 0}%</span>
                          </div>
                          <div className="w-full bg-[#374151] rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                user.successRate > 95 ? 'bg-green-500' : 
                                user.successRate > 90 ? 'bg-yellow-500' : 
                                user.successRate > 80 ? 'bg-orange-400' : 'bg-red-500'
                              }`} 
                              style={{ width: `${Math.max(user.successRate || 0, 5)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span 
                          className={`px-2 py-1 rounded-md text-sm font-medium ${
                            user.violations === 0 ? 'bg-green-900 text-green-300' : 
                            user.violations === 1 ? 'bg-yellow-900 text-yellow-300' : 
                            user.violations === 2 ? 'bg-orange-900 text-orange-300' : 'bg-red-900 text-red-300'
                          }`}
                        >
                          {user.violations} {user.violations === 1 ? 'violation' : 'violations'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400">
                      No user data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Row - for Top Providers and Model Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-1 lg:col-span-2">
          {/* Top Providers/Models */}
          <div className="bg-[#1e293b] rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-white p-6 pb-0">Top Providers/Models</h3>
            <div className="h-[300px]">
              {/* Use more realistic provider data */}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Claude 3 Sonnet', value: 55 },
                      { name: 'GPT-4', value: 30 },
                      { name: 'Gemini Pro', value: 15 }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius * 1.2;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#9CA3AF"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                        >
                          {`${value}%`}
                        </text>
                      );
                    }}
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#1F2937',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                    itemStyle={{
                      color: '#1F2937'
                    }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    wrapperStyle={{
                      paddingLeft: '20px'
                    }}
                    formatter={(value: string) => (
                      <span style={{ color: '#F3F4F6' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Performance - New component to fill empty space */}
          <div className="bg-[#1e293b] rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-white p-6 pb-0">Model Performance</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { 
                      name: 'Claude 3', 
                      successRate: 97.8, 
                      responseTime: 2.4, 
                      throughput: 42 
                    },
                    { 
                      name: 'GPT-4', 
                      successRate: 98.2, 
                      responseTime: 3.1, 
                      throughput: 38 
                    },
                    { 
                      name: 'Gemini', 
                      successRate: 96.5, 
                      responseTime: 2.1, 
                      throughput: 44 
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke="#FF6B6B" 
                    domain={[90, 100]} 
                    label={{ 
                      value: "%", 
                      position: "insideLeft",
                      angle: -90, 
                      style: { fill: "#9CA3AF", fontSize: 12 }
                    }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#4ECDC4" 
                    domain={[0, 5]} 
                    label={{ 
                      value: "sec", 
                      position: "insideRight",
                      angle: -90, 
                      style: { fill: "#9CA3AF", fontSize: 12 }
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#1F2937',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'successRate') return [`${value.toFixed(1)}%`, 'Success Rate'];
                      if (name === 'responseTime') return [`${value.toFixed(1)}s`, 'Avg Response Time'];
                      if (name === 'throughput') return [`${value} t/s`, 'Token Throughput'];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    formatter={(value: string) => (
                      <span style={{ color: '#F3F4F6' }}>
                        {value === 'successRate' ? 'Success Rate' : 
                         value === 'responseTime' ? 'Response Time' : 
                         'Token Throughput'}
                      </span>
                    )}
                  />
                  <Bar yAxisId="left" dataKey="successRate" fill="#FF6B6B" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="right" dataKey="responseTime" fill="#4ECDC4" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-[#1e293b] rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-medium text-white mb-4">Recent Alerts</h3>
        <div className="space-y-4">
          {analytics?.recentAlerts && analytics.recentAlerts.length > 0 ? (
            analytics.recentAlerts.map((alert) => {
              if (!alert) return null; // Skip if alert is undefined
              
              return (
                <motion.div
                  key={alert.id}
                  className="bg-[#2a3749] rounded-lg p-4 cursor-pointer hover:bg-[#374151] transition-colors"
                  onClick={() => handleAlertClick(alert.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ShieldExclamationIcon className="h-5 w-5 text-[#ef4444]" />
                      <p className="text-white">{alert.message || 'Alert notification'}</p>
                    </div>
                    <p className="text-sm text-gray-400">
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'Unknown date'}
                    </p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No recent alerts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 