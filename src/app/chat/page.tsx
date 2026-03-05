'use client';

import { useState, useContext, createContext, useEffect, useRef, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { 
  PaperAirplaneIcon, 
  ArrowDownCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  PlusIcon,
  CubeIcon,
  BeakerIcon,
  CpuChipIcon,
  ChartBarIcon,
  UserGroupIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  UserIcon
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '@/components/ui/Tooltip';
import { MotionSelect } from '@/components/ui/MotionSelect';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import CustomPopup from '@/components/ui/CustomPopup';
import { TemperatureSlider } from '@/components/ui/TemperatureSlider';
import { useMediaQuery } from '@/hooks/useMediaQuery';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  flagged?: boolean;
  flagReason?: string;
  status?: 'sending' | 'sent' | 'error';
  provider?: Provider;
};

type Chat = {
  id: string;
  title: string;
  provider: Provider;
  model: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

type Provider = 'ANTHROPIC' | 'OPENAI' | 'GOOGLE';

// Create a context for filter settings
export type FilterContext = {
  provider: Provider;
  setProvider: (provider: Provider | string) => void;
  model: string;
  setModel: (model: string) => void;
  temperature?: number;
  setTemperature?: (temperature: number) => void;
};

export const FilterContext = createContext<FilterContext>({
  provider: 'ANTHROPIC',
  setProvider: () => {},
  model: 'claude-3-sonnet-20240229',
  setModel: () => {},
});

type ModelOption = {
  value: string;
  label: string;
};

// Helper function to format timestamps
const formatTime = (timestamp: Date | string) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Helper function to determine appropriate text color based on background brightness
const getContrastingTextColor = (bgColorHex: string): string => {
  // For named colors or Tailwind colors with opacity, default to black text
  if (!bgColorHex.startsWith('#')) {
    return 'text-black';
  }
  
  // Remove the # if present
  const hex = bgColorHex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate perceived brightness using the formula: (0.299*R + 0.587*G + 0.114*B)
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light backgrounds, white for dark backgrounds
  return brightness > 0.6 ? 'text-black' : 'text-white';
};

const providerColors: Record<Provider, {
  bg: string;
  text: string;
  border: string;
  shadow: string;
}> = {
  ANTHROPIC: {
    bg: 'bg-[#EBDBBC]',
    text: 'text-black',
    border: 'border-[#EBDBBC]',
    shadow: 'shadow-[#EBDBBC]'
  },
  GOOGLE: {
    bg: 'bg-[#EBDBBC]',
    text: 'text-black',
    border: 'border-[#EBDBBC]',
    shadow: 'shadow-[#EBDBBC]'
  },
  OPENAI: {
    bg: 'bg-[#FFFFFF]',
    text: 'text-black',
    border: 'border-gray-200',
    shadow: 'shadow-gray-200'
  }
};

const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2 }
  }
};

const loadingVariants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "easeInOut"
    }
  }
};

// Add model name mapping
const modelNameMapping = {
  'gemini-pro': 'gemini-pro',
  'gemini-pro-vision': 'gemini-pro-vision'
};

// Custom model map
const modelMap: Record<string, string> = {
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
  'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
  'claude-3-haiku-20240307': 'claude-3-haiku-20240307',
  'gemini-2.0-flash': 'gemini-2.0-flash',
  'gemini-1.5-pro': 'gemini-1.5-pro'
};

const modelOptions: Record<Provider, ModelOption[]> = {
  OPENAI: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ],
  ANTHROPIC: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
  ],
  GOOGLE: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ]
};

