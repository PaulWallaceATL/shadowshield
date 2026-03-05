import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type UserRequestWithRelations = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  department: string | null;
  status: string;
  notes: string | null;
  organizationId: string;
  requestedById: string;
  reviewedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  requestedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  reviewedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

// Get user requests
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all requests for both SUPER_ADMIN and ADMIN
    const requests = await prisma.userRequest.findMany({
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format dates for JSON serialization
    const formattedRequests = requests.map((request: { createdAt: Date; updatedAt: Date; [key: string]: any }) => ({
      ...request,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString()
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error("Error fetching user requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create new user request
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, name, role, department, notes } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Create the user request
    const userRequest = await prisma.userRequest.create({
      data: {
        email,
        name,
        role,
        department,
        notes,
        status: 'PENDING',
        requestedById: session.user.id
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Format dates for JSON serialization
    const formattedRequest = {
      ...userRequest,
      createdAt: userRequest.createdAt.toISOString(),
      updatedAt: userRequest.updatedAt.toISOString()
    };

    return NextResponse.json(formattedRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating user request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update user request status (SUPER_ADMIN and ADMIN)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, notes } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Request ID and status are required" }, { status: 400 });
    }

    const request = await prisma.userRequest.update({
      where: { id },
      data: {
        status,
        notes,
        reviewedById: session.user.id,
        updatedAt: new Date()
      }
    });

    // If approved, create the user
    if (status === 'APPROVED') {
      // User creation logic here
      // This would typically involve sending an invitation email
      // and setting up the user account
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("Error updating user request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 