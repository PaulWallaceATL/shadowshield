'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  ClockIcon, 
  ShieldExclamationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  ChatBubbleLeftIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { use } from 'react';

type AlertDetails = {
  id: string;
  type: string;
  message: string;
  severity: string;
  status: string;
  createdAt: string;
  metadata: any;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  chat?: {
    id: string;
    title: string;
    messages: {
      id: string;
      role: string;
      content: string;
      createdAt: string;
      flagged?: boolean;
      flagReason?: string;
    }[];
    messageCount?: number;
  };
};

export default function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [alert, setAlert] = useState<AlertDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchAlertDetails = async () => {
      try {
        const response = await fetch(`/api/admin/alerts/${resolvedParams.id}`);
        const data = await response.json();
        
        // If the alert has a chat, fetch the chat details
        if (data.chat?.id) {
          const chatResponse = await fetch(`/api/admin/chats/${data.chat.id}`);
          const chatData = await chatResponse.json();
          data.chat.messageCount = chatData.messages.length;
        }
        
        setAlert(data);
      } catch (error) {
        console.error('Error fetching alert details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertDetails();
  }, [resolvedParams.id]);

  const handleBack = () => {
    router.back();
  };

  const handleUpdateStatus = async (newStatus: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED') => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/admin/alerts/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update alert status');
      }

      const updatedAlert = await response.json();
      setAlert(updatedAlert);
    } catch (error) {
      console.error('Error updating alert status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChatClick = () => {
    if (alert?.chat?.id) {
      router.push(`/admin/chats/${alert.chat.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 flex justify-center items-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00a0cb]"></div>
          <p className="mt-4 text-gray-400">Loading alert details...</p>
        </div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="min-h-screen p-4 sm:p-6 flex justify-center items-center">
        <div className="bg-[#190b37] rounded-lg shadow-lg p-6 text-center">
          <p className="text-gray-400 text-xl">Alert not found</p>
          <button 
            onClick={handleBack} 
            className="mt-4 px-4 py-2 bg-[#00a0cb] text-white rounded-lg hover:bg-[#0090b8] transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <motion.button
        onClick={handleBack}
        className="mb-6 flex items-center text-gray-400 hover:text-white"
        whileHover={{ x: -4 }}
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back
      </motion.button>

      <div className="bg-[#190b37] rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-0">Alert Details</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium w-fit
                ${alert?.severity === 'HIGH' ? 'bg-red-900 text-red-200' :
                  alert?.severity === 'MEDIUM' ? 'bg-yellow-900 text-yellow-200' :
                  'bg-blue-900 text-blue-200'}`}>
                {alert?.severity}
              </span>
            </div>
            
            {/* Action Buttons */}
            {alert && (
              <div className="flex flex-col sm:flex-row gap-3">
                {alert.status !== 'PENDING' && (
                  <motion.button
                    onClick={() => handleUpdateStatus('PENDING')}
                    disabled={isUpdating}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ClockIcon className="h-5 w-5 mr-2" />
                    Mark Pending
                  </motion.button>
                )}
                {alert.status !== 'ACKNOWLEDGED' && alert.status !== 'RESOLVED' && (
                  <motion.button
                    onClick={() => handleUpdateStatus('ACKNOWLEDGED')}
                    disabled={isUpdating}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2f4faa] hover:bg-[#3a5fcf] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4faa] disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Acknowledge
                  </motion.button>
                )}
                {alert.status !== 'RESOLVED' && (
                  <motion.button
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    disabled={isUpdating}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Resolve
                  </motion.button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Status:</span>
              <span className={`px-2 py-1 rounded-md text-sm font-medium
                ${alert?.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' :
                  alert?.status === 'OPEN' ? 'bg-red-900/20 text-red-400' :
                  alert?.status === 'ACKNOWLEDGED' ? 'bg-yellow-900/20 text-yellow-400' :
                  alert?.status === 'RESOLVED' ? 'bg-green-900/20 text-green-400' :
                  'bg-gray-900/20 text-gray-400'}`}>
                {alert?.status}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Message</h3>
              <p className="text-gray-300 break-words whitespace-pre-wrap">{alert.message}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Details</h3>
              <div className="bg-[#2d1657] rounded-lg p-4 space-y-3">
                <div className="flex items-center text-gray-300">
                  <ClockIcon className="h-5 w-5 mr-2 text-gray-400 flex-shrink-0" />
                  <span className="break-words">Created: {new Date(alert.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <ShieldExclamationIcon className="h-5 w-5 mr-2 text-gray-400 flex-shrink-0" />
                  <span className="break-words">Type: {alert.type}</span>
                </div>
                {alert.user && (
                  <div 
                    onClick={() => router.push(`/admin/users/${alert.user?.id}`)}
                    className="text-gray-300 cursor-pointer hover:text-white transition-colors flex items-center"
                    role="button"
                    aria-label="View user details"
                  >
                    <UserIcon className="h-5 w-5 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="break-words">User: {alert.user.name || alert.user.email}</span>
                  </div>
                )}
              </div>
            </div>

            {alert.chat && (
              <div className="bg-[#232335] rounded-lg p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Related Chat</h2>
                <div
                  onClick={handleChatClick}
                  className="flex items-center justify-between p-4 bg-[#2d1657] rounded-lg cursor-pointer hover:bg-[#3d1f77] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ChatBubbleLeftIcon className="h-6 w-6 text-[#00a0cb] flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium break-words">Chat #{alert.chat.id}</p>
                      <p className="text-gray-400 text-sm">
                        {alert.chat.messageCount || alert.chat.messages?.length || 0} messages
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            )}

            {/* Triggering Content Section */}
            {alert.metadata?.content && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white mb-2">Triggering Content</h3>
                <div className="bg-[#2a3749] rounded-lg p-4">
                  <div className="p-3 rounded-lg bg-[#1e293b] border-2 border-red-500/20">
                    <div className="flex items-center text-sm text-red-400 mb-1">
                      <ShieldExclamationIcon className="h-4 w-4 mr-1" />
                      <span>Flagged Content</span>
                    </div>
                    <div className="text-gray-300">{alert.metadata.content}</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
} 