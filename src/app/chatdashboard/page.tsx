'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatDashboardRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/chat');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Chat...</h1>
        <p>If you are not redirected automatically, <a href="/chat" className="text-blue-500 underline">click here</a>.</p>
      </div>
    </div>
  );
} 