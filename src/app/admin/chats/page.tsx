'use client';

import { useState, useEffect } from 'react';
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
  UserIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';

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
};

export default function AllChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    provider: '',
    model: '',
  });

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      setError('');
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        provider: filter.provider,
        model: filter.model,
      });

      const response = await fetch(`/api/admin/chats?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      setChats(data.chats);
      setTotalPages(Math.ceil(data.total / 15));
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [currentPage, searchTerm, filter]);

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
    <div className="p-6 space-y-6">
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <ChatBubbleLeftRightIcon className="h-8 w-8 mr-2 text-[#190b37]" />
            All Chats
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all chat conversations across users
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats by title, user, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#190b37] focus:border-[#190b37]"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filter.provider}
              onChange={(e) => setFilter({ ...filter, provider: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#190b37] focus:border-[#190b37]"
            >
              <option value="">All Providers</option>
              <option value="ANTHROPIC">Anthropic</option>
              <option value="OPENAI">OpenAI</option>
              <option value="GOOGLE">Google</option>
            </select>
            <select
              value={filter.model}
              onChange={(e) => setFilter({ ...filter, model: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-[#190b37] focus:border-[#190b37]"
            >
              <option value="">All Models</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-2.0-pro">Gemini 2.0 Pro</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chat</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider/Model</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {chats.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No chats found matching your criteria.</p>
                    </td>
                  </motion.tr>
                ) : (
                  chats.map((chat) => (
                    <motion.tr
                      key={chat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <Link href={`/admin/chats/${chat.id}`} className="text-[#190b37] hover:text-[#2d1657]">
                          {chat.title || 'Untitled Chat'}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span>{chat.user.name || chat.user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          {chat.provider} / {chat.model}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{chat.messageCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {format(new Date(chat.createdAt), 'MMM d, yyyy HH:mm')}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 