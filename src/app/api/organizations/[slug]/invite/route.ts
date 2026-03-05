import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateInviteEmail } from "@/lib/email";
import crypto from 'crypto';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Get organization and check if user is an admin/owner
    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: session.user.id },
          select: { role: true }
        }
      }
    });

    if (!organization || organization.members.length === 0 || 
        !['OWNER', 'ADMIN'].includes(organization.members[0].role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, role = 'USER' } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organization: { slug },
        user: { email }
      }
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 400 }
      );
    }

    // Check for existing invite
    const existingInvite = await prisma.organizationInvite.findFirst({
      where: {
        organization: { slug },
        email,
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An active invitation already exists for this email" },
        { status: 400 }
      );
    }

    // Generate invite token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invite
    const invite = await prisma.organizationInvite.create({
      data: {
        email,
        token,
        role,
        organizationId: organization.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Send invitation email
    await sendEmail(
      generateInviteEmail(
        email,
        organization.name,
        session.user.name || 'An administrator',
        token
      )
    );

    return NextResponse.json({
      message: "Invitation sent successfully"
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Error sending invitation" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Get organization and check if user is a member
    const organization = await prisma.organization.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: session.user.id },
          select: { role: true }
        }
      }
    });

    if (!organization || organization.members.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active invites
    const invites = await prisma.organizationInvite.findMany({
      where: {
        organizationId: organization.id,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Error fetching invites" },
      { status: 500 }
    );
  }
} 