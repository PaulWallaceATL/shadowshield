import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Alert, User, Chat, Prisma } from '@prisma/client';

type MessageWithDates = {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  flagged?: boolean;
  flagReason?: string | null;
};

type AlertResponse = Alert & {
  user: Pick<User, 'name' | 'email'> | null;
  chat: (Chat & {
    messages: MessageWithDates[];
  }) | null;
};

function formatDate(date: Date | string | null): string | null {
  if (!date) return null;
  if (date instanceof Date) return date.toISOString();
  if (typeof date === 'string') return date;
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { id: alertId } = await params;
    if (!alertId) {
      return new NextResponse(
        JSON.stringify({ error: "Alert ID is required" }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        chat: true
      },
    });

    if (!alert) {
      return new NextResponse(
        JSON.stringify({ error: "Alert not found" }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert dates to ISO strings for JSON serialization
    const serializedAlert = {
      ...alert,
      createdAt: formatDate(alert.createdAt),
      updatedAt: formatDate(alert.updatedAt),
      resolvedAt: formatDate(alert.resolvedAt),
      chat: alert.chat ? {
        ...alert.chat,
        messages: [] // We'll fetch messages separately if needed
      } : null,
    };

    return new NextResponse(
      JSON.stringify(serializedAlert),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error fetching alert details:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch alert details" }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { status, notes, resolvedBy } = await request.json();

    const { id } = await params;
    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status,
        ...(notes && { notes }),
        ...(status === 'RESOLVED' && {
          resolvedAt: new Date(),
          resolvedBy,
        }),
      },
    });

    return new NextResponse(
      JSON.stringify(alert),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error updating alert:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update alert" }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 