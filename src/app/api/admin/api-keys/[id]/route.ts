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
    
    // Get the current date for "last 24 hours" calculations
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1));

    // Get all stats in parallel for better performance
    const [
      totalQueries, 
      last24HQueries, 
      averageLatency, 
      totalTokens, 
      failedQueries,
      dlpFlaggedQueries,
      lastQuery,
      avgResponseTime,
      todayQueries,
      yesterdayQueries,
      costEstimate,
      uniqueUsers
    ] = await Promise.all([
      // Total queries
      prisma.query.count({
        where: { provider }
      }),
      // Queries in last 24 hours
      prisma.query.count({
        where: {
          provider,
          createdAt: { gte: last24Hours }
        }
      }),
      // Average latency
      prisma.query.aggregate({
        where: {
          provider,
          latency: { not: null }
        },
        _avg: {
          latency: true
        }
      }),
      // Total tokens used
      prisma.query.aggregate({
        where: {
          provider,
          tokens: { not: null }
        },
        _sum: {
          tokens: true
        }
      }),
      // Failed queries
      prisma.query.count({
        where: {
          provider,
          status: 'FAILED'
        }
      }),
      // DLP flagged queries
      prisma.query.count({
        where: {
          provider,
          status: 'FLAGGED'
        }
      }),
      // Get the last used timestamp
      prisma.query.findFirst({
        where: { provider },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      }),
      // Get average response time
      prisma.query.aggregate({
        where: {
          provider,
          latency: { not: null }
        },
        _avg: {
          latency: true
        }
      }),
      // Today's queries
      prisma.query.count({
        where: {
          provider,
          createdAt: { gte: today }
        }
      }),
      // Yesterday's queries
      prisma.query.count({
        where: {
          provider,
          createdAt: {
            gte: yesterday,
            lt: today
          }
        }
      }),
      // Rough cost estimate - 1 cent per 1000 tokens as a placeholder
      prisma.query.aggregate({
        where: {
          provider,
          tokens: { not: null }
        },
        _sum: {
          tokens: true
        }
      }).then(result => (result._sum.tokens || 0) / 1000 * 0.01),
      // Unique users
      prisma.query.groupBy({
        by: ['userId'],
        where: {
          provider
        }
      }).then(results => results.length)
    ]);

    // Get DLP violations count with raw SQL to ensure accuracy
    const dlpViolationsResult = await prisma.$queryRaw<[{violations: BigInt}]>`
      SELECT COUNT(*) as "violations"
      FROM "Query"
      WHERE "provider" = ${provider} AND "status" = 'FLAGGED'
    `;
    const dlpViolationsCount = Number(dlpViolationsResult[0]?.violations || 0);

    // Get unique users count with raw SQL to ensure accuracy
    const uniqueUsersResult = await prisma.$queryRaw<[{uniqueUsers: BigInt}]>`
      SELECT COUNT(DISTINCT "userId") as "uniqueUsers"
      FROM "Query"
      WHERE "provider" = ${provider} AND "userId" IS NOT NULL
    `;
    const uniqueUsersCount = Number(uniqueUsersResult[0]?.uniqueUsers || 0);

    // Calculate true success rate (excluding both failed and DLP flagged)
    const successRate = totalQueries > 0 
      ? parseFloat((((totalQueries - failedQueries - dlpViolationsCount) / totalQueries) * 100).toFixed(1))
      : 100;

    // Calculate daily trend percentage
    const trendPercentage = yesterdayQueries > 0
      ? parseFloat((((todayQueries - yesterdayQueries) / yesterdayQueries) * 100).toFixed(1))
      : 0;

    const apiKeyData = {
      id: provider.toLowerCase(),
      provider,
      name: `${provider} API Key`,
      isActive: true,
      lastUsed: lastQuery?.createdAt || new Date(),
      stats: {
        totalQueries,
        last24HQueries,
        averageLatency: Math.round(averageLatency._avg.latency || 0),
        totalTokens: totalTokens._sum.tokens || 0,
        successRate,
        failedQueries,
        dlpFlaggedQueries: dlpViolationsCount,
        avgResponseTime: Math.round(avgResponseTime._avg.latency || 0),
        todayQueries,
        yesterdayQueries,
        trendPercentage,
        trend: trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'stable',
        costEstimate: parseFloat(costEstimate.toFixed(2)),
        uniqueUsers: uniqueUsersCount
      }
    };

    return NextResponse.json(apiKeyData);
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API key details' },
      { status: 500 }
    );
  }
} 