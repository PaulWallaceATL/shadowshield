'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import { MotionSelect } from '@/components/ui/MotionSelect';

const getProviderColors = (provider: string) => {
  switch (provider) {
    case 'ANTHROPIC':
      return 'bg-purple-900/20 text-black border border-purple-900/30';
    case 'GOOGLE':
      return 'bg-blue-900/20 text-blue-400 border border-blue-900/30';
    case 'OPENAI':
      return 'bg-green-900/20 text-green-400 border border-green-900/30';
    default:
      return 'bg-gray-800 text-gray-300';
  }
};

type Chat = {
  id: string;
  title: string;
  provider: string;
  model: string;
  createdAt: string;
  messageCount: number;
  user: {
    name: string | null;
    email: string;
  };
  messages?: Array<{
    role: string;
    provider?: string;
  }>;
};

// ChatTable component to handle just the table content for desktop view
const ChatTable = ({ 
  chats, 
  isLoading 
}: { 
  chats: Chat[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <motion.tr>
        <td colSpan={5} className="px-6 py-12 text-center">
          <motion.div 
            className="h-8 w-8 border-4 border-[#00a0cb] rounded-full mx-auto"
            animate={{ 
              rotate: 360,
              borderTopColor: "transparent",
              borderRightColor: "rgba(0, 160, 203, 0.3)",
              borderBottomColor: "rgba(0, 160, 203, 0.6)"
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </td>
      </motion.tr>
    );
  }

  if (chats.length === 0) {
    return (
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <td colSpan={5} className="px-6 py-12 text-center">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-500" />
          <p className="mt-2 text-sm text-gray-400">No chats found matching your criteria.</p>
        </td>
      </motion.tr>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {chats.map((chat) => (
        <motion.tr
          key={chat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="hover:bg-gray-800/50 cursor-pointer group"
          onClick={() => window.location.href = `/admin/chats/${chat.id}`}
        >
          <td className="px-6 py-4">
            <span className="text-white group-hover:text-[#00a0cb]">
              {chat.title || 'Untitled Chat'}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-gray-300">{chat.user.name || chat.user.email}</span>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex flex-wrap gap-1">
              {(() => {
                // Extract unique provider/model combinations
                const providerModels = new Set<string>();
                
                // Add chat's default provider/model
                providerModels.add(`${chat.provider}/${chat.model}`);
                
                // Get unique provider/model combinations from messages if available
                if (chat.messages) {
                  chat.messages
                    .filter(m => m.provider && m.role === 'assistant')
                    .forEach(m => {
                      if (m.provider) {
                        providerModels.add(`${m.provider}/${chat.model}`);
                      }
                    });
                }
                
                // Convert to array and render
                return Array.from(providerModels).map((providerModel, index) => {
                  const [provider, model] = providerModel.split('/');
                  return (
                    <span 
                      key={index} 
                      className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:shadow-md transition-all ${getProviderColors(provider)} hover:opacity-90`}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering parent onClick
                        const providerLower = provider.toLowerCase();
                        window.location.href = `/admin/api-management/${providerLower}`;
                      }}
                      role="link"
                      aria-label={`Navigate to ${provider} API management`}
                    >
                      {provider} / {model}
                    </span>
                  );
                });
              })()}
            </div>
          </td>
          <td className="px-6 py-4">
            <span className="text-white">{chat.messageCount}</span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center text-gray-400">
              <ClockIcon className="h-4 w-4 mr-1" />
              {format(new Date(chat.createdAt), 'MMM d, yyyy HH:mm')}
            </div>
          </td>
        </motion.tr>
      ))}
    </AnimatePresence>
  );
};

// Mobile card view component
const ChatCardsMobile = ({
  chats,
  isLoading
}: {
  chats: Chat[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <motion.div 
          className="h-12 w-12 border-4 border-[#00a0cb] rounded-full"
          animate={{ 
            rotate: 360,
            borderTopColor: "transparent",
            borderRightColor: "rgba(0, 160, 203, 0.3)",
            borderBottomColor: "rgba(0, 160, 203, 0.6)"
          }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="py-12 text-center">
        <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-500" />
        <p className="mt-2 text-sm text-gray-400">No chats found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chats.map((chat) => (
        <motion.div
          key={chat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-[#151517] rounded-lg p-4 border border-gray-800 shadow-md hover:shadow-lg transition-all duration-200"
          onClick={() => window.location.href = `/admin/chats/${chat.id}`}
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-white font-medium">{chat.title || 'Untitled Chat'}</h3>
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {format(new Date(chat.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center mb-3">
            <UserIcon className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-300">{chat.user.name || chat.user.email}</span>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {(() => {
              const providerModels = new Set<string>();
              providerModels.add(`${chat.provider}/${chat.model}`);
              
              if (chat.messages) {
                chat.messages
                  .filter(m => m.provider && m.role === 'assistant')
                  .forEach(m => {
                    if (m.provider) {
                      providerModels.add(`${m.provider}/${chat.model}`);
                    }
                  });
              }
              
              return Array.from(providerModels).map((providerModel, index) => {
                const [provider, model] = providerModel.split('/');
                return (
                  <span 
                    key={index} 
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getProviderColors(provider)}`}
                  >
                    {provider} / {model}
                  </span>
                );
              });
            })()}
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-800">
            <div className="flex items-center text-gray-400 text-sm">
              <ClockIcon className="h-4 w-4 mr-1" />
              {format(new Date(chat.createdAt), 'HH:mm')}
            </div>
            <div className="text-sm text-gray-300">
              {chat.messageCount} messages
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default function AllChatsPage() {
  const { data: session, status } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    provider: '',
    model: '',
    dateRange: 'all',
  });

  const fetchChats = useCallback(async () => {
    try {
      if (status !== 'authenticated') {
        setError('Not authenticated');
        return;
      }

      setIsLoading(true);
      setError('');
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        provider: filter.provider,
        model: filter.model,
        dateRange: filter.dateRange,
      });

      const response = await fetch(`/api/admin/chats?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch chats');
      }

      const data = await response.json();
      setChats(data.chats || []);
      setTotalPages(Math.ceil(data.total / 8));
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, filter, status]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  useEffect(() => {
    if (status === 'authenticated') {
      fetchChats();
    }
  }, [fetchChats, status]);

  if (status === 'loading') {
    return (
      <motion.div 
        className="flex justify-center items-center min-h-[400px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div 
          className="h-16 w-16 border-4 border-[#00a0cb] rounded-full"
          animate={{ 
            rotate: 360,
            borderTopColor: "transparent",
            borderRightColor: "rgba(0, 160, 203, 0.3)",
            borderBottomColor: "rgba(0, 160, 203, 0.6)"
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
    <div className="min-h-full">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-3">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-[#00a0cb]" />
              <h1 className="text-2xl font-semibold text-white">All Chats</h1>
            </div>
            <p className="mt-1 text-sm text-gray-300">
              View and manage all chat conversations across users
            </p>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 flex items-start mb-4"
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

        <div className="bg-[#151517] shadow-lg rounded-lg p-4 sm:p-6 border border-gray-800">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search chats by title, user, or content..."
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-[#00a0cb] focus:border-[#00a0cb] text-white placeholder-gray-400"
                  style={{ color: 'white' }}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="w-full sm:w-48">
                <MotionSelect
                  options={[
                    { value: '', label: 'All Providers' },
                    { value: 'ANTHROPIC', label: 'Anthropic' },
                    { value: 'OPENAI', label: 'OpenAI' },
                    { value: 'GOOGLE', label: 'Google' }
                  ]}
                  value={filter.provider}
                  onChange={(value) => setFilter({ ...filter, provider: value })}
                  className="w-full"
                />
              </div>
              <div className="w-full sm:w-48">
                <MotionSelect
                  options={[
                    { value: '', label: 'All Models' },
                    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
                    { value: 'gpt-4', label: 'GPT-4' },
                    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
                    { value: 'gemini-2.0-pro', label: 'Gemini 2.0 Pro' }
                  ]}
                  value={filter.model}
                  onChange={(value) => setFilter({ ...filter, model: value })}
                  className="w-full"
                />
              </div>
              <div className="w-full sm:w-48">
                <MotionSelect
                  options={[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'yesterday', label: 'Yesterday' },
                    { value: 'week', label: 'Last 7 Days' },
                    { value: 'month', label: 'Last 30 Days' },
                    { value: 'quarter', label: 'Last 90 Days' }
                  ]}
                  value={filter.dateRange}
                  onChange={(value) => setFilter({ ...filter, dateRange: value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Mobile Card View (visible on small screens) */}
          <div className="md:hidden">
            <ChatCardsMobile chats={chats} isLoading={isLoading} />
          </div>

          {/* Desktop Table View (hidden on small screens) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Chat</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Provider/Model</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Messages</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-[#151517] divide-y divide-gray-700">
                <ChatTable chats={chats} isLoading={isLoading} />
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-5 mt-4 border-t border-gray-700">
              <div className="flex justify-between w-full md:hidden">
                <motion.button
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-[#00a0cb] text-white hover:bg-[#0090b7]'}`}
                  whileHover={currentPage !== 1 ? { scale: 1.02 } : {}}
                  whileTap={currentPage !== 1 ? { scale: 0.98 } : {}}
                >
                  Previous
                </motion.button>
                <motion.button
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md text-sm ${currentPage === totalPages ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-[#00a0cb] text-white hover:bg-[#0090b7]'}`}
                  whileHover={currentPage !== totalPages ? { scale: 1.02 } : {}}
                  whileTap={currentPage !== totalPages ? { scale: 0.98 } : {}}
                >
                  Next
                </motion.button>
              </div>
              <div className="hidden md:flex items-center justify-between w-full">
                <div>
                  <p className="text-sm text-gray-400">
                    Showing page <span className="font-medium text-white">{currentPage}</span> of{' '}
                    <span className="font-medium text-white">{totalPages}</span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <motion.button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${currentPage === 1 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                    whileHover={currentPage !== 1 ? { scale: 1.1 } : {}}
                    whileTap={currentPage !== 1 ? { scale: 0.9 } : {}}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${currentPage === totalPages ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                    whileHover={currentPage !== totalPages ? { scale: 1.1 } : {}}
                    whileTap={currentPage !== totalPages ? { scale: 0.9 } : {}}
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 