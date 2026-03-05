import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type Alert = {
  id: string;
  type: 'DLP_VIOLATION' | 'SYSTEM_ERROR' | 'AUTHENTICATION_FAILURE' | 'API_ERROR';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED';
  createdAt: Date;
  resolvedAt?: Date | null;
  metadata: Record<string, any>;
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Live alerts - Session details:', {
      email: session?.user?.email,
      role: session?.user?.role,
      authenticated: !!session
    });
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role)) {
      console.log('Live alerts - Unauthorized access attempt:', {
        role: session?.user?.role,
        allowedRoles: ['SUPER_ADMIN', 'ORG_ADMIN']
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get alerts from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    console.log('Live alerts - Query parameters:', {
      timeWindow: oneHourAgo.toISOString(),
      limit: 50
    });
    
    const alerts = await prisma.alert.findMany({
      where: {
        createdAt: {
          gte: oneHourAgo
        },
        // Filter alerts by organization for ORG_ADMIN
        ...(session.user.role === 'ADMIN' && {
          organization: {
            members: {
              some: {
                userId: session.user.id,
                role: 'ORG_ADMIN'
              }
            }
          }
        })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
      include: {
        // Include any related data if needed
      }
    });

    console.log('Live alerts - Database query results:', {
      totalAlerts: alerts.length,
      alertTypes: alerts.map((a: Alert) => a.type),
      alertStatuses: alerts.map((a: Alert) => a.status),
      alertMessages: alerts.map((a: Alert) => a.message).slice(0, 3) // Log first 3 messages for debugging
    });

    // Format dates for JSON serialization
    const formattedAlerts = alerts.map((alert: Alert) => ({
      ...alert,
      createdAt: alert.createdAt.toISOString(),
      resolvedAt: alert.resolvedAt?.toISOString()
    }));

    console.log('Live alerts - Response preparation:', {
      formattedAlertsCount: formattedAlerts.length,
      firstAlertTimestamp: formattedAlerts[0]?.createdAt
    });
    
    return NextResponse.json(formattedAlerts);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Live alerts - Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 