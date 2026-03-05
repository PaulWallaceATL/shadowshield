'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { PaperAirplaneIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '@/components/ui/Tooltip';
import { MotionSelect } from '@/components/ui/MotionSelect';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { TemperatureSlider } from '@/components/ui/TemperatureSlider';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  flagged?: boolean;
  flagReason?: string;
  status?: 'sending' | 'sent' | 'error';
  provider?: Provider;
  model?: string;
};

type Provider = 'ANTHROPIC' | 'OPENAI' | 'GOOGLE';
type ModelOption = { value: string; label: string };

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

const providerColors: Record<Provider, { primary: string; secondary: string; light: string; dark: string; background: string }> = {
  ANTHROPIC: { 
    primary: '#EBDBBC', 
    secondary: '#D1C2A8', 
    light: '#F7F3EC',
    dark: 'rgba(235, 219, 188, 0.2)',
    background: '#EBDBBC'  // Beige color for Anthropic
  },
  OPENAI: { 
    primary: '#74AA9C', 
    secondary: '#5C8C80', 
    light: '#E6F0EE',
    dark: 'rgba(116, 170, 156, 0.2)',
    background: '#FFFFFF'  // White for OpenAI
  },
  GOOGLE: { 
    primary: '#4796E3', 
    secondary: '#3A78B8', 
    light: '#EBF3FB',
    dark: 'rgba(71, 150, 227, 0.2)',
    background: '#1E1E1E'  // Dark gray/black for Google
  },
};

