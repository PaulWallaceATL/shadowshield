'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { 
  ChartBarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  BellIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Analytics', href: '/admin', icon: ChartBarIcon },
  { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
  { name: 'DLP Rules', href: '/admin/dlp-rules', icon: ShieldCheckIcon },
  { name: 'API Management', href: '/admin/api-management', icon: KeyIcon },
  { name: 'Alerts', href: '/admin/alerts', icon: BellIcon },
  { name: 'User Requests', href: '/admin/requests', icon: UserGroupIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
];

export default function AdminNav() {
  const pathname = usePathname();
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <nav className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-gray-700">
        <span className="text-xl font-bold">ShadowAI Shield</span>
        <span className="ml-2 px-2 py-1 text-xs bg-indigo-600 rounded">Admin</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </nav>
  );
} 