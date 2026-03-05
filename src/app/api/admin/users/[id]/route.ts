import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        chats: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            provider: true,
            model: true,
            messages: true,
            createdAt: true
          }
        },
        alerts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format the response
    const formattedUser = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      chats: user.chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        provider: chat.provider,
        model: chat.model,
        createdAt: chat.createdAt.toISOString(),
        messageCount: Array.isArray(chat.messages) ? chat.messages.length : 0
      })),
      alerts: user.alerts.map(alert => ({
        ...alert,
        createdAt: alert.createdAt.toISOString(),
        updatedAt: alert.updatedAt.toISOString(),
        resolvedAt: alert.resolvedAt?.toISOString() || null
      }))
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('Error in user details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { role, isActive, department } = await req.json();

    // Validate role
    const validRoles = ['USER', 'ADMIN', 'SUPER_ADMIN'] as const;
    if (role && !validRoles.includes(role as typeof validRoles[number])) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid role specified" }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Update user
    const { id } = await params;
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role: role as Role }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(department && { department }),
        updatedAt: new Date()
      }
    });

    return new NextResponse(
      JSON.stringify(user),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return new NextResponse(
        JSON.stringify({
          error: "Database error",
          details: error.message,
          code: error.code
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new NextResponse(
      JSON.stringify({
        error: "Error updating user",
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 