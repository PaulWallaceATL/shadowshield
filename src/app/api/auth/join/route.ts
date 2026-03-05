import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { token, password, name } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 400 }
      );
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: "Invitation has already been used" },
        { status: 400 }
      );
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: invite.email }
    });

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create or update user and create organization membership in a transaction
    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      if (user) {
        // Update existing user
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            name: name || user.name,
            emailVerified: true
          }
        });
      } else {
        // Create new user
        user = await tx.user.create({
          data: {
            email: invite.email,
            name,
            password: hashedPassword,
            emailVerified: true
          }
        });
      }

      // Create organization membership
      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: invite.organizationId,
          role: invite.role
        }
      });

      // Mark invitation as used
      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() }
      });

      return { user, organization: invite.organization };
    });

    return NextResponse.json({
      message: "Successfully joined organization",
      organizationSlug: result.organization.slug
    });
  } catch (error) {
    console.error("Error joining organization:", error);
    return NextResponse.json(
      { error: "Error joining organization" },
      { status: 500 }
    );
  }
} 