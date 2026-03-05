import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string | string[] } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const searchTerm = url.searchParams.get('search') || '';
    
    // Fix for NextJS warning - Use Promise.resolve to ensure params is awaited
    const paramsId = await Promise.resolve(params.id);
    if (!paramsId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }
    
    // Get the provider from the ID - properly handle params
    const providerId = Array.isArray(paramsId) ? paramsId[0] : paramsId;
    const provider = providerId.toUpperCase();
    
    // Check if provider is valid
    if (!['ANTHROPIC', 'OPENAI', 'GOOGLE'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid API provider' }, { status: 404 });
    }

    // Build the where clause, including search filter if provided
    const whereClause: any = {
      provider: provider
    };

    // Add search functionality
    if (searchTerm) {
      // Check if the search term looks like a date (MM/DD/YYYY or YYYY-MM-DD or just month names)
      const datePattern = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$|^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$|^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
      const isDateSearch = datePattern.test(searchTerm);
      
      if (isDateSearch) {
        // If it looks like a date, search by date range
        whereClause.createdAt = {
          gte: new Date(new Date().setHours(0,0,0,0) - 30*24*60*60*1000) // Last 30 days
        };
      } else {
        // Otherwise, search by user email
        whereClause.user = {
          email: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        };
      }
    }

    // Get chats that used this provider with proper pagination
    const chatsWithProvider = await prisma.chat.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            email: true
          }
        },
        queries: {
          select: {
            tokens: true,
            latency: true,
            status: true
          }
        }
      }
    });

    // Count total chats with this provider and search filter
    const totalChats = await prisma.chat.count({
      where: whereClause
    });

    // Transform data to expected format
    const chats = chatsWithProvider.map(chat => {
      // Calculate stats from queries
      const queryCount = chat.queries.length;
      const totalTokens = chat.queries.reduce((sum, query) => sum + (query.tokens || 0), 0);
      const totalLatency = chat.queries.reduce((sum, query) => sum + (query.latency || 0), 0);
      const averageLatency = queryCount > 0 ? totalLatency / queryCount : 0;
      const allCompleted = chat.queries.every(query => query.status !== 'FAILED' && query.status !== 'FLAGGED');
      
      return {
        id: chat.id,
        user: chat.user.email,
        timestamp: chat.createdAt.toISOString(),
        queryCount,
        totalTokens,
        averageLatency: Math.round(averageLatency * 100) / 100,
        status: allCompleted ? 'completed' : 'failed'
      };
    });

    return NextResponse.json({
      chats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalChats / pageSize),
        totalItems: totalChats,
        hasMore: (page * pageSize) < totalChats
      }
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
} 