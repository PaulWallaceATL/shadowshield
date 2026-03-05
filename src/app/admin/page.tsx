'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  KeyIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  UsersIcon,
  ShieldExclamationIcon,
  NoSymbolIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import Image from 'next/image';

type QuickStats = {
  totalUsers: number;
  activeChats: number;
  pendingAlerts: number;
  dlpViolationsToday: number;
};

type Alert = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

const quickLinks = [
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    color: 'bg-indigo-500',
    description: 'View system analytics and metrics'
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: UserGroupIcon,
    color: 'bg-green-500',
    description: 'Manage user accounts and permissions'
  },
  {
    name: 'DLP Rules',
    href: '/admin/dlp',
    icon: ShieldCheckIcon,
    color: 'bg-yellow-500',
    description: 'Configure data loss prevention rules'
  },
  {
    name: 'Alerts',
    href: '/admin/alerts',
    icon: BellIcon,
    color: 'bg-red-500',
    description: 'View and manage system alerts'
  },
  {
    name: 'Admin Chat',
    href: '/admin/chat',
    icon: ChatBubbleLeftRightIcon,
    color: 'bg-blue-500',
    description: 'Access admin-only chat features'
  },
  {
    name: 'User Requests',
    href: '/admin/requests',
    icon: UserIcon,
    color: 'bg-purple-500',
    description: 'Handle pending user requests'
  },
  {
    name: 'API Management',
    href: '/admin/api-management',
    icon: KeyIcon,
    color: 'bg-cyan-500',
    description: 'Manage API keys and access'
  },
  {
    name: 'Documentation',
    href: '/admin/docs',
    icon: DocumentTextIcon,
    color: 'bg-gray-500',
    description: 'Access admin documentation'
  }
];

const CountingNumber = ({ value, duration = 1.5 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number;
    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setDisplayValue(Math.floor(progress * value));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalUsers: 0,
    activeChats: 0,
    pendingAlerts: 0,
    dlpViolationsToday: 0
  });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const [statsResponse, alertsResponse] = await Promise.all([
        fetch('/api/admin/quick-stats'),
        fetch('/api/admin/alerts?limit=5')
      ]);

      if (!statsResponse.ok || !alertsResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const stats = await statsResponse.json();
      const alertsData = await alertsResponse.json();

      setQuickStats(stats);
      setRecentAlerts(alertsData.alerts || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAlertClick = (alertId: string) => {
    router.push(`/admin/alerts/${alertId}`);
  };

  const handleRefresh = async () => {
    await fetchDashboardData();
  };

  const stats = [
    {
      title: 'Total Users',
      value: quickStats.totalUsers,
      icon: UsersIcon,
      color: 'from-blue-500 to-blue-600',
      href: '/admin/users'
    },
    {
      title: 'Active Chats',
      value: quickStats.activeChats,
      icon: ChartBarIcon,
      color: 'from-green-500 to-green-600',
      href: '/admin/allchats'
    },
    {
      title: 'Pending Alerts',
      value: quickStats.pendingAlerts,
      icon: ShieldExclamationIcon,
      color: 'from-red-500 to-red-600',
      href: '/admin/alerts'
    },
    {
      title: 'DLP Violations Today',
      value: quickStats.dlpViolationsToday,
      icon: NoSymbolIcon,
      color: 'from-yellow-500 to-yellow-600',
      href: '/admin/alerts'
    }
  ];

  if (!session?.user) return null;

  return (
    <div className="h-full">
      <div className="flex flex-col space-y-6 p-4 sm:p-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-[#1e293b] p-4 sm:p-6 rounded-lg shadow-lg"
        >
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src="/SSlogo.svg"
              alt="ShadowShield Logo"
              layout="fill"
              objectFit="contain"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              Welcome Back, {session.user.name || 'User'}
            </h2>
            <p className="text-sm text-gray-400">
              Here's what's happening in your system
            </p>
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-300">Monitor your system's performance and activity</p>
          </motion.div>
          
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#00a0cb] hover:bg-[#0090b7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00a0cb] disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Link href={stat.href} key={index} className="block">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-all duration-200 relative hover:shadow-xl hover:shadow-blue-900/20 group overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${stat.color.split(' ')[0].replace('from-', '')}, ${stat.color.split(' ')[1].replace('to-', '')})` }}
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-white bg-opacity-10 rounded-lg p-3">
                      <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-white truncate">{stat.title}</dt>
                        <dd>
                          <div className="text-lg font-semibold text-white">
                            <CountingNumber value={stat.value} />
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                  
                  {/* Arrow indicator that appears on hover */}
                  <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <ChevronRightIcon className="h-5 w-5 text-white" />
                  </div>
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 -z-10 bg-white opacity-0 group-hover:opacity-5 rounded-lg transition-opacity duration-300"></div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#1e293b] rounded-lg shadow-lg p-4 sm:p-6"
        >
          <h2 className="text-lg font-medium text-white mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => (
              <Link href={link.href} key={link.name}>
                <motion.div
                  className="bg-[#0f172a] rounded-lg p-4 cursor-pointer hover:bg-[#2a3749] transition-colors flex flex-col h-full"
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`p-2 ${link.color} bg-opacity-20 rounded-lg mb-3 self-start`}>
                    <link.icon className={`h-5 w-5 ${link.color.replace('bg-', 'text-')}`} />
                  </div>
                  <h3 className="text-white font-medium">{link.name}</h3>
                  <p className="text-gray-400 text-sm mt-1 flex-grow">{link.description}</p>
                  <div className="flex justify-end items-center mt-3">
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#1e293b] rounded-lg shadow-lg p-4 sm:p-6"
        >
          <h2 className="text-lg font-medium text-white mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                className="bg-[#0f172a] rounded-lg p-4 cursor-pointer hover:bg-[#2a3749] transition-colors"
                onClick={() => handleAlertClick(alert.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-[#ef4444]" />
                    <p className="text-white">{alert.message}</p>
                  </div>
                  <p className="text-sm text-gray-400 mt-1 sm:mt-0">
                    {new Date(alert.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
            {recentAlerts.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">No recent alerts</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 