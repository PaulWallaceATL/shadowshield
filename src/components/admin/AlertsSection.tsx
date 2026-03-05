'use client';

import { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  XCircleIcon,
  CheckCircleIcon,
  BellIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  UserIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionSelect } from '@/components/ui/MotionSelect';

type Alert = {
  id: string;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  createdAt: string;
  status: 'PENDING' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  assignedTo?: string;
};

const severityColors = {
  LOW: 'bg-blue-50 text-blue-700 border-blue-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  CRITICAL: 'bg-red-100 text-red-900 border-red-300'
};

const statusColors = {
  OPEN: 'bg-red-50 text-red-700',
  ACKNOWLEDGED: 'bg-yellow-50 text-yellow-700',
  RESOLVED: 'bg-green-50 text-green-700',
  ESCALATED: 'bg-purple-50 text-purple-700'
};

const typeIcons = {
  DLP_VIOLATION: ShieldExclamationIcon,
  SYSTEM_ERROR: XCircleIcon,
  AUTHENTICATION_FAILURE: ExclamationTriangleIcon,
  API_ERROR: ExclamationTriangleIcon
};

const POLLING_INTERVAL = 5000; // Poll every 5 seconds

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }

  if (Notification.permission !== 'granted') {
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  }
};

type AlertFilter = 'ALL' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'PENDING';

const filterOptions = [
  { value: 'ALL', label: 'All Alerts' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'OPEN', label: 'Open' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'RESOLVED', label: 'Resolved' }
];

export default function AlertsSection() {
  const router = useRouter();
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<AlertFilter>('ALL');
  const alertsPerPage = 8;

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/alerts?page=${currentPage}&limit=${alertsPerPage}${filter !== 'ALL' ? `&status=${filter}` : ''}`);
      const data = await response.json();
      setAlerts(data.alerts);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [currentPage, filter]);

  const handleUpdateStatus = async (alertId: string, status: 'ACKNOWLEDGED' | 'RESOLVED') => {
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update alert status');
      await fetchAlerts(); // Refresh alerts after update
    } catch (err) {
      console.error('Error updating alert:', err);
    }
  };

  const handleAlertClick = (alertId: string) => {
    router.push(`/admin/alerts/${alertId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg ${
              filter === 'ALL' ? 'bg-[#00a0cb] text-white' : 'bg-[#190b37] text-gray-300'
            } transition-colors duration-200`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1 rounded-lg ${
              filter === 'PENDING' ? 'bg-[#00a0cb] text-white' : 'bg-[#190b37] text-gray-300'
            } transition-colors duration-200`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('OPEN')}
            className={`px-3 py-1 rounded-lg ${
              filter === 'OPEN' ? 'bg-[#00a0cb] text-white' : 'bg-[#190b37] text-gray-300'
            } transition-colors duration-200`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('ACKNOWLEDGED')}
            className={`px-3 py-1 rounded-lg ${
              filter === 'ACKNOWLEDGED' ? 'bg-[#00a0cb] text-white' : 'bg-[#190b37] text-gray-300'
            } transition-colors duration-200`}
          >
            Acknowledged
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`px-3 py-1 rounded-lg ${
              filter === 'RESOLVED' ? 'bg-[#00a0cb] text-white' : 'bg-[#190b37] text-gray-300'
            } transition-colors duration-200`}
          >
            Resolved
          </button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchAlerts}
            className="px-3 py-1 rounded-lg bg-[#190b37] text-white hover:bg-[#2d1657] transition-colors flex items-center"
            disabled={loading}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-[#190b37] text-white disabled:opacity-50 hover:bg-[#2d1657] transition-colors"
          >
            Previous
          </button>
          <span className="text-white text-sm whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg bg-[#190b37] text-white disabled:opacity-50 hover:bg-[#2d1657] transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a0cb]"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-400 bg-[#190b37] rounded-lg p-6">
          No alerts found
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              className="bg-[#190b37] p-4 rounded-lg hover:bg-[#2d1657] transition-colors cursor-pointer"
              onClick={() => handleAlertClick(alert.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-4 overflow-hidden max-w-full sm:max-w-[calc(100%-120px)]">
                  <div className={`w-2 h-2 mt-1.5 sm:mt-0 rounded-full flex-shrink-0 ${
                    alert.severity === 'HIGH' ? 'bg-red-500' :
                    alert.severity === 'MEDIUM' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-white font-medium truncate">{alert.message}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 flex-shrink-0">
                  <span className={`px-2 py-1 rounded-lg text-sm whitespace-nowrap ${
                    alert.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' :
                    alert.status === 'OPEN' ? 'bg-red-500/20 text-red-400' :
                    alert.status === 'ACKNOWLEDGED' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {alert.status}
                  </span>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
} 