'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import APIKeyRequestSection from '@/components/admin/APIKeyRequestSection';
import SuperAdminAPIManagementSection from '@/components/admin/SuperAdminAPIManagementSection';

export default function APIManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user) {
      router.push('/');
    }
  }, [session, router]);

  if (!session?.user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">API Management</h1>
      {session.user.role === 'SUPER_ADMIN' ? (
        <SuperAdminAPIManagementSection />
      ) : (
        <APIKeyRequestSection />
      )}
    </div>
  );
} 