const samplePrompts = [
  {
    category: "Marketing & Communications",
    icon: SparklesIcon,
    prompts: [
      {
        text: "Create a content calendar for our social media channels",
        subCategory: "Content Strategy"
      },
      {
        text: "Write a press release for our latest product launch",
        subCategory: "PR"
      },
      {
        text: "Analyze our competitor's marketing strategy",
        subCategory: "Market Analysis"
      }
    ]
  },
  {
    category: "Finance & Operations",
    icon: ChartBarIcon,
    prompts: [
      {
        text: "Create a financial forecast model",
        subCategory: "Financial Planning"
      },
      {
        text: "Optimize our supply chain process",
        subCategory: "Operations"
      },
      {
        text: "Generate a risk assessment report",
        subCategory: "Risk Management"
      }
    ]
  },
  {
    category: "Sales & Business Development",
    icon: ChatBubbleLeftRightIcon,
    prompts: [
      {
        text: "Draft a compelling sales pitch",
        subCategory: "Sales"
      },
      {
        text: "Create a client onboarding checklist",
        subCategory: "Client Relations"
      },
      {
        text: "Develop partnership proposal templates",
        subCategory: "Business Development"
      }
    ]
  },
  {
    category: "Project Management",
    icon: ClockIcon,
    prompts: [
      {
        text: "Create a project timeline and milestones",
        subCategory: "Planning"
      },
      {
        text: "Generate a resource allocation plan",
        subCategory: "Resource Management"
      },
      {
        text: "Write a project status report template",
        subCategory: "Reporting"
      }
    ]
  },
  {
    category: "HR & People Operations",
    icon: UserGroupIcon,
    prompts: [
      {
        text: "Create an employee onboarding guide",
        subCategory: "Onboarding"
      },
      {
        text: "Develop performance review templates",
        subCategory: "Performance Management"
      },
      {
        text: "Write job descriptions for open positions",
        subCategory: "Recruitment"
      }
    ]
  }
];

const ChatPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentChatRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Check for mobile view
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Access filter context
  const filterContext = useContext(FilterContext);
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasUnsavedChat, setHasUnsavedChat] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousChatId = useRef<string | null>(null);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isNewChatDisabled, setIsNewChatDisabled] = useState(false);

  // Check user status
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await fetch('/api/users/me');
        const data = await response.json();
        
        if (!data.isActive) {
          setIsDeactivated(true);
        }
        
        if (data.mustChangePassword) {
          setPopupMessage('Your password has been found in a data breach. For your security, please change your password immediately.');
          setShowPasswordPopup(true);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    checkUserStatus();
  }, []);

  // Scroll to bottom functionality
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    };

    messagesContainerRef.current?.addEventListener('scroll', handleScroll);
    return () => messagesContainerRef.current?.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Update the URL effect handler
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatId = params.get('chatId');
    const urlProvider = params.get('provider') as Provider;
    const urlModel = params.get('model');
    
    // Update provider and model if present in URL
    if (urlProvider && urlModel) {
      filterContext.setProvider(urlProvider);
      // Map old model names to new ones if necessary
      const mappedModel = urlProvider === 'GOOGLE' ? 
        modelNameMapping[urlModel as keyof typeof modelNameMapping] || urlModel : 
        urlModel;
      filterContext.setModel(mappedModel);
      
      // Update URL if we mapped to a new model name
      if (mappedModel !== urlModel) {
        const params = new URLSearchParams(window.location.search);
        params.set('model', mappedModel);
        router.replace(`${window.location.pathname}?${params.toString()}`, {
          scroll: false
        });
      }
    }
    
    // Update selectedChatId based on URL
    setSelectedChatId(chatId);
    
    // If no chatId in URL, reset states
    if (!chatId) {
      setChat(null);
      setMessages([]);
      setIsChatLoading(false);
      return;
    }
    
    // Load chat data if chatId is present
    const loadChat = async () => {
      setIsChatLoading(true);
      try {
        const response = await fetch(`/api/chats/${chatId}`);
        if (!response.ok) throw new Error('Failed to fetch chat');
        const data = await response.json();
        
        // Update messages with proper timestamps
        const messagesWithDates = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp || msg.createdAt || Date.now()),
          provider: msg.provider || data.provider
        }));
        
        // Update all states with fetched data
        setChat(data);
        setMessages(messagesWithDates);
        filterContext.setProvider(data.provider);
        filterContext.setModel(data.model);
        setSelectedChatId(chatId);
      } catch (error) {
        console.error('Error fetching chat:', error);
        setError('Failed to load chat');
      } finally {
        setIsChatLoading(false);
      }
    };

    loadChat();
  }, [pathname]);

  // Add fetchChats function
  useEffect(() => {
    const fetchChats = async () => {
      try {
        // First get regular chats (with messages)
        const response = await fetch('/api/chats');
        if (response.ok) {
          const data = await response.json();
          
          // Create a Map for deduplication, ensuring no duplicates by ID
          const uniqueChats = new Map();
          data.forEach((chat: Chat) => {
            if (!uniqueChats.has(chat.id)) {
              uniqueChats.set(chat.id, chat);
            }
          });
          
          // Convert Map to array and update state
          const uniqueChatsArray = Array.from(uniqueChats.values());
          setChats(uniqueChatsArray);
          
          // Then also fetch all chats including empty ones for tracking
          const allChatsResponse = await fetch('/api/chats?includeEmpty=true');
          if (allChatsResponse.ok) {
            const allChatsData = await allChatsResponse.json();
            
            // Create another Map for all chats deduplication
            const allUniqueChats = new Map();
            allChatsData.forEach((c: Chat) => {
              if (!allUniqueChats.has(c.id)) {
                allUniqueChats.set(c.id, c);
              }
            });
            
            // Convert to array
            const allChats = Array.from(allUniqueChats.values());
            
            // Handle unsaved chat state
            if (selectedChatId) {
              const currentChat = allChats.find((c: Chat) => c.id === selectedChatId);
              if (currentChat && (!currentChat.messages || 
                                 (Array.isArray(currentChat.messages) && currentChat.messages.length === 0) || 
                                 (typeof currentChat.messages === 'boolean' && currentChat.messages === true))) {
                setHasUnsavedChat(true);
              } else {
                setHasUnsavedChat(false);
              }
            }
            
            // Check for any empty chats
            const hasEmptyChat = allChats.some((chat: Chat) => 
              (!chat.messages || 
               (Array.isArray(chat.messages) && chat.messages.length === 0) || 
               (typeof chat.messages === 'boolean' && chat.messages === true))
            );
            
            // Set unsaved state if we're not viewing a chat but have empty ones
            if (hasEmptyChat && !selectedChatId) {
              setHasUnsavedChat(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };
    fetchChats();
  }, [selectedChatId]);

  // Helper function to create a new chat with a specific provider and model
  const createNewChatWithProvider = async (providerType: Provider, modelName: string) => {
    // Prevent multiple clicks
    if (isNewChatDisabled) return;
    setIsNewChatDisabled(true);
    
    // If there's an unsaved chat, show error and don't proceed
    if (hasUnsavedChat) {
      setError("Please send a message in your current chat before creating a new one.");
      setTimeout(() => setError(null), 3000);
      setIsNewChatDisabled(false);
      return;
    }
    
    setIsChatLoading(true);
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: new Date().toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: 'numeric',
            hour12: true 
          }),
          provider: providerType,
          model: modelName,
        }),
      });

      if (response.ok) {
        const newChat = await response.json();
        console.log("Created new chat with provider:", providerType);
        
        // Update the chat and clear messages
        setChat(newChat);
        setMessages([]);
        filterContext.setProvider(providerType);
        filterContext.setModel(modelName);
        
        // Set the selected chat ID before navigation
        setSelectedChatId(newChat.id);
        
        // Mark that we have an unsaved chat
        setHasUnsavedChat(true);
        
        // Update URL with new chat parameters
        const params = new URLSearchParams();
        params.set('chatId', newChat.id);
        params.set('provider', providerType);
        params.set('model', modelName);
        
        // Use router.replace to update URL without adding to history
        router.replace(`/chat?${params.toString()}`);
        
        // Refresh chats list to ensure we have the latest data
        setTimeout(async () => {
          try {
            const refreshResponse = await fetch('/api/chats?includeEmpty=true');
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              
              // Deduplicate chats and update state
              const uniqueRefreshedChats = new Map();
              refreshData.forEach((c: Chat) => uniqueRefreshedChats.set(c.id, c));
              setChats(Array.from(uniqueRefreshedChats.values()));
            }
          } catch (error) {
            console.error('Error refreshing chats list:', error);
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      setError("Failed to create new chat. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsChatLoading(false);
      // Re-enable the button after a short delay
      setTimeout(() => setIsNewChatDisabled(false), 1000);
    }
  };

  // Update handleNewChat to set selectedChatId
  const handleNewChat = async () => {
    // Debounce protection
    if (isNewChatDisabled) return;
    setIsNewChatDisabled(true);
    
    // Prevent creating multiple new chats without messages
    if (hasUnsavedChat) {
      // Show visual feedback to the user that they need to send a message first
      setError("Please send a message in your current chat before creating a new one.");
      setTimeout(() => setError(null), 3000); // Clear the error after 3 seconds
      setIsNewChatDisabled(false); // Re-enable button
      
      try {
        // Get all chats including empty ones
        const allChatsResponse = await fetch('/api/chats?includeEmpty=true');
        if (allChatsResponse.ok) {
          const allChatsData = await allChatsResponse.json();
          
          // Create a Map to deduplicate chats by ID
          const uniqueChats = new Map();
          allChatsData.forEach((c: Chat) => {
            uniqueChats.set(c.id, c);
          });
          
          // Convert back to array for processing
          const dedupedChats = Array.from(uniqueChats.values());
          
          // Find empty chats - be very explicit about what counts as "empty"
          const emptyChats = dedupedChats.filter((c: Chat) => 
            !c.messages || 
            (Array.isArray(c.messages) && c.messages.length === 0) || 
            (typeof c.messages === 'boolean' && c.messages === true) ||
            (typeof c.messages === 'object' && Object.keys(c.messages).length === 0)
          );
          
          // If we have empty chats and we're not already viewing one, navigate to the most recent
          if (emptyChats.length > 0) {
            // Sort to get the most recently updated empty chat
            const sortedEmptyChats = emptyChats.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            
            const emptyChat = sortedEmptyChats[0];
            
            // Only navigate if we're not already on this empty chat
            if (emptyChat.id !== selectedChatId) {
              router.replace(`/chat?chatId=${emptyChat.id}&provider=${emptyChat.provider}&model=${emptyChat.model}`);
              filterContext.setProvider(emptyChat.provider as Provider);
              filterContext.setModel(emptyChat.model);
              setSelectedChatId(emptyChat.id);
              setHasUnsavedChat(true);
              setChat(emptyChat);
              setMessages([]);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking for empty chats:', error);
      }
      
      // If we're here, we're either already on an empty chat or couldn't find one
      return;
    }
    
    setIsChatLoading(true);
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: new Date().toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: 'numeric',
            hour12: true 
          }),
          provider: filterContext.provider,
          model: filterContext.model,
        }),
      });

      if (response.ok) {
        const newChat = await response.json();
        console.log("Created/updated chat:", newChat);
        
        // Update the chat and clear messages
        setChat(newChat);
        setMessages([]);
        
        // Set the selected chat ID before navigation
        setSelectedChatId(newChat.id);
        
        // Mark that we have an unsaved chat
        setHasUnsavedChat(true);
        
        // Update URL with new chat parameters
        const params = new URLSearchParams();
        params.set('chatId', newChat.id);
        params.set('provider', filterContext.provider);
        params.set('model', filterContext.model);
        
        // Use router.replace to update URL without adding to history
        router.replace(`/chat?${params.toString()}`);
        
        // Refresh chats list to ensure we have the latest data
        setTimeout(async () => {
          try {
            const refreshResponse = await fetch('/api/chats?includeEmpty=true');
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              
              // Deduplicate chats and update state
              const uniqueRefreshedChats = new Map();
              refreshData.forEach((c: Chat) => uniqueRefreshedChats.set(c.id, c));
              setChats(Array.from(uniqueRefreshedChats.values()));
            }
          } catch (error) {
            console.error('Error refreshing chats list:', error);
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      setError("Failed to create new chat. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsChatLoading(false);
      // Re-enable the button after a short delay
      setTimeout(() => setIsNewChatDisabled(false), 1000);
    }
  };

  // Update handleChatSelect to set selectedChatId
  const handleChatSelect = async (selectedChat: Chat) => {
    setIsChatLoading(true);
    try {
      const response = await fetch(`/api/chats/${selectedChat.id}`);
      if (!response.ok) throw new Error('Failed to fetch chat');
      
      const data = await response.json();
      const messagesWithDates = data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp || msg.createdAt || Date.now()),
        provider: msg.provider || data.provider
      }));
      
      // Update all states before navigation
      setChat(data);
      setMessages(messagesWithDates);
      filterContext.setProvider(selectedChat.provider);
      filterContext.setModel(selectedChat.model);
      setSelectedChatId(selectedChat.id);
      
      // Update URL with selected chat parameters
      const params = new URLSearchParams();
      params.set('chatId', selectedChat.id);
      params.set('provider', selectedChat.provider);
      params.set('model', selectedChat.model);
      
      // Use router.replace to update URL without adding to history
      router.replace(`/chat?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching chat:', error);
      setError('Failed to load chat');
    } finally {
      setIsChatLoading(false);
    }
  };

  // If account is deactivated, show message
  if (isDeactivated) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 top-[80px] flex items-center justify-center"
      >
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center p-8 bg-white rounded-lg shadow-lg"
        >
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-4">Account Deactivated</h2>
          <p className="text-gray-600">Your account has been deactivated. Please contact an administrator for assistance.</p>
        </motion.div>
      </motion.div>
    );
  }

  // Show loading state while chat is being fetched
  if (isChatLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div 
          className="flex items-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut"
            }}
            className="flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-[#2f4faa] rounded-full" />
            <div className="w-2 h-2 bg-[#2f4faa] rounded-full" />
            <div className="w-2 h-2 bg-[#2f4faa] rounded-full" />
          </motion.div>
          <span className="text-gray-600">Loading chat...</span>
        </motion.div>
      </div>
    );
  }

  const updateChat = async (newMessages: Message[]) => {
    const searchParams = new URLSearchParams(window.location.search);
    const chatId = searchParams.get('chatId');
    if (!chatId) return;

    // Generate a title based on the first user message
    let title = '';
    if (hasUnsavedChat && newMessages.length > 0) {
      // Use the first user message to create a descriptive title
      const userMessage = newMessages.find(msg => msg.role === 'user');
      if (userMessage) {
        // Create a summarized title from the content
        let content = userMessage.content;
        
        // If content is long, truncate it to a reasonable title length
        if (content.length > 50) {
          // Get first sentence or first 50 chars
          const firstSentenceMatch = content.match(/^[^.!?]+[.!?]/);
          if (firstSentenceMatch && firstSentenceMatch[0].length < 100) {
            // Use first sentence if it's not too long
            content = firstSentenceMatch[0].trim();
          } else {
            // Otherwise use first 47 chars + ellipsis
            content = content.slice(0, 47) + '...';
          }
        }
        title = content;
      }
    }
    
    // If no title was generated, use default date-based title
    if (!title && newMessages.length > 0) {
      title = newMessages[0]?.content.slice(0, 30) + (newMessages[0]?.content.length > 30 ? '...' : '');
    }

    try {
      await fetch('/api/chats', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: chatId,
          messages: newMessages,
          title: title,
        }),
      });
      
      // After successfully saving a chat with messages, clear the unsaved flag
      if (hasUnsavedChat) {
        setHasUnsavedChat(false);
      }
    } catch (error) {
      console.error('Error updating chat:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const searchParams = new URLSearchParams(window.location.search);
    const chatId = searchParams.get('chatId');
    const currentProvider = searchParams.get('provider') as Provider || filterContext.provider;
    const currentModel = searchParams.get('model') || filterContext.model;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      status: 'sent',
      provider: currentProvider
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: userMessage.content,
          provider: currentProvider,
          model: currentModel,
          chatId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage: string;
        let flagReason: string;

        if (data.error === "Message blocked by DLP rule") {
          errorMessage = `Message blocked by DLP rule: ${data.ruleName} - ${data.reason}`;
          flagReason = `Rule: ${data.ruleName} - ${data.reason}`;
        } else {
          errorMessage = data.error || 'Failed to get response';
          flagReason = data.details || data.error || 'An error occurred';
        }

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
          flagged: response.status === 403,
          flagReason,
          status: 'error',
          provider: currentProvider
        }]);
        return;
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content || 'Sorry, no response was received.',
        timestamp: new Date(),
        flagged: data.flagged,
        flagReason: data.flagReason,
        status: 'sent',
        provider: currentProvider
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      
      if (chatId) {
        await updateChat(updatedMessages);
        
        // Clear the unsaved chat flag since we've now sent a message
        if (hasUnsavedChat) {
          setHasUnsavedChat(false);
          
          // Dispatch an event to notify that a message was sent
          window.dispatchEvent(new Event('messageSent'));
          
          // Wait a bit to ensure the chat is updated in the database
          setTimeout(async () => {
            // Update the chats list to include this chat (since it now has messages)
            try {
              const response = await fetch('/api/chats');
              if (response.ok) {
                const data = await response.json();
                
                // Create a Map for deduplication
                const uniqueChats = new Map();
                data.forEach((c: Chat) => {
                  if (!uniqueChats.has(c.id)) {
                    uniqueChats.set(c.id, c);
                  }
                });
                
                // Update state with deduplicated array of chats
                setChats(Array.from(uniqueChats.values()));
              }
            } catch (error) {
              console.error('Error fetching chats:', error);
            }
          }, 300);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      
      // Update to show error status
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
      ));
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date(),
        status: 'error',
        provider: currentProvider
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (value: string) => {
    console.log('ChatPage - handleProviderChange called with:', value);
    const newProvider = value as Provider;
    
    // Call the context setter
    if (filterContext.setProvider) {
      console.log('ChatPage - Updating provider in context to:', newProvider);
      filterContext.setProvider(newProvider);
    }
    
    // Don't need to manually update local state or URL as the context provider's
    // handleProviderChange will force a complete page refresh via window.location.href
  };

  const handleModelChange = (value: string) => {
    console.log('ChatPage - handleModelChange called with:', value);
    
    // Update local state if we have a chat
    if (chat) {
      setChat({
        ...chat,
        model: value
      });
    }
    
    // Update through context - context provider will handle URL updates
    filterContext.setModel(value);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Welcome/Chat Header */}
      <motion.div
        className="flex-shrink-0 p-4 md:p-6 bg-white border-b border-gray-200 shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-[1400px] mx-auto pl-16 md:pl-0">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-7 w-7 text-[#190b37] mr-3" />
            <h1 className="text-2xl md:text-3xl font-bold text-[#190b37] truncate">
              {chat ? (chat.title || 'New Chat') : 'Dashboard'}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {!chat && (
              <motion.button
                onClick={handleNewChat}
                className={`px-4 py-2 rounded-lg text-base ${
                  isNewChatDisabled
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-[#190b37] text-white hover:bg-[#2d1657]'
                } transition-colors flex items-center shadow-sm`}
                whileHover={{ scale: isNewChatDisabled ? 1 : 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: isNewChatDisabled ? 1 : 0.95 }}
                disabled={isNewChatDisabled}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Chat
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-gradient-to-b from-gray-50 to-white"
      >
        {/* Dashboard or Chat View */}
        {messages.length === 0 && !selectedChatId ? (
          <motion.div 
            className="w-full max-w-7xl mx-auto p-6 md:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Dashboard Header */}
            <div className="mb-12 text-center">
              <div className="flex justify-center mb-6">
                <img src="/SSdark.svg" alt="Shadow Shield" className="h-24 w-auto" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#190b37] mb-4">
                Welcome {session?.user?.name || 'User'}
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Start a new conversation by typing a message below or choose from one of the categories
              </p>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
              <motion.div 
                className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100"
                whileHover={{ y: -8, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              >
                <div className="flex items-center mb-4">
                  <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8 text-[#2f4faa]" />
                  <h3 className="ml-3 text-xl font-semibold text-black">Total Conversations</h3>
                </div>
                <p className="text-5xl font-bold text-[#190b37]">{chats.length}</p>
                <p className="text-base text-gray-500 mt-2">
                  {chats.length > 0 ? `Last updated ${formatTime(new Date(chats[0]?.updatedAt || new Date()))}` : 'No conversations yet'}
                </p>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100"
                whileHover={{ y: -8, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
              >
                <div className="flex items-center mb-4">
                  <ShieldCheckIcon className="h-8 w-8 text-green-500" />
                  <h3 className="ml-3 text-xl font-semibold text-black">Security Status</h3>
                </div>
                <p className="text-5xl font-bold text-green-500">Protected</p>
                <p className="text-base text-gray-500 mt-2">
                  Your conversations are secured by ShadowShield
                </p>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100"
                whileHover={{ y: -8, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
              >
                <div className="flex items-center mb-4">
                  <CpuChipIcon className="h-8 w-8 text-purple-500" />
                  <h3 className="ml-3 text-xl font-semibold text-black">Available Models</h3>
                </div>
                <p className="text-5xl font-bold text-[#190b37]">
                  {Object.values(modelOptions).flat().length}
                </p>
                <p className="text-base text-gray-500 mt-2">
                  AI models ready for your use
                </p>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="mb-14 bg-gradient-to-r from-[#190b37]/5 to-[#2f4faa]/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-[#190b37] mb-8 text-center">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <motion.button
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all flex flex-col items-center"
                  whileHover={{ y: -8, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.15)" }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
                  onClick={() => createNewChatWithProvider('ANTHROPIC', 'claude-3-sonnet-20240229')}
                >
                  <img src="/claude.svg" alt="Claude Icon" className="h-16 w-16 mb-4" />
                  <h4 className="font-semibold text-xl text-[#190b37] mb-2">Try Claude</h4>
                  <p className="text-sm text-gray-500">Start a new chat with Claude</p>
                </motion.button>
                
                <motion.button
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all flex flex-col items-center"
                  whileHover={{ y: -8, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.15)" }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                  onClick={() => createNewChatWithProvider('GOOGLE', 'gemini-1.5-pro')}
                >
                  <img src="/gemini.svg" alt="Gemini Icon" className="h-16 w-16 mb-4" />
                  <h4 className="font-semibold text-xl text-[#190b37] mb-2">Try Gemini</h4>
                  <p className="text-sm text-gray-500">Start a new chat with Gemini</p>
                </motion.button>
                
                <motion.button
                  className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all flex flex-col items-center"
                  whileHover={{ y: -8, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.15)" }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.6 } }}
                  onClick={() => createNewChatWithProvider('OPENAI', 'gpt-3.5-turbo')}
                >
                  <img src="/openai.svg" alt="OpenAI Icon" className="h-16 w-16 mb-4" />
                  <h4 className="font-semibold text-xl text-[#190b37] mb-2">Try GPT</h4>
                  <p className="text-sm text-gray-500">Start a new chat with GPT</p>
                </motion.button>
              </div>
            </div>
            
            {/* Recent Chats */}
            {chats.length > 0 && (
              <div className="bg-gradient-to-r from-[#2f4faa]/5 to-[#190b37]/5 p-8 rounded-3xl">
                <h3 className="text-2xl font-bold text-[#190b37] mb-8 text-center">
                  Recent Conversations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {chats.slice(0, 6).map((chat, index) => (
                    <motion.div
                      key={chat.id}
                      className="bg-white p-6 rounded-xl shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-all"
                      whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.15)" }}
                      onClick={() => handleChatSelect(chat)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        transition: { delay: 0.7 + index * 0.05 } 
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            chat.provider === 'ANTHROPIC' 
                              ? 'bg-purple-500' 
                              : chat.provider === 'GOOGLE'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                          }`} />
                          <h4 className="font-semibold text-base truncate max-w-[180px] text-black" title={chat.title}>
                            {chat.title || 'Untitled Chat'}
                          </h4>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatTime(new Date(chat.updatedAt))}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {chat.provider} • {chat.model.split('-').slice(0, 2).join(' ')}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6 max-w-5xl mx-auto">
            {messages.length === 0 && selectedChatId ? (
              <div className="flex flex-col items-center justify-center py-12">
                <img src="/SSdark.svg" alt="Shadow Shield" className="h-24 w-auto mb-6" />
                <h2 className="text-2xl md:text-3xl font-semibold text-[#190b37] mb-3">Start a new conversation</h2>
                <p className="text-lg text-gray-600 text-center max-w-lg mb-10">
                  Type a message below to begin chatting with your AI assistant
                </p>
                
                {/* Prompt Categories */}
                <div className="w-full max-w-5xl mx-auto mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {samplePrompts.map((category, index) => (
                      <motion.div
                        key={category.category}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md overflow-hidden border border-gray-100"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: 0.1 * index } 
                        }}
                        whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
                      >
                        <div className="p-5 bg-[#190b37]/5 border-b border-gray-100">
                          <div className="flex items-center">
                            <category.icon className="h-6 w-6 text-[#2f4faa] mr-3" />
                            <h3 className="font-semibold text-lg text-[#190b37]">{category.category}</h3>
                          </div>
                        </div>
                        <div className="p-4">
                          {category.prompts.map((prompt) => (
                            <button
                              key={prompt.text}
                              className="w-full text-left p-3 text-sm hover:bg-[#190b37]/5 rounded-lg mb-2 flex items-start transition-colors"
                              onClick={() => {
                                setInput(prompt.text);
                                inputRef.current?.focus();
                              }}
                            >
                              <div className="flex-1">
                                <p className="text-gray-800 font-medium text-base">{prompt.text}</p>
                                <p className="text-sm text-gray-500 mt-1">{prompt.subCategory}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id || `message-${index}`}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`
                        w-full sm:max-w-[85%] md:max-w-3xl p-3 md:p-4 rounded-lg 
                        ${message.role === 'user' 
                          ? 'bg-[#190b37] text-white ml-auto' 
                          : `${providerColors[message.provider || 'ANTHROPIC'].bg} text-black mr-auto`
                        }
                        ${message.flagged ? 'border-2 border-red-500' : ''}
                      `}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center mb-2">
                          <span className="font-medium">AI Assistant</span>
                        </div>
                      )}
                      {message.flagged && (
                        <div className="text-red-500 mb-2 flex flex-wrap items-center font-medium text-xs md:text-sm">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1 md:h-5 md:w-5 md:mr-2 flex-shrink-0" />
                          <span>This message was flagged: {message.flagReason}</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words text-sm md:text-base">
                        {message.content}
                      </div>
                      <div className="mt-2 flex justify-between items-center text-xs opacity-70">
                        <span>
                          {formatTime(message.timestamp)}
                        </span>
                        {message.role === 'user' ? (
                          <span className="flex items-center">
                            {(message.status === 'sending' || isLoading) && (
                              <ClockIcon className="h-4 w-4 text-yellow-300" />
                            )}
                            {message.status === 'sent' && !isLoading && (
                              <CheckCircleIcon className="h-4 w-4 text-green-300" />
                            )}
                            {message.status === 'error' && (
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-300" />
                            )}
                          </span>
                        ) : (
                          <img 
                            src={`/${message.provider === 'ANTHROPIC' ? 'claude' : 
                                   message.provider === 'GOOGLE' ? 'gemini' : 
                                   'openai'}.svg`} 
                            alt={`${message.provider || 'AI'} logo`}
                            className={`${message.provider === 'ANTHROPIC' ? 'h-10 w-10 md:h-12 md:w-12' : 'h-8 w-8 md:h-10 md:w-10'}`}
                          />
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-lg p-3 md:p-4 bg-white text-gray-700 w-full sm:max-w-[85%] md:max-w-3xl shadow-md">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '600ms' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef}></div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <motion.button
          className="fixed right-4 md:right-8 bottom-24 p-2 rounded-full bg-[#190b37] text-white shadow-lg z-10"
          onClick={scrollToBottom}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowDownCircleIcon className="h-6 w-6" />
        </motion.button>
      )}

      {/* Only show input form when in chat mode with messages or chatId */}
      {(messages.length > 0 || selectedChatId) && (
        <>
          {/* Mobile view filters - Only show on mobile when we have messages or a chatId */}
          {isMobile && (
            <div className="py-3 px-4 border-t border-gray-200 bg-white space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Quick Settings</h3>
              <div className="flex flex-col space-y-3">
                {/* LLM Provider Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">LLM Provider</label>
                  <MotionSelect
                    options={[
                      { value: 'ANTHROPIC', label: 'Anthropic Claude' },
                      { value: 'OPENAI', label: 'OpenAI GPT' },
                      { value: 'GOOGLE', label: 'Google Gemini' }
                    ]}
                    value={filterContext.provider}
                    onChange={handleProviderChange}
                    className="w-full"
                  />
                </div>
                
                {/* Model Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
                  <MotionSelect
                    options={modelOptions[filterContext.provider]}
                    value={filterContext.model}
                    onChange={handleModelChange}
                    className="w-full"
                  />
                </div>
                
                {/* Temperature Control */}
                {filterContext.temperature !== undefined && filterContext.setTemperature && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Temperature: <span className="font-semibold text-[#2f4faa]">{filterContext.temperature}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={filterContext.temperature}
                      onChange={(e) => filterContext.setTemperature && filterContext.setTemperature(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Precise</span>
                      <span>Creative</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Chat Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <form onSubmit={handleSubmit} className="flex items-end space-x-3">
              <div className="flex-1 bg-gray-100 rounded-lg p-3 focus-within:ring-2 focus-within:ring-[#2f4faa] focus-within:ring-opacity-50">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none p-0 resize-none h-10 max-h-32 overflow-auto"
                  style={{ minHeight: '40px' }}
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-lg flex-shrink-0 ${
                  !input.trim() || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#2f4faa] text-white hover:bg-[#214092]'
                }`}
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center">
              AI responses are powered by multiple models. Your data is protected by our security measures.
            </p>
          </div>
        </>
      )}

      {/* Custom Popup for Password Change */}
      <CustomPopup
        isOpen={showPasswordPopup}
        onClose={() => setShowPasswordPopup(false)}
        title="Security Alert"
        message={popupMessage}
        onConfirm={() => {
          setShowPasswordPopup(false);
          router.push('/auth/change-password');
        }}
        confirmText="Change Password"
      />
    </div>
  );
};

export default function ChatPageWithSuspense() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#190b37]" />}>
      <ChatPage />
    </Suspense>
  );
}