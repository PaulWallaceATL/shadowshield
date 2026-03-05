import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Define interface for message structure
interface ChatMessage {
  role: string;
  provider?: string;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      console.error("Unauthorized access attempt:", session?.user);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const provider = searchParams.get('provider') || '';
    const model = searchParams.get('model') || '';
    const limit = 8;
    const offset = (page - 1) * limit;

    // Build where clause based on filters
    const where: Prisma.ChatWhereInput = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { user: { 
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ];
    }

    if (provider) {
      where.provider = provider;
    }

    if (model) {
      where.model = model;
    }

    // Get total count for pagination
    const total = await prisma.chat.count({ where });

    // Get chats with pagination
    const chats = await prisma.chat.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        provider: true,
        model: true,
        createdAt: true,
        messages: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Format the response
    const formattedChats = chats.map(chat => ({
      id: chat.id,
      title: chat.title,
      provider: chat.provider,
      model: chat.model,
      createdAt: chat.createdAt.toISOString(),
      messageCount: Array.isArray(chat.messages) ? chat.messages.length : 0,
      user: {
        name: chat.user.name,
        email: chat.user.email
      },
      // Include only necessary message fields for provider/model display
      messages: Array.isArray(chat.messages) 
        ? chat.messages
            .filter((m: any) => m && m.role === 'assistant' && m.provider)
            .map((m: any) => ({
              role: m.role,
              provider: m.provider
            }))
        : []
    }));

    return NextResponse.json({
      chats: formattedChats,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
} 