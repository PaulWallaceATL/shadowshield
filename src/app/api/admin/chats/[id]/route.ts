import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { id } = await params;
    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!chat) {
      return new NextResponse(
        JSON.stringify({ error: "Chat not found" }),
        { status: 404 }
      );
    }

    // Format the messages
    const messages = (chat.messages as any[]).map(msg => ({
      ...msg,
      createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date()
    }));

    const response = {
      ...chat,
      messages,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString()
    };

    return new NextResponse(
      JSON.stringify(response),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching chat details:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch chat details" }),
      { status: 500 }
    );
  }
} 