'use client';

import UserRequestsSection from '@/components/admin/UserRequestsSection';
import { UserPlusIcon } from '@heroicons/react/24/outline';

export default function UserRequestsPage() {
  return (
    <div className="min-h-full">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-3">
              <UserPlusIcon className="h-8 w-8 text-[#00a0cb]" />
              <h1 className="text-2xl font-semibold text-white">User Requests</h1>
            </div>
            <p className="mt-1 text-sm text-gray-300">
              Review and manage user access requests
            </p>
          </div>
        </div>
        <UserRequestsSection />
      </div>
    </div>
  );
} 