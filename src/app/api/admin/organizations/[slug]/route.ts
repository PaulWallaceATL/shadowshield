import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";

type OrganizationMember = {
  user: {
    id: string;
    organizations: any[];
  };
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only super admins can access organization details
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Organization slug is required" }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only super admins can delete organizations
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Organization slug is required" }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              include: {
                organizations: true
              }
            }
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Delete the organization and its users in a transaction
    await prisma.$transaction(async (tx: PrismaClient) => {
      // Get users who only belong to this organization
      const usersToDelete = organization.members
        .filter((member: OrganizationMember) => member.user.organizations.length === 1)
        .map((member: OrganizationMember) => member.user.id);

      // Delete organization members
      await tx.organizationMember.deleteMany({
        where: { organizationId: organization.id }
      });

      // Delete users who only belonged to this organization
      if (usersToDelete.length > 0) {
        await tx.user.deleteMany({
          where: { id: { in: usersToDelete } }
        });
      }

      // Delete the organization
      await tx.organization.delete({
        where: { id: organization.id }
      });
    });

    return NextResponse.json({ message: "Organization and associated users deleted successfully" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 