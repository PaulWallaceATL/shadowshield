'use client';

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChartBarIcon, UserGroupIcon, ShieldCheckIcon, KeyIcon, BellIcon, UserPlusIcon, ArrowRightOnRectangleIcon, ChatBubbleLeftRightIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Session } from "next-auth";
import { useState, useEffect } from 'react';

export default function AdminSidebar({ session }: { session: Session }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  const navigationItems = [
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
    { name: 'DLP Rules', href: '/admin/dlp', icon: ShieldCheckIcon },
    { name: 'API Management', href: '/admin/api', icon: KeyIcon },
    { name: 'Alerts', href: '/admin/alerts', icon: BellIcon },
    { name: 'User Requests', href: '/admin/requests', icon: UserPlusIcon },
    { name: 'All Chats', href: '/admin/allchats', icon: ChatBubbleLeftRightIcon },
    { name: 'Admin Chat', href: '/admin/chat', icon: ChatBubbleLeftRightIcon },
  ];

  // Mobile menu toggle button
  const MobileMenuButton = () => (
    <motion.button
      className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#190b37] text-white"
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {isMobileMenuOpen ? (
        <XMarkIcon className="h-6 w-6" />
      ) : (
        <Bars3Icon className="h-6 w-6" />
      )}
    </motion.button>
  );

  const sidebarContent = (
    <motion.div 
      className={`${
        isMobile 
          ? 'fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out'
          : 'fixed inset-y-0 left-0 w-64 z-40'
      } bg-[#190b37] text-white flex flex-col`}
      initial={isMobile ? { x: "-100%" } : { opacity: 0 }}
      animate={isMobile ? { x: isMobileMenuOpen ? 0 : "-100%" } : { opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="flex-shrink-0 h-[140px] flex items-center justify-center pt-4">
        <motion.div
          className="relative w-full px-2"
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2 
          }}
        >
          <Link href="/admin" className="block relative" onClick={() => isMobile && setIsMobileMenuOpen(false)}>
            <motion.img
              src="/SSlight.svg"
              alt="ShadowAI Shield"
              className="h-full w-full object-contain max-h-[120px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            />
          </Link>
        </motion.div>
      </div>

      <motion.nav 
        className="flex-1 py-2 space-y-1 px-3 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {navigationItems.map((item, index) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <motion.div
                key={item.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={item.href} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
                  <motion.div
                    className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      isActive
                        ? 'bg-[#00a0cb] text-white shadow-lg'
                        : 'text-gray-300 hover:bg-[#00a0cb] hover:text-white'
                    }`}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className={`h-5 w-5 mr-3 transition-colors ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`} />
                    {item.name}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.nav>

      <motion.div 
        className="flex-shrink-0 p-4 border-t border-[#2a1854]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center px-3 py-3 space-x-3">
          <div className="flex-shrink-0">
            <motion.div
              className="h-10 w-10 rounded-full bg-[#2a1854] flex items-center justify-center text-white font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {session.user?.name?.[0] || session.user?.email?.[0] || 'U'}
            </motion.div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session.user?.name || session.user?.email}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {session.user?.role?.toLowerCase()}
            </p>
          </div>
          <motion.button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#2a1854] transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );

  // Overlay for mobile menu
  const mobileOverlay = isMobile && isMobileMenuOpen && (
    <motion.div
      className="fixed inset-0 bg-black/50 z-30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setIsMobileMenuOpen(false)}
    />
  );

  return (
    <>
      <MobileMenuButton />
      {mobileOverlay}
      {sidebarContent}
    </>
  );
} 