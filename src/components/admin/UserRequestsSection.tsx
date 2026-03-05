'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { MotionSelect } from '@/components/ui/MotionSelect';

type UserRequest = {
  id: string;
  email: string;
  name?: string;
  role: string;
  department?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt: string;
  requestedBy: {
    name: string;
    email: string;
  };
};

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const filterOptions = [
  { value: 'ALL', label: 'All Requests' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' }
];

export default function UserRequestsSection() {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Filter>('ALL');
  const { data: session } = useSession();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [newRequest, setNewRequest] = useState({
    email: '',
    name: '',
    role: 'USER',
    department: '',
    notes: ''
  });

  useEffect(() => {
    if (session?.user) {
      fetchRequests();
    }
    
    // Cleanup function
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [session]);

  const fetchRequests = async () => {
    try {
      setError('');
      setIsRefreshing(true);
      
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Set a timeout to ensure isRefreshing state is reset after a maximum time
      refreshTimeoutRef.current = setTimeout(() => {
        setIsRefreshing(false);
        setIsLoading(false);
        refreshTimeoutRef.current = null;
      }, 10000); // 10 second timeout
      
      const response = await fetch('/api/admin/user-requests');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch requests');
      }
      const data = await response.json();
      
      // Filter requests based on user role and email
      const userEmail = session?.user?.email;
      const userRole = session?.user?.role;
      const filteredData = userRole === 'USER' && userEmail
        ? data.filter((req: UserRequest) => req.requestedBy.email === userEmail)
        : data;
      
      setRequests(filteredData);
      
      // Clear the timeout if operation completed successfully
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user requests');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const response = await fetch('/api/admin/user-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create request');
      }

      const data = await response.json();
      setRequests(prev => [data, ...prev]);
      setNewRequest({
        email: '',
        name: '',
        role: 'USER',
        department: '',
        notes: ''
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user request');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch('/api/admin/user-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });

      if (!response.ok) throw new Error('Failed to update request');
      
      await fetchRequests(); // Refresh the list after update
    } catch (err) {
      setError('Failed to update request status');
    }
  };

  const getStatusColor = (status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'APPROVED':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
    }
  };

  const getStatusIcon = (status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    switch (status) {
      case 'PENDING':
        return ClockIcon;
      case 'APPROVED':
        return CheckCircleIcon;
      case 'REJECTED':
        return XCircleIcon;
    }
  };

  const filteredRequests = requests.filter(request => 
    filter === 'ALL' ? true : request.status === filter
  );

  if (isLoading) {
    return (
      <motion.div 
        className="flex justify-center items-center min-h-[400px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div 
          className="h-16 w-16 border-4 border-[#190b37] rounded-full"
          animate={{ 
            rotate: 360,
            borderTopColor: "transparent",
            borderRightColor: "rgba(25, 11, 55, 0.3)",
            borderBottomColor: "rgba(25, 11, 55, 0.6)"
          }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <div className="w-full sm:w-64">
              <MotionSelect
                options={filterOptions}
                value={filter}
                onChange={(value) => setFilter(value as Filter)}
                className="w-full"
              />
            </div>
          </div>
          <motion.button
            onClick={fetchRequests}
            key={`refresh-button-${isRefreshing}`}
            className={`px-3 py-1.5 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center ${isRefreshing ? 'opacity-75 cursor-not-allowed' : ''} w-full sm:w-auto`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isRefreshing}
          >
            <motion.div
              className="mr-1.5 flex items-center justify-center"
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={isRefreshing ? { 
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              } : { duration: 0 }}
            >
              <ArrowPathIcon className="h-4 w-4" />
            </motion.div>
            Refresh
          </motion.button>
        </div>
        {session?.user?.role !== 'SUPER_ADMIN' && (
          <motion.button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#00a0cb] text-white rounded-md hover:bg-[#0090b7] transition-colors duration-200 flex items-center justify-center w-full sm:w-auto"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Request New User
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 flex items-start"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-400">Error</h3>
              <p className="mt-1 text-sm text-red-300">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="ml-4"
            >
              <XMarkIcon className="h-5 w-5 text-red-400 hover:text-red-300" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmitRequest}
            className="space-y-4 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">New User Request</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  <span className="flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    Email
                  </span>
                </label>
                <input
                  type="email"
                  required
                  value={newRequest.email}
                  onChange={e => setNewRequest({ ...newRequest, email: e.target.value })}
                  className="block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-[#00a0cb] focus:ring-[#00a0cb] sm:text-sm placeholder-gray-400"
                  placeholder="user@example.com"
                  style={{ color: 'white' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  <span className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    Name
                  </span>
                </label>
                <input
                  type="text"
                  value={newRequest.name}
                  onChange={e => setNewRequest({ ...newRequest, name: e.target.value })}
                  className="block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-[#00a0cb] focus:ring-[#00a0cb] sm:text-sm placeholder-gray-400"
                  placeholder="John Doe"
                  style={{ color: 'white' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  <span className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    Role
                  </span>
                </label>
                <select
                  value={newRequest.role}
                  onChange={e => setNewRequest({ ...newRequest, role: e.target.value })}
                  className="block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-[#00a0cb] focus:ring-[#00a0cb] sm:text-sm"
                  style={{ color: 'white' }}
                >
                  <option value="USER" className="bg-gray-700 text-white">User</option>
                  <option value="ADMIN" className="bg-gray-700 text-white">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  <span className="flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    Department
                  </span>
                </label>
                <input
                  type="text"
                  value={newRequest.department}
                  onChange={e => setNewRequest({ ...newRequest, department: e.target.value })}
                  className="block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-[#00a0cb] focus:ring-[#00a0cb] sm:text-sm placeholder-gray-400"
                  placeholder="Engineering"
                  style={{ color: 'white' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                <span className="flex items-center">
                  <ChatBubbleLeftIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                  Notes
                </span>
              </label>
              <textarea
                value={newRequest.notes}
                onChange={e => setNewRequest({ ...newRequest, notes: e.target.value })}
                rows={3}
                className="block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-[#00a0cb] focus:ring-[#00a0cb] sm:text-sm placeholder-gray-400"
                placeholder="Additional information about the request..."
                style={{ color: 'white' }}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <motion.button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#00a0cb] rounded-md hover:bg-[#0090b7]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Submit Request
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Desktop Table View (hidden on small screens) */}
      <div className="hidden md:block bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Department</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Requested By</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                {session?.user?.role === 'SUPER_ADMIN' && (
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              <AnimatePresence>
                {filteredRequests.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={session?.user?.role === 'SUPER_ADMIN' ? 7 : 6} className="px-6 py-12 text-center">
                      <UserPlusIcon className="mx-auto h-12 w-12 text-gray-500" />
                      <p className="mt-2 text-sm text-gray-400">No requests found</p>
                    </td>
                  </motion.tr>
                ) : (
                  filteredRequests.map((request) => {
                    const StatusIcon = getStatusIcon(request.status);
                    return (
                      <motion.tr
                        key={request.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-700 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#190b37] to-[#2d1657] flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {request.name || 'Unnamed User'}
                              </div>
                              <div className="text-sm text-gray-400">
                                {request.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                            {request.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {request.department || 'Not Specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {request.requestedBy.name || request.requestedBy.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        {session?.user?.role === 'SUPER_ADMIN' && request.status === 'PENDING' && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <motion.button
                                onClick={() => handleUpdateStatus(request.id, 'APPROVED')}
                                className="text-green-500 hover:text-green-400"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleUpdateStatus(request.id, 'REJECTED')}
                                className="text-red-500 hover:text-red-400"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </motion.button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (visible on small screens) */}
      <motion.div 
        className="md:hidden space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {filteredRequests.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <UserPlusIcon className="mx-auto h-12 w-12 text-gray-500" />
            <p className="mt-2 text-sm text-gray-400">No requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const StatusIcon = getStatusIcon(request.status);
            return (
              <motion.div
                key={request.id}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-md"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -2 }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#190b37] to-[#2d1657] flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-white">
                          {request.name || 'Unnamed User'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {request.email}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      <StatusIcon className="h-4 w-4 mr-1" />
                      {request.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="text-xs text-gray-400">
                      <span className="block">Role</span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 mt-1 inline-block">
                        {request.role}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <span className="block">Department</span>
                      <span className="text-sm text-gray-300 block mt-1">{request.department || 'Not Specified'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="text-xs text-gray-400">
                      <span className="block">Requested By</span>
                      <span className="text-sm text-gray-300 block mt-1">{request.requestedBy.name || request.requestedBy.email}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <span className="block">Date</span>
                      <span className="text-sm text-gray-300 block mt-1">{new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {session?.user?.role === 'SUPER_ADMIN' && request.status === 'PENDING' && (
                    <div className="flex justify-end mt-4 pt-3 border-t border-gray-700">
                      <motion.button
                        onClick={() => handleUpdateStatus(request.id, 'APPROVED')}
                        className="flex items-center justify-center px-3 py-1 mr-2 bg-green-500/20 text-green-400 rounded-md"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">Approve</span>
                      </motion.button>
                      <motion.button
                        onClick={() => handleUpdateStatus(request.id, 'REJECTED')}
                        className="flex items-center justify-center px-3 py-1 bg-red-500/20 text-red-400 rounded-md"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">Reject</span>
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
} 