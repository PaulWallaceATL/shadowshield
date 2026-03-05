import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string | string[] }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fix for NextJS warning - Use Promise.resolve to ensure params is awaited
    const { id: paramsId } = await params;
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
    
    // Get the current date for hourly data over the last 24 hours
    const now = new Date();
    const hourlyData = [];
    const hourlyLabels = [];
    const hourlyQueries = [];
    const hourlyLatency = [];
    
    // Get data for the last 24 hours, hour by hour
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i - 1);
      hourStart.setMinutes(0, 0, 0);
      
      const hourEnd = new Date(now);
      hourEnd.setHours(now.getHours() - i);
      hourEnd.setMinutes(0, 0, 0);
      
      // Query data for this hour
      const [queries, latencyData] = await Promise.all([
        // Count queries in this hour
        prisma.query.count({
          where: {
            provider,
            createdAt: {
              gte: hourStart,
              lt: hourEnd
            }
          }
        }),
        // Get average latency for this hour
        prisma.query.aggregate({
          where: {
            provider,
            createdAt: {
              gte: hourStart,
              lt: hourEnd
            },
            latency: { not: null }
          },
          _avg: {
            latency: true
          }
        })
      ]);
      
      // Format hour label (e.g., "10h ago" or "Now" for the current hour)
      const hourLabel = i === 0 ? 'Now' : i === 1 ? '1h ago' : `${i}h ago`;
      
      hourlyLabels.push(hourLabel);
      hourlyQueries.push(queries);
      hourlyLatency.push(Math.round(latencyData._avg.latency || 0));
    }
    
    return NextResponse.json({
      labels: hourlyLabels,
      queries: hourlyQueries,
      latency: hourlyLatency
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
} 