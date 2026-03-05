import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { id: chatId } = await params;
    
    if (!chatId) {
      return new NextResponse(
        JSON.stringify({ error: "Chat ID is required" }),
        { status: 400 }
      );
    }

    const chat = await prisma.chat.findUnique({
      where: { 
        id: chatId,
        userId: session.user.id // Ensure user can only access their own chats
      },
      include: {
        user: {
          select: {
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
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error fetching chat details:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch chat details" }),
      { status: 500 }
    );
  }
}

// Delete a specific chat
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { id: chatId } = await params;
    
    if (!chatId) {
      return new NextResponse(
        JSON.stringify({ error: "Chat ID is required" }),
        { status: 400 }
      );
    }

    // Delete the chat and ensure it belongs to the current user
    const deletedChat = await prisma.chat.delete({
      where: { 
        id: chatId,
        userId: session.user.id // Ensure user can only delete their own chats
      },
    });

    return new NextResponse(
      JSON.stringify({ message: "Chat deleted successfully", id: chatId }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting chat:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to delete chat" }),
      { status: 500 }
    );
  }
} 