import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from '@prisma/client';

type QueryResult = {
  userId: string;
};

type DLPViolation = {
  type: string;
  _count: number;
};

type Alert = {
  id: string;
  type: string;
  message: string;
  severity: string;
  createdAt: Date;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role || '')) {
      console.log('Unauthorized access attempt:', session?.user);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current date
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      // Get total queries for different time periods
      const [
        queriesLast24h,
        queriesLast7d,
        queriesLast30d,
        blockedQueriesLast24h,
        blockedQueriesLast7d,
        blockedQueriesLast30d,
        activeUsersLast24h,
        activeUsersLast7d,
        activeUsersLast30d,
        dlpViolationsLast24h,
        dlpViolationsLast7d,
        dlpViolationsLast30d,
        recentAlerts
      ] = await Promise.all([
        // Total queries
        prisma.query.count({ where: { createdAt: { gte: oneDayAgo } } }),
        prisma.query.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.query.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

        // Blocked queries (status is FAILED)
        prisma.query.count({ where: { createdAt: { gte: oneDayAgo }, status: 'FAILED' } }),
        prisma.query.count({ where: { createdAt: { gte: sevenDaysAgo }, status: 'FAILED' } }),
        prisma.query.count({ where: { createdAt: { gte: thirtyDaysAgo }, status: 'FAILED' } }),

        // Active users
        prisma.query.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: oneDayAgo } },
        }).then(result => result.length),
        prisma.query.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: sevenDaysAgo } },
        }).then(result => result.length),
        prisma.query.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: thirtyDaysAgo } },
        }).then(result => result.length),

        // DLP violations (alerts of type DLP_VIOLATION)
        prisma.alert.count({ where: { createdAt: { gte: oneDayAgo }, type: 'DLP_VIOLATION' } }),
        prisma.alert.count({ where: { createdAt: { gte: sevenDaysAgo }, type: 'DLP_VIOLATION' } }),
        prisma.alert.count({ where: { createdAt: { gte: thirtyDaysAgo }, type: 'DLP_VIOLATION' } }),

        // Recent alerts
        prisma.alert.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            severity: true,
            message: true,
            createdAt: true,
          },
        })
      ]);

      // Get query volume by day
      const queryVolume = await prisma.query.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        _count: {
          id: true,
        },
      });

      // Format query volume by day
      const formattedQueryVolume = queryVolume.map((day) => ({
        name: new Date(day.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
        value: day._count.id,
      }));

      // Get response time distribution
      const queries = await prisma.query.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          latency: { not: null }
        },
        select: {
          latency: true
        }
      });

      // Calculate response time distribution
      const responseTimes = queries.reduce((acc, query) => {
        const latency = query.latency || 0;
        if (latency <= 200) acc['0-200ms']++;
        else if (latency <= 500) acc['201-500ms']++;
        else if (latency <= 1000) acc['501-1000ms']++;
        else acc['>1000ms']++;
        return acc;
      }, {
        '0-200ms': 0,
        '201-500ms': 0,
        '501-1000ms': 0,
        '>1000ms': 0
      });

      // Format response times for chart
      const formattedResponseTimes = Object.entries(responseTimes).map(([name, value]) => ({
        name,
        value
      }));

      // Get top users
      const topUsersData = await prisma.query.groupBy({
        by: ['userId'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });

      const topUsers = await Promise.all(
        topUsersData.map(async (user) => {
          const userData = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
              id: true,
              name: true,
              email: true,
            },
          });

          const successfulQueries = await prisma.query.count({
            where: {
              userId: user.userId,
              status: 'SUCCESS',
            },
          });

          return {
            id: userData?.id || '',
            name: userData?.name || userData?.email || 'Unknown User',
            queries: user._count.id,
            successRate: user._count.id > 0 ? successfulQueries / user._count.id : 0,
          };
        })
      );

      // Get DLP violations by type from alerts
      const dlpAlerts = await prisma.alert.findMany({
        where: {
          type: 'DLP_VIOLATION',
          createdAt: { gte: sevenDaysAgo }
        },
        select: {
          metadata: true
        }
      });

      // Group violations by rule name
      const violationsByType = dlpAlerts.reduce((acc: Record<string, number>, alert) => {
        const ruleName = (alert.metadata as any)?.ruleName || 'Unknown';
        acc[ruleName] = (acc[ruleName] || 0) + 1;
        return acc;
      }, {});

      // Convert to the format needed for the pie chart
      const dlpViolationsByType = Object.entries(violationsByType).map(([name, value], index) => {
        // Define a set of colors to cycle through
        const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#95A5A6', '#2ECC71', '#E74C3C', '#3498DB'];
        return {
          name,
          value,
          color: colors[index % colors.length]
        };
      });

      // Format response
      const analytics = {
        queries: {
          last24h: queriesLast24h,
          last7d: queriesLast7d,
          last30d: queriesLast30d,
          byDay: formattedQueryVolume,
        },
        blockedQueries: {
          last24h: blockedQueriesLast24h,
          last7d: blockedQueriesLast7d,
          last30d: blockedQueriesLast30d,
        },
        activeUsers: {
          last24h: activeUsersLast24h,
          last7d: activeUsersLast7d,
          last30d: activeUsersLast30d,
          topUsers,
        },
        dlpViolations: {
          last24h: dlpViolationsLast24h,
          last7d: dlpViolationsLast7d,
          last30d: dlpViolationsLast30d,
          byType: dlpViolationsByType,
        },
        responseTimes: formattedResponseTimes,
        recentAlerts: recentAlerts.map(alert => ({
          ...alert,
          createdAt: alert.createdAt.toISOString(),
        })),
      };

      console.log('Sending analytics response:', analytics);
      return NextResponse.json(analytics);
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch analytics data from database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in analytics endpoint:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 