import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

type UserChat = {
  id: string;
  title: string;
  provider: string;
  model: string;
  createdAt: Date;
  messages: any[];
};

async function getUserChats(userId: string): Promise<{ user: { name: string | null; email: string }, chats: UserChat[] } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      chats: {
        orderBy: { createdAt: 'desc' },
      }
    }
  });

  if (!user) return null;

  return {
    user,
    chats: user.chats
  };
}

export default async function UserChatsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role as string)) {
    notFound();
  }

  const result = await getUserChats(resolvedParams.id);

  if (!result) {
    notFound();
  }

  const { user, chats } = result;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            All Chats for {user.name || user.email}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Showing all chat history
          </p>
        </div>
        <Link
          href={`/admin/users/${resolvedParams.id}`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#190b37]"
        >
          Back to User Details
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {chats.map((chat: UserChat) => (
            <Link 
              key={chat.id} 
              href={`/admin/chats/${chat.id}`}
              className="block hover:bg-gray-50"
            >
              <li className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{chat.title || 'Untitled Chat'}</p>
                    <p className="text-sm text-gray-500">
                      {chat.provider} - {chat.model}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(chat.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {chat.messages?.length || 0} messages
                    </span>
                  </div>
                </div>
              </li>
            </Link>
          ))}
          {chats.length === 0 && (
            <li className="px-6 py-4 text-sm text-gray-500">No chats found</li>
          )}
        </ul>
      </div>
    </div>
  );
} 