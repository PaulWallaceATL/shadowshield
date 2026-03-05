import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Get user's chats
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if we should include empty chats
    const url = new URL(request.url);
    const includeEmpty = url.searchParams.get('includeEmpty') === 'true';

    // Get all chats for the user
    const chats = await prisma.chat.findMany({
      where: { 
        userId: user.id 
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        provider: true,
        model: true,
        createdAt: true,
        updatedAt: true,
        messages: true
      }
    });

    // Ensure uniqueness of chats by ID - do this early to avoid duplicates
    const uniqueChats = new Map();
    chats.forEach(chat => {
      if (!uniqueChats.has(chat.id)) {
        uniqueChats.set(chat.id, chat);
      }
    });
    
    // Convert to array for further processing
    const uniqueChatsArray = Array.from(uniqueChats.values());

    if (includeEmpty) {
      // Return all chats with consistent structure for UI rendering
      return NextResponse.json(uniqueChatsArray.map(chat => ({
        id: chat.id,
        title: chat.title,
        provider: chat.provider,
        model: chat.model,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messages: Array.isArray(chat.messages) && chat.messages.length > 0 ? 
          chat.messages : [] // Keep the empty array format for consistency
      })));
    } else {
      // Filter out chats with no messages in the application layer
      const nonEmptyChats = uniqueChatsArray.filter(chat => 
        Array.isArray(chat.messages) && chat.messages.length > 0
      );

      // Return only non-empty chats with minimized data
      return NextResponse.json(nonEmptyChats.map(chat => ({
        id: chat.id,
        title: chat.title,
        provider: chat.provider,
        model: chat.model,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      })));
    }
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

// Create new chat
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { title, provider, model } = await request.json();

    // Get ALL chats for the user, explicitly include empty ones
    const userChats = await prisma.chat.findMany({
      where: {
        userId: user.id
      },
      orderBy: { updatedAt: 'desc' }, // Get newest first
      select: {
        id: true,
        title: true,
        messages: true,
        provider: true,
        model: true,
        updatedAt: true
      }
    });

    // More thoroughly check for empty chats - be exhaustive with conditions
    const emptyChats = userChats.filter(chat => {
      // Handle case where messages is null or undefined
      if (!chat.messages) return true;
      
      // Handle empty array
      if (Array.isArray(chat.messages) && chat.messages.length === 0) return true;
      
      // Handle boolean case (from the includeEmpty=true endpoint)
      if (typeof chat.messages === 'boolean') return true;
      
      // Handle empty object case
      if (typeof chat.messages === 'object' && 
          Object.keys(chat.messages).length === 0) return true;
          
      // Otherwise not empty
      return false;
    });
    
    // If there's any existing empty chat, use the most recent one
    if (emptyChats.length > 0) {
      // We already sorted by updatedAt desc in the query
      const existingEmptyChat = emptyChats[0];
      
      console.log("Reusing existing empty chat:", existingEmptyChat.id);
      
      // Update the existing empty chat instead of creating a new one
      const updatedChat = await prisma.chat.update({
        where: { id: existingEmptyChat.id },
        data: {
          provider,
          model,
          title: title || existingEmptyChat.title,
          updatedAt: new Date()
        }
      });
      
      return NextResponse.json(updatedChat);
    }

    // Only create a new chat if no empty chats exist
    console.log("Creating new chat - no empty chats found");
    const chat = await prisma.chat.create({
      data: {
        title,
        userId: user.id,
        provider,
        model,
        messages: []
      }
    });

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}

// Update chat
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, messages, title } = await request.json();

    const chat = await prisma.chat.update({
      where: { id },
      data: {
        messages,
        title,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error updating chat:", error);
    return NextResponse.json(
      { error: "Failed to update chat" },
      { status: 500 }
    );
  }
} 