'use client';

import { notFound } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { use } from 'react';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClipboardDocumentIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

// Add provider colors for branding
const providerColors: Record<string, { bg: string, border: string, text: string, shadow: string }> = {
  'ANTHROPIC': {
    bg: 'bg-[#EBDBBC]',
    border: 'border-l-0',
    text: 'text-black',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  'OPENAI': {
    bg: 'bg-[#FFFFFF]',
    border: 'border-l-0',
    text: 'text-black',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  'GOOGLE': {
    bg: 'bg-[#1E1E1E]',
    border: 'border-l-0',
    text: 'text-white',
    shadow: 'rgba(0, 0, 0, 0.1)'
  }
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  flagged?: boolean;
  flagReason?: string;
  provider?: string;
  model?: string;
};

type ChatWithDetails = {
  id: string;
  title: string;
  provider: string;
  model: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

const MESSAGES_PER_PAGE = 10;

export default function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const [chat, setChat] = useState<ChatWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // New state variables for enhanced functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'assistant'>('all');
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [displayedMessages, setDisplayedMessages] = useState<number>(MESSAGES_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Component mounting effect
  useEffect(() => {
    const fetchChatDetails = async () => {
      try {
        const response = await fetch(`/api/admin/chats/${resolvedParams.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch chat details');
        }
        const data = await response.json();
        
        // Sort messages by createdAt date (newest first)
        if (data && data.messages) {
          data.messages.sort((a: Message, b: Message) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        
        setChat(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching chat details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatDetails();
  }, [resolvedParams.id]);

  // Initialize with default page of most recent messages
  useEffect(() => {
    if (chat && chat.messages && chat.messages.length > 0) {
      setDisplayedMessages(Math.min(MESSAGES_PER_PAGE, chat.messages.length));
    }
  }, [chat]);

  // Filter messages based on search term and role
  const filteredMessages = chat?.messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || message.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  // Get current page of messages (already sorted newest first from the API call)
  const currentMessages = filteredMessages.slice(0, displayedMessages);

  // Handle infinite scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current || isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (scrolledToBottom && displayedMessages < filteredMessages.length) {
      loadMoreMessages();
    }
  };

  const loadMoreMessages = () => {
    if (isLoadingMore || !chat || displayedMessages >= filteredMessages.length) return;
    
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedMessages(prev => Math.min(prev + MESSAGES_PER_PAGE, filteredMessages.length));
      setIsLoadingMore(false);
    }, 300); // Reduced loading delay for better UX
  };

  // Copy message content to clipboard
  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(index);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (!session?.user || !['ADMIN', 'SECURITY_OFFICER'].includes(session.user.role as string)) {
    notFound();
  }

  if (isLoading) {
    return (
      <motion.div 
        className="flex justify-center items-center min-h-screen"
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

  if (error || !chat) {
    return (
      <motion.div 
        className="flex justify-center items-center min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error || 'Chat not found'}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            <motion.button
              onClick={() => router.back()}
              className="flex items-center text-[#190b37] hover:text-[#2d1657] transition-colors"
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Back</span>
            </motion.button>
          </div>
        </div>
      </div>

      <motion.div 
        className="container mx-auto px-4 py-6 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Chat Details Card */}
        <motion.div 
          className="bg-white shadow-lg rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#190b37] bg-opacity-10 rounded-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-[#190b37]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {chat.title || 'Untitled Chat'}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Chat details and message history
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <motion.div 
              onClick={() => router.push(`/admin/users/${chat.user.id}`)}
              className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              role="button"
              aria-label="View user details"
            >
              <UserIcon className="h-6 w-6 text-[#190b37]" />
              <div>
                <div className="text-sm font-medium text-gray-500">User</div>
                <div className="text-base text-gray-900">{chat.user.name || chat.user.email}</div>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <CubeIcon className="h-6 w-6 text-[#190b37]" />
              <div>
                <div className="text-sm font-medium text-gray-500">Provider(s) / Model(s)</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(() => {
                    // Extract unique provider/model combinations
                    const providerModels = new Set<string>();
                    
                    // Add chat's default provider/model
                    providerModels.add(`${chat.provider}/${chat.model}`);
                    
                    // Get unique provider/model combinations from messages
                    chat.messages
                      .filter(m => m.provider && m.role === 'assistant')
                      .forEach(m => {
                        // If the message has a provider and model, add it
                        if (m.provider) {
                          // Use message's model if available, otherwise fall back to chat.model
                          const model = m.model || chat.model;
                          providerModels.add(`${m.provider}/${model}`);
                        }
                      });
                    
                    // Convert to array and render
                    return Array.from(providerModels).map((providerModel, index) => {
                      // Use type assertion to handle the unknown type
                      const pmString = providerModel as string;
                      const [provider, model] = pmString.split('/');
                      return (
                        <span 
                          key={index} 
                          className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:shadow-md transition-all ${
                            provider === 'ANTHROPIC' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                            provider === 'GOOGLE' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                            provider === 'OPENAI' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                            'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering parent onClick
                            const providerLower = provider.toLowerCase();
                            router.push(`/admin/api-management/${providerLower}`);
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
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <CalendarIcon className="h-6 w-6 text-[#190b37]" />
              <div>
                <div className="text-sm font-medium text-gray-500">Created</div>
                <div className="text-base text-gray-900">{format(new Date(chat.createdAt), 'PPpp')}</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Chat Messages */}
        <motion.div 
          className="bg-white shadow-lg rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#190b37] bg-opacity-10 rounded-lg">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-[#190b37]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Showing {displayedMessages} of {filteredMessages.length} messages (newest first)
                    </p>
                  </div>
                </div>
                
                <motion.button
                  onClick={() => {
                    const chatText = filteredMessages.map(m => 
                      `${m.role.toUpperCase()} (${format(new Date(m.createdAt), 'PPpp')}): ${m.content}`
                    ).join('\n\n');
                    copyToClipboard(chatText || '', -1);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#190b37] text-white hover:bg-[#2d1657] rounded-lg transition-colors shadow-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <DocumentDuplicateIcon className="h-5 w-5" />
                  <span className="font-medium">Copy All</span>
                </motion.button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#190b37] focus:border-transparent"
                  />
                </div>
                
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | 'user' | 'assistant')}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#190b37] focus:border-transparent"
                >
                  <option value="all">All Messages</option>
                  <option value="user">User Messages</option>
                  <option value="assistant">AI Messages</option>
                </select>
              </div>
            </div>
          </div>

          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`overflow-y-auto p-6 bg-white transition-all duration-300 ease-in-out ${
              isExpanded ? 'h-[800px]' : 'h-[600px]'
            }`}
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex flex-col space-y-4">
              {isLoadingMore && (
                <motion.div 
                  className="flex justify-center py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div 
                    className="h-8 w-8 border-4 border-[#190b37] rounded-full"
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
              )}
              <AnimatePresence>
                {currentMessages.map((message: Message, index: number) => {
                  const messageDate = new Date(message.createdAt);
                  const messageProvider = message.provider || chat.provider || 'ANTHROPIC';
                  return (
                    <motion.div
                      key={index}
                      className={`p-5 rounded-xl shadow-md mb-4 ${
                        message.role === 'assistant'
                          ? `${providerColors[messageProvider].bg} text-black` 
                          : 'bg-gradient-to-r from-[#190b37] to-[#2d1657] text-white'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{ 
                        boxShadow: message.role === 'assistant' 
                          ? `0 4px 6px ${providerColors[messageProvider].shadow}` 
                          : '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full 
                            ${message.role === 'assistant' 
                              ? 'bg-[#190b37] text-white' 
                              : 'bg-white/20 text-white'
                            }`}
                          >
                            {message.role === 'assistant' ? 'AI Assistant' : 'User'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${
                            message.role === 'assistant' 
                              ? (messageProvider === 'GOOGLE' ? 'text-gray-300' : 'text-gray-500') 
                              : 'text-white/70'
                          }`}>
                            {format(messageDate, 'PPpp')}
                          </span>
                          {message.role === 'assistant' && (
                            <>
                              {messageProvider === 'ANTHROPIC' && (
                                <img src="/claude.svg" alt="Claude" className="h-8 w-8" />
                              )}
                              {messageProvider === 'GOOGLE' && (
                                <img src="/gemini.svg" alt="Gemini" className="h-8 w-8" />
                              )}
                              {messageProvider === 'OPENAI' && (
                                <img src="/openai.svg" alt="OpenAI" className="h-8 w-8" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      {message.flagged && (
                        <motion.div 
                          className="mt-3 text-sm bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg flex items-center"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                          {message.flagReason}
                        </motion.div>
                      )}
                      <motion.button
                        onClick={() => copyToClipboard(message.content, index)}
                        className={`p-2 rounded-full transition-colors ${
                          message.role === 'assistant' 
                            ? (messageProvider === 'GOOGLE' ? 'hover:bg-white/20' : 'hover:bg-[#190b37]/10')
                            : 'hover:bg-white/20'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {copiedMessageId === index ? (
                          <ClipboardDocumentIcon className={`h-4 w-4 ${
                            message.role === 'assistant' 
                              ? (messageProvider === 'GOOGLE' ? 'text-white' : 'text-[#190b37]') 
                              : 'text-white'
                          }`} />
                        ) : (
                          <DocumentDuplicateIcon className={`h-4 w-4 ${
                            message.role === 'assistant' 
                              ? (messageProvider === 'GOOGLE' ? 'text-white' : 'text-[#190b37]') 
                              : 'text-white'
                          }`} />
                        )}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filteredMessages.length > displayedMessages && (
                <motion.div 
                  className="text-center py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-sm text-gray-500">Scroll down to load more messages</p>
                  <ChevronDownIcon className="h-5 w-5 mx-auto mt-2 text-gray-500 animate-bounce" />
                </motion.div>
              )}
              {filteredMessages.length === 0 && (
                <motion.div 
                  className="text-center py-12 text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No messages found matching your criteria</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Add expand/collapse button */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-200"
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="h-5 w-5 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-5 w-5 mr-1" />
                Show More
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
} 