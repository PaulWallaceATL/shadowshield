'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      // Clear the stale JWT that still has mustChangePassword=true.
      // Delete the cookie directly so the middleware won't redirect back here.
      document.cookie = 'next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = '__Secure-next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure';

      // Redirect to signin — fresh login will pick up mustChangePassword=false from DB.
      window.location.href = '/auth/signin';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  // Form animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#190b37]">
      {/* Animated background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#2d1657_0%,_#190b37_100%)]" />
        <svg className="absolute w-full h-full opacity-30">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00a0cb" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative w-full">
        <div className="flex flex-col items-center">
          {/* Logo and Title */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.img
              src="/SSlight.svg"
              alt="ShadowAI Shield"
              className="h-24 mx-auto mb-4"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2
              }}
            />
            <motion.h2
              className="text-2xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Create New Password
            </motion.h2>
            <motion.p
              className="text-[#00a0cb]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Please set a new password for your account
            </motion.p>
          </motion.div>

          {/* Change Password Form */}
          <motion.div
            className="max-w-md w-full mx-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/10"
              variants={itemVariants}
            >
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center text-red-200"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-[#00a0cb] mb-2" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative">
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type={showNewPassword ? 'text' : 'password'}
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-[#00a0cb]/20 !text-white placeholder-[#00a0cb]/40 focus:outline-none focus:border-[#00a0cb] focus:ring-1 focus:ring-[#00a0cb] transition-all shadow-[0_0_10px_rgba(0,160,203,0.1)] focus:shadow-[0_0_15px_rgba(0,160,203,0.2)]"
                      placeholder="Enter your new password"
                      required
                      style={{
                        textShadow: '0 0 8px rgba(255,255,255,0.2)',
                        color: 'white'
                      }}
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00a0cb] hover:text-[#00a0cb] transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-[#00a0cb] mb-2" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-[#00a0cb]/20 !text-white placeholder-[#00a0cb]/40 focus:outline-none focus:border-[#00a0cb] focus:ring-1 focus:ring-[#00a0cb] transition-all shadow-[0_0_10px_rgba(0,160,203,0.1)] focus:shadow-[0_0_15px_rgba(0,160,203,0.2)]"
                      placeholder="Confirm your new password"
                      required
                      style={{
                        textShadow: '0 0 8px rgba(255,255,255,0.2)',
                        color: 'white'
                      }}
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00a0cb] hover:text-[#00a0cb] transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-gradient-to-r from-[#2f4faa] to-[#00a0cb] text-white font-medium hover:from-[#3a5ac5] hover:to-[#00b4e4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00a0cb] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,160,203,0.3)] hover:shadow-[0_0_30px_rgba(0,160,203,0.5)]"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <motion.div
                        className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <>
                        <ShieldCheckIcon className="h-5 w-5 mr-2" />
                        Set New Password
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 