export default function AdminChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>('ANTHROPIC');
  const [model, setModel] = useState(modelOptions.ANTHROPIC[0].value);
  const [temperature, setTemperature] = useState(70);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 640px)');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      status: 'sending',
      provider: provider,
      model: model,
    };

    setMessages(prev => [...prev, userMessage]);
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
          provider,
          model,
          temperature: temperature / 100,
          isAdmin: true
        })
      });

      let data;
      let responseText;
      try {
        responseText = await response.text();
        console.log('Admin chat - Raw response:', responseText);
        data = JSON.parse(responseText);
        console.log('Admin chat - Parsed data:', data);
      } catch (jsonError) {
        console.error('Admin chat - JSON parse error:', jsonError);
        console.error('Admin chat - Response text:', responseText);
        throw new Error(`Failed to parse response from server: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Server error: ${response.status}`);
      }

      if (!data || typeof data.content !== 'string') {
        console.error('Admin chat - Invalid response data:', data);
        throw new Error('Invalid response format from server');
      }
      
      // Update user message status
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
      ));

      const assistantMessage: Message = {
        id: data.id || Date.now().toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        flagged: data.flagged,
        flagReason: data.flagReason,
        status: 'sent',
        provider: provider,
        model: model,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process your request';
      setError(errorMessage);
      
      // Update user message status to error
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
      ));

      // Add error message to chat
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
        status: 'error',
        provider: provider,
        model: model,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#151517]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 bg-gray-800 shadow-sm"
      >
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <h1 
            className="text-xl sm:text-2xl font-semibold text-white" 
          >
            Admin Chat Testing
          </h1>
          <Tooltip content="Clear chat history">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearChat}
              className="p-2 rounded-full hover:bg-gray-700"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-300" />
            </motion.button>
          </Tooltip>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <MotionSelect
            value={provider}
            onChange={(value) => {
              const newProvider = value as Provider;
              setProvider(newProvider);
              setModel(modelOptions[newProvider][0].value);
            }}
            options={[
              { value: 'ANTHROPIC', label: 'Anthropic Claude' },
              { value: 'OPENAI', label: 'OpenAI GPT-3.5' },
              { value: 'GOOGLE', label: 'Google Gemini' }
            ]}
            className="w-full sm:w-48"
          />

          <MotionSelect
            value={model}
            onChange={(value) => setModel(value)}
            options={modelOptions[provider]}
            className="w-full sm:w-48"
          />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 sm:px-6 pb-4 bg-gray-800 border-b border-gray-700"
      >
        <div className="max-w-4xl mx-auto py-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-white">
              Temperature: {temperature / 100}
            </label>
          </div>
          
          <TemperatureSlider 
            value={temperature} 
            onChange={setTemperature} 
          />
          
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Precise</span>
            <span>Balanced</span>
            <span>Creative</span>
          </div>
        </div>
      </motion.div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-[#151517]">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <h2 className="text-xl font-semibold text-gray-200 mb-4">
                  Welcome to Admin Chat Testing
                </h2>
                <p className="text-gray-400">
                  Test your DLP rules and AI responses here
                </p>
              </motion.div>
            ) : (
              messages.map((message) => {
                const messageProvider = message.provider || provider;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 rounded-lg shadow-md ${
                      message.role === 'assistant'
                        ? `ml-0 sm:ml-8`
                        : `bg-gradient-to-r from-blue-500 to-purple-600 text-white mr-0 sm:mr-8`
                    }`}
                    style={message.role === 'assistant' ? { 
                      backgroundColor: providerColors[messageProvider].background
                    } : {}}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm flex items-center space-x-2 ${
                        message.role === 'assistant' 
                          ? 'text-black font-medium'
                          : 'text-white font-medium'
                      }`}>
                        {message.role === 'assistant' ? 'AI Assistant' : 'Admin'}
                        {message.status === 'sending' && (
                          <motion.span
                            animate={{ opacity: [0.4, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="ml-2 text-xs"
                          >
                            sending...
                          </motion.span>
                        )}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs ${
                          message.role === 'assistant' 
                            ? messageProvider === 'GOOGLE'
                              ? 'text-gray-300'
                              : 'text-gray-600' 
                            : 'text-white opacity-80'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className={`whitespace-pre-wrap ${
                      message.role === 'assistant' 
                        ? messageProvider === 'GOOGLE'
                          ? 'text-white' 
                          : 'text-gray-900'
                        : 'text-white'
                    }`}>
                      {message.content}
                    </p>
                    
                    {/* Provider icon at bottom right */}
                    {message.role === 'assistant' && (
                      <div className="flex justify-end mt-3">
                        {messageProvider === 'ANTHROPIC' && (
                          <img src="/claude.svg" alt="Claude" className="h-12 w-12 sm:h-14 sm:w-14" />
                        )}
                        {messageProvider === 'GOOGLE' && (
                          <img src="/gemini.svg" alt="Gemini" className="h-10 w-10 sm:h-12 sm:w-12" />
                        )}
                        {messageProvider === 'OPENAI' && (
                          <img src="/openai.svg" alt="OpenAI" className="h-6 w-6 sm:h-8 sm:w-8" />
                        )}
                      </div>
                    )}
                    
                    {message.flagged && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 text-red-400 text-sm flex items-center space-x-2"
                      >
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <span>Flagged: {message.flagReason}</span>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2"
              >
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start ml-0 sm:ml-8"
            >
              <div 
                className="rounded-lg px-4 py-2 flex items-center space-x-2"
                style={{ 
                  backgroundColor: providerColors[provider].background,
                  color: provider === 'GOOGLE' ? 'white' : 'rgba(55, 65, 81, 1)'
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <ArrowPathIcon className="h-4 w-4 text-[#00a0cb]" />
                </motion.div>
                <span>Processing...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t border-gray-700 bg-gray-800 p-4 sm:p-6 shadow-lg"
      >
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Test your message here..."
              disabled={isLoading}
              className="flex-1 rounded-lg border-2 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00a0cb] focus:border-transparent disabled:bg-gray-700 transition-all duration-200 text-white bg-gray-700 border-gray-600"
              style={{ color: 'white' }}
            />
            <motion.button
              type="submit"
              disabled={isLoading || !input.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-white rounded-lg px-4 sm:px-6 py-2 hover:opacity-90 focus:outline-none focus:ring-2 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2 bg-[#00a0cb]"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              {!isMobile && <span>Send</span>}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
} 