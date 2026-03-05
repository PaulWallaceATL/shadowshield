import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { 
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
  BellIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import type { Session } from 'next-auth';

const userNavigation = [
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
];

const adminNavigation = [
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'DLP Rules', href: '/dlp', icon: ShieldCheckIcon },
  { name: 'Users', href: '/users', icon: UserGroupIcon },
  { name: 'Alerts', href: '/alerts', icon: BellIcon },
];

export default function Navigation({ user }: { user: Session['user'] }) {
  const pathname = usePathname();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const navigationItems = isAdmin ? adminNavigation : userNavigation;
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 shadow" style={{ backgroundColor: '#190b37' }}>
      <div className="max-w-full px-4">
        <div className="flex justify-between h-20">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center pl-2">
              <Link href="/">
                <img
                  src="/SSlight.svg"
                  alt="ShadowAI Shield"
                  className="h-24 w-auto"
                />
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-12 sm:items-center">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-2 text-base font-medium border-b-2 ${
                      isActive
                        ? 'border-[#00a0cb] text-white'
                        : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-6 w-6 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <span className="text-base text-gray-300 mr-3">
                {user?.name || user?.email}
              </span>
              <div className="h-10 w-10 rounded-full bg-gray-800 text-gray-300 flex items-center justify-center text-base">
                {user?.name?.[0] || user?.email?.[0]}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00a0cb]"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 