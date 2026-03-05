import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's start timestamp
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all quick stats in parallel
    const [
      totalUsers,
      activeChats,
      pendingAlerts,
      dlpViolationsToday
    ] = await Promise.all([
      // Total active users
      prisma.user.count({
        where: { isActive: true }
      }),

      // Active chats (created in the last 24 hours)
      prisma.chat.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Pending alerts
      prisma.alert.count({
        where: {
          status: 'OPEN'
        }
      }),

      // DLP violations today
      prisma.alert.count({
        where: {
          type: 'DLP_VIOLATION',
          createdAt: {
            gte: today
          }
        }
      })
    ]);

    return NextResponse.json({
      totalUsers,
      activeChats,
      pendingAlerts,
      dlpViolationsToday
    });
  } catch (error) {
    console.error("Error fetching quick stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch quick stats" },
      { status: 500 }
    );
  }
} 