'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/dashboard/Navigation';
import type { Session } from 'next-auth';

export default function NavigationProvider({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith('/chat');
  const isChangePasswordPage = pathname?.startsWith('/auth/change-password');
  const isHomePage = pathname === '/';
  
  const shouldShowNavigation = session?.user && 
    !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role || '') && 
    !isChatPage &&
    !isChangePasswordPage &&
    !isHomePage;

  if (!shouldShowNavigation) return null;
  
  return <Navigation user={session.user} />;
} 