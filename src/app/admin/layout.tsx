'use client';

import AdminSidebar from '@/components/admin/AdminSidebar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
    
    // Force reload styles on admin page
    const styleSheet = document.createElement('style');
    styleSheet.textContent = '* {}'; // Empty rule to force a style recalculation
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00a0cb]"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {session && <AdminSidebar session={session} />}
      <main className="lg:pl-64 min-h-screen bg-[#0f172a] pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
} 