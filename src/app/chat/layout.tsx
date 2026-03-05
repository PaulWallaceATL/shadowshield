'use client';

import { useState, useEffect, Fragment, useRef, Suspense } from 'react';
import { useSession, signOut } from "next-auth/react";
import { redirect, useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Transition } from '@headlessui/react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ShieldCheckIcon, 
  BellIcon, 
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  UserIcon,
  PlusIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { MotionSelect } from '@/components/ui/MotionSelect';
import { TemperatureSlider } from '@/components/ui/TemperatureSlider';
import { FilterContext } from "./page";

type Provider = 'ANTHROPIC' | 'OPENAI' | 'GOOGLE';
type ModelOption = { value: string; label: string };

type Chat = {
  id: string;
  title: string;
  provider: 'ANTHROPIC' | 'OPENAI' | 'GOOGLE';
  model: string;
  messages?: any[] | boolean;
  createdAt: string;
  updatedAt: string;
};

const modelOptions: Record<Provider, ModelOption[]> = {
  ANTHROPIC: [
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  OPENAI: [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  GOOGLE: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
};

function ChatLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const chatId = searchParams?.get('chatId');
  const initialProvider = (searchParams?.get('provider') as Provider) || 'ANTHROPIC';
  const initialModel = searchParams?.get('model') || 'claude-3-sonnet-20240229';
  
  const [provider, setProvider] = useState<Provider>(initialProvider);
  const [model, setModel] = useState(initialModel);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [temperature, setTemperature] = useState(0.7);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isNewChatDisabled, setIsNewChatDisabled] = useState(false);
  const [hasEmptyChat, setHasEmptyChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Add a ref to track the source of changes
  const isUpdatingFromUrl = useRef(false);
  // Add this at the top level of the component where other state is defined
  const userInitiatedChange = useRef(false);
  
  // Check for mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Initialize on mount
    checkIsMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  console.log('Chat Layout - Session:', session);
  console.log('Chat Layout - Must change password:', session?.user?.mustChangePassword);
  
  // FAILSAFE: Force redirect to change-password if mustChangePassword is true
  useEffect(() => {
    if (session?.user?.mustChangePassword === true) {
      console.log('FAILSAFE: User must change password, redirecting from chat to change-password');
      router.push('/auth/change-password');
    }
  }, [session, router]);

  // Clean up empty chats when user logs in
  useEffect(() => {
    const cleanupEmptyChats = async () => {
      if (session?.user) {
        try {
          // Fetch all chats including empty ones
          const response = await fetch('/api/chats?includeEmpty=true');
          if (response.ok) {
            const chats = await response.json();
            
            // Find empty chats
            const emptyChats = chats.filter((chat: Chat) => 
              !chat.messages || (Array.isArray(chat.messages) && chat.messages.length === 0)
            );
            
            // If there are empty chats, delete them
            if (emptyChats.length > 0) {
              console.log('Cleaning up empty chats from previous session');
              
              // Delete each empty chat
              for (const chat of emptyChats) {
                await fetch(`/api/chats/${chat.id}`, {
                  method: 'DELETE',
                });
              }
              
              // Refresh the chat list after cleanup
              fetchChats();
            }
          }
        } catch (error) {
          console.error('Error cleaning up empty chats:', error);
        }
      }
    };
    
    // Only run this when the session becomes available
    if (session) {
      cleanupEmptyChats();
    }
  }, [session]);

  useEffect(() => {
    fetchChats();
  }, []);

  // Update state when URL parameters change
  useEffect(() => {
    // Skip if user just made a change - this is critical to prevent loops
    if (userInitiatedChange.current) {
      console.log('URL Params Changed - Skipping as user just made a change');
      return;
    }

    // Set flag to indicate we're updating from URL
    isUpdatingFromUrl.current = true;
    
    const urlProvider = searchParams.get('provider') as Provider;
    const urlModel = searchParams.get('model');
    const chatId = searchParams.get('chatId');

    console.log('URL Params Changed - Provider:', urlProvider, 'Model:', urlModel, 'Current provider:', provider, 'Current model:', model);

    // Fetch chats when chatId changes to ensure sidebar is updated
    if (chatId) {
      fetchChats();
    }

    // Flag to track if we need to update the URL parameters
    let shouldUpdateUrl = false;
    const params = new URLSearchParams(window.location.search);
    
    // Step 1: Validate the provider
    let validProvider = urlProvider;
    if (!urlProvider || !Object.keys(modelOptions).includes(urlProvider)) {
      // Invalid or missing provider, use default
      validProvider = 'ANTHROPIC';
      params.set('provider', validProvider);
      shouldUpdateUrl = true;
      console.warn('Invalid provider in URL, using default:', validProvider);
    }
    
    // Step 2: Validate the model for the provider
    let validModel = urlModel;
    const isModelValid = urlModel && modelOptions[validProvider].some(m => m.value === urlModel);
    
    if (!isModelValid) {
      // Model is invalid or doesn't belong to this provider, use default for the provider
      validModel = modelOptions[validProvider][0].value;
      params.set('model', validModel);
      shouldUpdateUrl = true;
      console.warn(`Model ${urlModel} invalid for provider ${validProvider}, using default:`, validModel);
    }
    
    // Step 3: Update state with validated values - only if they are different from current values
    if (validProvider !== provider) {
      console.log(`Updating provider state from URL: ${provider} -> ${validProvider}`);
      setProvider(validProvider as Provider);
    }
    
    if (validModel !== model) {
      console.log(`Updating model state from URL: ${model} -> ${validModel}`);
      setModel(validModel!);
    }
    
    // Step 4: If needed, update the URL to be consistent
    if (shouldUpdateUrl && chatId) {
      // Only update URL if we have a chat ID (to avoid disrupting initial new chat page)
      console.log('Updating URL with corrected parameters:', params.toString());
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    
    // Reset flag after a longer delay to ensure all state updates have processed
    setTimeout(() => {
      isUpdatingFromUrl.current = false;
      console.log('URL Sync - Reset isUpdatingFromUrl=false');
    }, 500);
    
  }, [searchParams, pathname, router, provider, model, modelOptions]);

  useEffect(() => {
    const checkForEmptyChats = async () => {
      try {
        const response = await fetch('/api/chats?includeEmpty=true');
        if (response.ok) {
          const chats = await response.json();
          // Check if there are any empty chats
          const emptyChatsExist = chats.some((chat: Chat) => 
            !chat.messages || 
            (Array.isArray(chat.messages) && chat.messages.length === 0)
          );
          setHasEmptyChat(emptyChatsExist);
        }
      } catch (error) {
        console.error('Error checking for empty chats:', error);
      }
    };
    
    checkForEmptyChats();
    
    // Check periodically for empty chats
    const intervalId = setInterval(checkForEmptyChats, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Add event listeners to detect when messages are sent
  useEffect(() => {
    // Function to handle when a message is sent
    const handleMessageSent = () => {
      // After a message is sent, check if the current empty chat now has messages
      setTimeout(async () => {
        try {
          const currentChatId = searchParams.get('chatId');
          if (currentChatId) {
            const response = await fetch(`/api/chats/${currentChatId}`);
            if (response.ok) {
              const chatData = await response.json();
              // If the chat now has messages, it's no longer empty
              if (Array.isArray(chatData.messages) && chatData.messages.length > 0) {
                setHasEmptyChat(false);
                // Also update the fetchChats to refresh the sidebar
                fetchChats();
              }
            }
          }
        } catch (error) {
          console.error('Error checking if chat has messages:', error);
        }
      }, 500);
    };

    // Add event listener for when a message is sent
    window.addEventListener('messageSent', handleMessageSent);
    
    // Cleanup
    return () => {
      window.removeEventListener('messageSent', handleMessageSent);
    };
  }, [searchParams]);

  const fetchChats = async () => {
    try {
      // Include empty chats so they show in the Previous Chats section
      const response = await fetch('/api/chats?includeEmpty=true');
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    // Add debounce protection to prevent double clicks
    if (isNewChatDisabled) return;
    
    // Immediately set hasEmptyChat to hide the button
    setHasEmptyChat(true);
    setIsNewChatDisabled(true);
    
    try {
      // Check if there's already an empty chat
      const emptyChatsResponse = await fetch('/api/chats?includeEmpty=true');
      if (emptyChatsResponse.ok) {
        const allChats = await emptyChatsResponse.json();
        
        // Find any empty chats (no messages)
        const emptyChats = allChats.filter((chat: Chat) => 
          !chat.messages || 
          (Array.isArray(chat.messages) && chat.messages.length === 0)
        );
        
        // If we already have an empty chat, navigate to it instead of creating a new one
        if (emptyChats.length > 0) {
          // Sort by updated time to get the most recent
          const sortedEmptyChats = emptyChats.sort((a: Chat, b: Chat) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          
          const existingEmptyChat = sortedEmptyChats[0];
          console.log("Reusing existing empty chat:", existingEmptyChat.id);
          
          // Update URL with chat parameters
          router.push(`/chat?chatId=${existingEmptyChat.id}&provider=${existingEmptyChat.provider}&model=${existingEmptyChat.model}`);
          
          // Update selected chat
          setSelectedChat(existingEmptyChat);
          
          // Release the button disable after a delay
          setTimeout(() => setIsNewChatDisabled(false), 1000);
          return;
        }
      }
      
      // No existing empty chat found, create a new one
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
          provider,
          model,
        }),
      });

      if (response.ok) {
        const newChat = await response.json();
        
        // Optimistically update the chat list
        setChats(prev => {
          // Create a new array with the new chat at the beginning
          const updatedChats = [newChat, ...prev];
          
          // Remove any potential duplicates by ID
          const uniqueChats = [];
          const chatIds = new Set();
          
          for (const chat of updatedChats) {
            if (!chatIds.has(chat.id)) {
              chatIds.add(chat.id);
              uniqueChats.push(chat);
            }
          }
          
          return uniqueChats;
        });
        
        // Set as selected chat
        setSelectedChat(newChat);
        
        // Navigate to the new chat
        router.push(`/chat?chatId=${newChat.id}&provider=${provider}&model=${model}`);
        
        // Fetch updated chat list after a delay
        setTimeout(fetchChats, 300);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to create new chat");
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
        // Reset hasEmptyChat if there was an error
        setHasEmptyChat(false);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      setErrorMessage("Failed to create new chat");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      // Reset hasEmptyChat if there was an error
      setHasEmptyChat(false);
    } finally {
      // Re-enable the button after a delay
      setTimeout(() => setIsNewChatDisabled(false), 1000);
    }
  };

  const handleChatSelect = async (chat: Chat) => {
    console.log('Layout - handleChatSelect called for chat:', chat.id);
    
    setSelectedChat(chat);
    
    // Check if this is an empty chat
    const isEmpty = !chat.messages || 
                   (Array.isArray(chat.messages) && chat.messages.length === 0);
    
    // Update empty chat state if needed                
    if (isEmpty) {
      setHasEmptyChat(true);
    }
    
    try {
      // First fetch the chat data to ensure we have valid provider/model
      const response = await fetch(`/api/chats/${chat.id}`);
      if (!response.ok) throw new Error('Failed to fetch chat');
      const data = await response.json();
      
      console.log('Layout - Chat data fetched:', data);
      
      // Temporarily disable URL-triggered updates
      isUpdatingFromUrl.current = true;
      console.log('Layout - Set isUpdatingFromUrl=true during chat selection');
      
      // Get current URL params as a base
      const params = new URLSearchParams(window.location.search);
      
      // Always update the chatId
      params.set('chatId', chat.id);
      
      // Check current URL params
      const currentUrlProvider = params.get('provider');
      const currentUrlModel = params.get('model');
      
      console.log('Layout - Current URL params before chat selection:', 
        'provider:', currentUrlProvider, 
        'model:', currentUrlModel);
      
      // IMPORTANT: Only override provider/model if they're not already explicitly set in the URL
      // or if the chat was previously using a different provider/model
      
      // For provider: check if URL has a valid provider, otherwise use the chat's provider
      const urlHasValidProvider = currentUrlProvider && 
                                Object.keys(modelOptions).includes(currentUrlProvider as Provider);
      
      // For model: check if URL has a valid model for the selected provider
      const selectedProvider = urlHasValidProvider ? 
                             (currentUrlProvider as Provider) : 
                             (data.provider as Provider);
      
      const urlHasValidModel = currentUrlModel && 
                              modelOptions[selectedProvider]?.some(m => m.value === currentUrlModel);
      
      console.log('Layout - URL validation:', 
        'hasValidProvider:', urlHasValidProvider, 
        'hasValidModel:', urlHasValidModel);
      
      // Only update provider from chat if there's no valid provider in URL
      if (!urlHasValidProvider && data.provider) {
        console.log('Layout - Setting provider from chat:', data.provider);
        params.set('provider', data.provider);
        setProvider(data.provider);
      } else {
        // Keep current provider
        params.set('provider', provider);
        console.log('Layout - Keeping current provider:', provider);
      }
      
      // Only update model from chat if there's no valid model in URL
      if (!urlHasValidModel && data.model) {
        // Check if chat's model is valid for the selected provider
        const chatModelIsValid = modelOptions[selectedProvider]?.some(m => m.value === data.model);
        
        if (chatModelIsValid) {
          console.log('Layout - Setting model from chat:', data.model);
          params.set('model', data.model);
          setModel(data.model);
        } else {
          // Use first model for provider
          const defaultModel = modelOptions[selectedProvider][0].value;
          console.log('Layout - Using default model for provider:', defaultModel);
          params.set('model', defaultModel);
          setModel(defaultModel);
        }
      } else {
        // Keep current model if it's valid for the provider
        const currentModelIsValid = modelOptions[selectedProvider]?.some(m => m.value === model);
        
        if (currentModelIsValid) {
          console.log('Layout - Keeping current model:', model);
          params.set('model', model);
        } else {
          // Use first model for provider
          const defaultModel = modelOptions[selectedProvider][0].value;
          console.log('Layout - Current model invalid for provider, using default:', defaultModel);
          params.set('model', defaultModel);
          setModel(defaultModel);
        }
      }
      
      // Use Next.js router.replace to avoid full page reload
      const newUrl = `${pathname}?${params.toString()}`;
      console.log('Layout - Updating URL in handleChatSelect:', newUrl);
      
      router.replace(newUrl, {
        scroll: false
      });
      
      // Reset the URL update flag after a longer delay
      setTimeout(() => {
        isUpdatingFromUrl.current = false;
        console.log('Layout - Reset isUpdatingFromUrl=false after chat selection');
      }, 500);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('chatSelected', { detail: { chat: data } }));
    } catch (error) {
      console.error('Error fetching chat:', error);
      // Show error to user
      setErrorMessage("Failed to load chat");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      // Reset the URL update flag
      isUpdatingFromUrl.current = false;
    }
  };

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Function to update URL parameters
  const updateURLParams = (params: { provider?: Provider; model?: string; chatId?: string }) => {
    const searchParams = new URLSearchParams(window.location.search);
    
    // Update only the parameters that are provided
    if (params.provider) searchParams.set('provider', params.provider);
    if (params.model) searchParams.set('model', params.model);
    
    // Keep the chatId if it exists
    const currentChatId = searchParams.get('chatId');
    if (params.chatId) {
      searchParams.set('chatId', params.chatId);
    } else if (currentChatId) {
      searchParams.set('chatId', currentChatId);
    }
    
    // Use router.replace to update URL without adding to history
    router.replace(`${pathname}?${searchParams.toString()}`, { scroll: false });
  };

  // Handle provider change
  const handleProviderChange = (newProvider: string | Provider) => {
    console.log('Layout - handleProviderChange called with:', newProvider, 'Current provider:', provider);
    
    // Skip if update is triggered from URL changes to prevent loops
    if (isUpdatingFromUrl.current) {
      console.log('Layout - Skipping provider change as it was triggered from URL update');
      return;
    }
    
    // Mark this as a user-initiated change
    userInitiatedChange.current = true;
    console.log('Layout - Setting userInitiatedChange=true');
    
    const providerValue = newProvider as Provider;
    
    // Skip if no change
    if (providerValue === provider) {
      console.log('Layout - Provider already set to', providerValue, '- skipping update');
      userInitiatedChange.current = false;
      return;
    }
    
    // Skip if provider is invalid
    if (!Object.keys(modelOptions).includes(providerValue)) {
      console.warn('Layout - Invalid provider:', providerValue, '- skipping update');
      userInitiatedChange.current = false;
      return;
    }
    
    // Get default model for the new provider
    const defaultModel = modelOptions[providerValue][0].value;
    console.log('Layout - Setting provider to', providerValue, 'with default model:', defaultModel);
    
    // Set flag to prevent URL-triggered updates during our explicit updates
    // Use a longer timeout value for isUpdatingFromUrl to ensure it doesn't get reset prematurely
    isUpdatingFromUrl.current = true;
    console.log('Layout - Set isUpdatingFromUrl=true to prevent loops');
    
    try {
      // Update state first
      console.log('Layout - Updating provider state to:', providerValue);
      setProvider(providerValue);
      console.log('Layout - Updating model state to:', defaultModel);
      setModel(defaultModel);
      
      // Delay URL update to ensure state is updated first - use a longer delay
      setTimeout(() => {
        try {
          // Update URL parameters
          const params = new URLSearchParams(window.location.search);
          console.log('Layout - Current URL params before update:', params.toString());
          
          params.set('provider', providerValue);
          params.set('model', defaultModel);
          
          // Keep the chatId if it exists
          const currentChatId = params.get('chatId');
          if (currentChatId) {
            params.set('chatId', currentChatId);
          }
          
          const newUrl = `${pathname}?${params.toString()}`;
          console.log('Layout - Updating URL to:', newUrl);
          
          // Use Next.js router to avoid authentication issues with hard navigation
          router.replace(newUrl, { scroll: false });
          
          console.log('Layout - URL update completed, now provider should be:', providerValue);
        } catch (error) {
          console.error('Error updating URL:', error);
        }
        
        // Reset flags after a longer delay to ensure everything has settled
        setTimeout(() => {
          isUpdatingFromUrl.current = false;
          console.log('Layout - Reset isUpdatingFromUrl=false');
          
          // Keep userInitiatedChange true for a bit longer to ensure URL sync effect doesn't override
          setTimeout(() => {
            userInitiatedChange.current = false;
            console.log('Layout - Reset userInitiatedChange=false');
          }, 500);
        }, 200);
      }, 200);
    } catch (error) {
      console.error('Error updating provider:', error);
      // Reset flags in case of error
      isUpdatingFromUrl.current = false;
      userInitiatedChange.current = false;
    }
  };

  // Handle model change
  const handleModelChange = (newModel: string) => {
    console.log('Layout - handleModelChange called with:', newModel, 'Current model:', model);
    
    // Skip if update is triggered from URL changes to prevent loops
    if (isUpdatingFromUrl.current) {
      console.log('Layout - Skipping model change as it was triggered from URL update');
      return;
    }
    
    // Mark this as a user-initiated change
    userInitiatedChange.current = true;
    console.log('Layout - Setting userInitiatedChange=true');
    
    // Skip if no change
    if (newModel === model) {
      console.log('Layout - Model already set to', newModel, '- skipping update');
      userInitiatedChange.current = false;
      return;
    }
    
    // Skip validation if provider or modelOptions are not properly initialized yet
    if (!provider || !modelOptions[provider]) {
      console.warn('Layout - Cannot validate model as provider is not properly initialized');
      userInitiatedChange.current = false;
      return;
    }
    
    // Perform thorough validation to ensure model belongs to current provider
    const modelBelongsToProvider = modelOptions[provider].some((m: ModelOption) => m.value === newModel);
    
    if (!modelBelongsToProvider) {
      console.warn(`Layout - Invalid model ${newModel} for provider ${provider}`);
      
      // Handle an invalid model by switching to a valid one instead of just returning
      const defaultModel = modelOptions[provider][0].value;
      console.log(`Layout - Switching to default model for ${provider}: ${defaultModel}`);
      
      // Set flag to prevent URL-triggered updates
      isUpdatingFromUrl.current = true;
      
      try {
        // Update model state
        setModel(defaultModel);
        
        // Update URL parameters
        setTimeout(() => {
          try {
            const params = new URLSearchParams(window.location.search);
            console.log('Layout - Current URL params before update:', params.toString());
            
            params.set('model', defaultModel);
            params.set('provider', provider);
            
            const currentChatId = params.get('chatId');
            if (currentChatId) {
              params.set('chatId', currentChatId);
            }
            
            const newUrl = `${pathname}?${params.toString()}`;
            console.log('Layout - Updating URL to:', newUrl);
            
            // Use replace to avoid adding to history
            router.replace(newUrl, { scroll: false });
            
            console.log('Layout - URL update completed, now model should be:', defaultModel);
          } catch (error) {
            console.error('Error updating URL:', error);
          }
          
          // Reset flag after a longer delay
          setTimeout(() => {
            isUpdatingFromUrl.current = false;
            console.log('Layout - Reset isUpdatingFromUrl=false');
            
            // Reset user change flag after another delay
            setTimeout(() => {
              userInitiatedChange.current = false;
              console.log('Layout - Reset userInitiatedChange=false');
            }, 500);
          }, 500);
        }, 200);
      } catch (error) {
        console.error('Error updating model:', error);
        // Reset flag in case of error
        isUpdatingFromUrl.current = false;
        userInitiatedChange.current = false;
      }
      
      return;
    }
    
    // Set flag to prevent URL-triggered updates
    isUpdatingFromUrl.current = true;
    console.log('Layout - Set isUpdatingFromUrl=true to prevent loops');
    
    try {
      // Update model state
      console.log('Layout - Updating model state to:', newModel);
      setModel(newModel);
      
      // Update URL parameters with a longer delay to ensure state is updated first
      setTimeout(() => {
        try {
          const params = new URLSearchParams(window.location.search);
          console.log('Layout - Current URL params before update:', params.toString());
          
          params.set('model', newModel);
          
          // Keep the provider and chatId
          params.set('provider', provider);
          
          const currentChatId = params.get('chatId');
          if (currentChatId) {
            params.set('chatId', currentChatId);
          }
          
          const newUrl = `${pathname}?${params.toString()}`;
          console.log('Layout - Updating URL to:', newUrl);
          
          // Use replace to avoid adding to history
          router.replace(newUrl, { scroll: false });
          
          console.log('Layout - URL update completed, now model should be:', newModel);
        } catch (error) {
          console.error('Error updating URL:', error);
        }
        
        // Reset flag after a longer delay
        setTimeout(() => {
          isUpdatingFromUrl.current = false;
          console.log('Layout - Reset isUpdatingFromUrl=false');
          
          // Keep userInitiatedChange true for a bit longer to ensure URL sync effect doesn't override
          setTimeout(() => {
            userInitiatedChange.current = false;
            console.log('Layout - Reset userInitiatedChange=false');
          }, 500);
        }, 500);
      }, 200);
    } catch (error) {
      console.error('Error updating model:', error);
      // Reset flag in case of error
      isUpdatingFromUrl.current = false;
      userInitiatedChange.current = false;
    }
  };

  // And finally update the URL synchronization effect
  useEffect(() => {
    // Skip synchronization if we're already updating from URL changes or user just made a change
    if (isUpdatingFromUrl.current || userInitiatedChange.current) {
      console.log('Skipping sync effect as we are already updating from URL or user just made a change');
      return;
    }
    
    // Add a small delay to let other state updates complete
    const syncTimer = setTimeout(() => {
      const urlProvider = searchParams.get('provider') as Provider;
      const urlModel = searchParams.get('model');
      
      // Track if we need updates to avoid loops
      let needsStateUpdate = false;
      let updatedProvider = provider;
      let updatedModel = model;
      
      // Check if provider from URL exists and is valid 
      const isValidProvider = urlProvider && Object.keys(modelOptions).includes(urlProvider);
      
      // Check if current state matches URL - only update if there's a significant mismatch
      if (isValidProvider && urlProvider !== provider) {
        console.log('Syncing provider state with URL:', urlProvider);
        updatedProvider = urlProvider;
        needsStateUpdate = true;
      }
      
      // Only check model if we're not changing the provider (which would reset the model anyway)
      if (!needsStateUpdate && urlModel && urlModel !== model) {
        // Check if this model is valid for the current provider
        const isValidModel = modelOptions[provider]?.some((m: ModelOption) => m.value === urlModel);
        if (isValidModel) {
          console.log('Syncing model state with URL:', urlModel);
          updatedModel = urlModel;
          needsStateUpdate = true;
        }
      }
      
      // Only update state if needed, and do it once to avoid re-renders
      if (needsStateUpdate) {
        // Set flag before updating to prevent loops
        isUpdatingFromUrl.current = true;
        console.log('Sync effect - Setting isUpdatingFromUrl=true');
        
        // Use batch updates to reduce renders
        if (updatedProvider !== provider) {
          setProvider(updatedProvider);
          
          // When provider changes, update model to default for that provider
          // unless we have a valid model already for that provider
          const isModelValidForNewProvider = modelOptions[updatedProvider]?.some(
            (m: ModelOption) => m.value === model
          );
          
          if (!isModelValidForNewProvider) {
            const defaultModel = modelOptions[updatedProvider][0].value;
            setModel(defaultModel);
          }
        } else if (updatedModel !== model) {
          setModel(updatedModel);
        }
        
        // Reset flag after a short delay
        setTimeout(() => {
          isUpdatingFromUrl.current = false;
          console.log('Sync effect - Reset isUpdatingFromUrl=false');
        }, 200);
      }
    }, 300); // Increased delay to reduce chance of race conditions
    
    return () => clearTimeout(syncTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, provider, model, modelOptions]);  // Include needed dependencies but disable exhaustive-deps warning

  return (
    <div className="h-screen flex flex-col md:flex-row relative overflow-hidden">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#190b37] text-white p-2 rounded-md shadow-lg"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ 
          x: isSidebarOpen ? 0 : -300,
          opacity: isSidebarOpen ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed md:relative h-screen md:h-auto inset-y-0 left-0 ${
          isSidebarOpen ? 'z-40' : '-z-10'
        } md:z-10 w-64 md:w-80 bg-[#190b37] text-white shadow-lg overflow-hidden flex flex-col`}
      >
        {/* Logo Section */}
        <div className="flex-shrink-0 h-[100px] md:h-[120px] flex items-center justify-center border-b border-[#2a1854]">
          <motion.div
            className="relative w-full px-4"
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2 
            }}
          >
            <Link href="/chat" className="block" onClick={() => isMobile && setIsSidebarOpen(false)}>
              <motion.img
                src="/SSlight.svg"
                alt="ShadowAI Shield"
                className="h-full w-full object-contain max-h-[80px] md:max-h-[100px]"
                whileHover={{ 
                  scale: 1.05,
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 10
                  }
                }}
                whileTap={{ scale: 0.95 }}
              />
            </Link>
          </motion.div>
        </div>

        {/* Settings Section */}
        <div className="flex-shrink-0 p-4 border-b border-[#2a1854] overflow-y-auto">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-white">Settings</h2>
          <div className="space-y-4">
            {/* LLM Provider */}
            <MotionSelect
              label="LLM Provider"
              options={[
                { value: 'ANTHROPIC', label: 'Anthropic Claude' },
                { value: 'OPENAI', label: 'OpenAI GPT-3.5' },
                { value: 'GOOGLE', label: 'Google Gemini' }
              ]}
              value={provider}
              onChange={handleProviderChange}
            />

            {/* Model */}
            <MotionSelect
              label="Model"
              options={modelOptions[provider]}
              value={model}
              onChange={handleModelChange}
            />

            {/* Temperature */}
            <div className="relative z-10">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Temperature: <span className="text-[#00a0cb]">{temperature}</span>
              </label>
              <TemperatureSlider
                value={temperature}
                onChange={setTemperature}
                min={0}
                max={1}
                step={0.1}
                showLabels={true}
              />
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="flex-shrink-0 p-4 border-b border-[#2a1854] relative z-10">
          {!hasEmptyChat && (
            <button
              onClick={() => {
                handleNewChat();
                if (isMobile) setIsSidebarOpen(false);
              }}
              className={`w-full ${
                isNewChatDisabled 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#00a0cb] hover:bg-[#0090b8]'
              } text-white rounded-lg px-4 py-2 transition-colors flex items-center justify-center space-x-2`}
              disabled={isNewChatDisabled}
              title="Create a new chat"
            >
              <PlusIcon className="h-5 w-5" />
              <span>New Chat</span>
            </button>
          )}
        </div>

        {/* Previous Chats Section */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-shrink-0 px-4 py-2 border-b border-[#2a1854]">
            <h2 className="text-lg md:text-xl font-semibold text-white">Previous Chats</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {chats.map((chat) => {
              // Check if this is an empty chat
              const isEmpty = !chat.messages || 
                             (Array.isArray(chat.messages) && chat.messages.length === 0);
              
              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    handleChatSelect(chat);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors relative z-10 ${
                    selectedChat?.id === chat.id
                      ? "bg-[#00a0cb] text-white"
                      : "text-gray-300 hover:bg-[#2a1854]"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="truncate text-sm">{chat.title || "Untitled Chat"}</p>
                      </div>
                      <p className="text-xs opacity-70">
                        {new Date(chat.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Section */}
        <div className="flex-shrink-0 p-4 border-t border-[#2a1854] relative z-20">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-[#2a1854] flex items-center justify-center text-white font-semibold">
                {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name || session?.user?.email}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {session?.user?.role?.toLowerCase()}
              </p>
            </div>
            <Menu as="div" className="relative">
              <Menu.Button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#2a1854] transition-colors">
                <EllipsisVerticalIcon className="h-5 w-5" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 bottom-full mb-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[60]">
                  <div className="py-1">
                    {session?.user?.role === "ADMIN" && (
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/admin"
                            className={`${
                              active ? "bg-gray-100" : ""
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            Admin Dashboard
                          </Link>
                        )}
                      </Menu.Item>
                    )}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                          className={`${
                            active ? "bg-gray-100" : ""
                          } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                        >
                          Sign Out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 w-full">
        {showError && (
          <div className="absolute top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-md shadow-lg">
            {errorMessage}
          </div>
        )}
        <FilterContext.Provider 
          value={{
            provider,
            setProvider: handleProviderChange,
            model,
            setModel: handleModelChange,
            temperature,
            setTemperature
          }}
        >
          {children}
        </FilterContext.Provider>
      </main>
      
      {/* Mobile Overlay - Only shows when sidebar is open on mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#190b37]" />}>
      <ChatLayoutContent>{children}</ChatLayoutContent>
    </Suspense>
  );
}