import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from "@/lib/prisma";

type Provider = 'ANTHROPIC' | 'OPENAI' | 'GOOGLE';

interface APIKeyData {
  id: string;
  name: string;
  provider: Provider;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current date for "last 24 hours" calculations
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Create an array of providers we want to track
    const providers = ['ANTHROPIC', 'OPENAI', 'GOOGLE'] as Provider[];

    // Get API keys with their usage statistics using batch Promise.all to optimize
    const apiKeysPromises = providers.map(async (provider) => {
      // Run all database queries in parallel for better performance
      const [
        totalQueries, 
        last24HQueries, 
        averageLatency, 
        totalTokens, 
        failedQueries,
        dlpFlaggedQueries,
        lastQuery,
        avgTokensPerQuery,
        todayQueries,
        yesterdayQueries
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
        // Average latency - using cached value if available to improve performance
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
        // Average tokens per query
        prisma.query.aggregate({
          where: {
            provider,
            tokens: { not: null }
          },
          _avg: {
            tokens: true
          }
        }),
        // Today's queries
        prisma.query.count({
          where: {
            provider,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        // Yesterday's queries
        prisma.query.count({
          where: {
            provider,
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 1)),
              lt: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      ]);

      // Get unique users count
      const uniqueUsersResult = await prisma.$queryRaw<[{uniqueUsers: BigInt}]>`
        SELECT COUNT(DISTINCT "userId") as "uniqueUsers"
        FROM "Query"
        WHERE "provider" = ${provider} AND "userId" IS NOT NULL
      `;
      const uniqueUsersCount = Number(uniqueUsersResult[0]?.uniqueUsers || 0);

      // Get DLP violations count with raw SQL to ensure accuracy
      const dlpViolationsResult = await prisma.$queryRaw<[{violations: BigInt}]>`
        SELECT COUNT(*) as "violations"
        FROM "Query"
        WHERE "provider" = ${provider} AND "status" = 'FLAGGED'
      `;
      const dlpViolationsCount = Number(dlpViolationsResult[0]?.violations || 0);

      // Calculate success rate (consider DLP violations as failures)
      let successRate = 100;
      if (totalQueries > 0) {
        successRate = ((totalQueries - failedQueries - dlpViolationsCount) / totalQueries) * 100;
      }

      // Calculate trend percentage (change from yesterday to today)
      const trendPercentage = yesterdayQueries > 0
        ? parseFloat((((todayQueries - yesterdayQueries) / yesterdayQueries) * 100).toFixed(1))
        : 0;

      return {
        id: provider.toLowerCase(),
        provider,
        name: provider.charAt(0) + provider.slice(1).toLowerCase(),
        isActive: true,
        lastUsed: lastQuery?.createdAt || null,
        stats: {
          totalQueries,
          last24HQueries,
          uniqueUsers: uniqueUsersCount,
          averageLatency: Math.round(averageLatency._avg.latency || 0),
          totalTokens: totalTokens._sum.tokens || 0,
          successRate: Math.max(0, successRate),
          failedQueries,
          dlpFlaggedQueries: dlpViolationsCount,
          avgTokensPerQuery: Math.round(avgTokensPerQuery._avg.tokens || 0),
          todayQueries,
          yesterdayQueries,
          trendPercentage,
          trend: trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'stable'
        }
      };
    });

    const apiKeys = await Promise.all(apiKeysPromises);
    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// Since we're using environment variables, these operations are disabled
export async function POST() {
  return NextResponse.json(
    { error: 'API key management is disabled. Using environment variables.' },
    { status: 403 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'API key management is disabled. Using environment variables.' },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'API key management is disabled. Using environment variables.' },
    { status: 403 }
  );
} 