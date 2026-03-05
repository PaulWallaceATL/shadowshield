import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { hash } from 'bcryptjs';
import { generatePassword } from '@/lib/utils';

type FormattedUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  lastActive: string;
  organization?: {
    id: string;
    name: string;
  };
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: {
        role: {
          not: 'SUPER_ADMIN' // Exclude super admin users from the list
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Only super admins can create users" }, { status: 401 });
    }

    const body = await req.json();
    const { email, name, role, department } = body;

    // Validate required fields
    if (!email?.trim() || !name?.trim() || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Generate temporary password
    const temporaryPassword = generatePassword();
    const hashedPassword = await hash(temporaryPassword, 10);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        name: name.trim(),
        password: hashedPassword,
        role,
        department: department?.trim(),
        isActive: true,
        mustChangePassword: true
      }
    });

    // Create default user settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        settings: JSON.stringify({
          llmProvider: 'ANTHROPIC',
          model: 'claude-3-opus-20240229',
          temperature: 0.7,
          maxTokens: 4096,
          notifications: {
            email: true,
            slack: false,
            teams: false
          }
        })
      }
    });

    return NextResponse.json({ 
      message: "User created successfully",
      temporaryPassword
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Check if user exists and get their role
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        role: true,
        isActive: true
      }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deactivating super admin users
    if (existingUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Super admin users cannot be deactivated" }, { status: 403 });
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: isActive ?? existingUser.isActive,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can delete users' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists with more details
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true,
        role: true,
        email: true,
        isActive: true
      }
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Never allow deletion of SUPER_ADMIN users
    if (userToDelete.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super admin users cannot be deleted' }, { status: 403 });
    }

    // Delete all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete alerts where user is the resolver
      await tx.alert.updateMany({
        where: { resolvedBy: id },
        data: { resolvedBy: null }
      });

      // Delete alerts related to user
      await tx.alert.deleteMany({
        where: {
          OR: [
            { userId: id },
            {
              metadata: {
                path: ['userId'],
                equals: id
              }
            }
          ]
        }
      });

      // Delete user settings
      await tx.userSettings.deleteMany({
        where: { userId: id }
      });

      // Delete user's chats
      await tx.chat.deleteMany({
        where: { userId: id }
      });

      // Delete user's queries
      await tx.query.deleteMany({
        where: { userId: id }
      });

      // Delete user's API keys
      await tx.aPIKey.deleteMany({
        where: { createdById: id }
      });

      // Delete user's sessions
      await tx.session.deleteMany({
        where: { userId: id }
      });

      // Delete user's accounts
      await tx.account.deleteMany({
        where: { userId: id }
      });

      // Delete user requests
      await tx.userRequest.deleteMany({
        where: {
          OR: [
            { requestedById: id },
            { reviewedById: id }
          ]
        }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id }
      });
    });

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully',
      deletedUser: userToDelete.email 
    });

  } catch (error) {
    console.error('Error in DELETE handler:', error);
    
    // Ensure we always return a valid object with detailed error information
    const errorResponse = {
      success: false,
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      code: error instanceof Error && 'code' in error ? (error as any).code : undefined
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
} 