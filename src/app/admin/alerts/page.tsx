'use client';

import { useSession } from 'next-auth/react';
import AlertsSection from '@/components/admin/AlertsSection';
import { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

type Alert = {
  id: string;
  type: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
  userId: string;
  chatId?: string;
};

export default function AlertsPage() {
  const { data: session, status } = useSession();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const alertsPerPage = 8;

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/alerts?page=${currentPage}&limit=${alertsPerPage}`);
        const data = await response.json();
        setAlerts(data.alerts);
        setTotalPages(Math.ceil(data.total / alertsPerPage));
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [currentPage]);

  // Handle loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle unauthorized access
  if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="flex flex-col mb-4 sm:mb-0">
            <div className="flex items-center gap-3">
              <BellIcon className="h-8 w-8 text-[#00a0cb]" />
              <h1 className="text-xl sm:text-2xl font-semibold text-white">System Alerts</h1>
            </div>
            <p className="text-gray-400 mt-2 text-sm sm:text-base ml-11">
              Monitor and manage all system alerts and notifications
            </p>
          </div>
        </div>
        <div className="bg-[#151517] rounded-lg shadow overflow-hidden">
          <div className="p-4 sm:p-6">
            <AlertsSection />
          </div>
        </div>
      </div>
    </div>
  );
} 