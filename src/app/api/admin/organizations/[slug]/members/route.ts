import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sendEmail, generateInviteEmail } from "@/lib/email";
import crypto from 'crypto';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, name, department, role } = await req.json();

    if (!email || !role || !name) {
      return NextResponse.json({ 
        error: "Email, name, and role are required" 
      }, { status: 400 });
    }

    const { slug } = await params;

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { slug }
    });

    if (!organization) {
      return NextResponse.json({ 
        error: "Organization not found" 
      }, { status: 404 });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    });

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await hash(tempPassword, 10);

    // Log the temporary password prominently
    console.log('\n==== TEMPORARY PASSWORD ====');
    console.log('Email:', email);
    console.log('Password:', tempPassword);
    console.log('============================\n');

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          department,
          password: hashedPassword,
          role: 'USER',
          isActive: true,
          mustChangePassword: true
        }
      });
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          department,
          password: hashedPassword,
          mustChangePassword: true
        }
      });
    }

    // Add user to organization
    const member = await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true
          }
        }
      }
    });

    return NextResponse.json({
      ...member,
      temporaryPassword: tempPassword
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

function generateTemporaryPassword(): string {
  const length = 12;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await req.json();

    if (!role) {
      return NextResponse.json({ 
        error: "Role is required" 
      }, { status: 400 });
    }

    const { slug, memberId } = await params;

    // Update member role
    const member = await prisma.organizationMember.update({
      where: {
        id: memberId,
        organization: { slug }
      },
      data: { role },
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
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, memberId } = await params;

    // Delete member
    await prisma.organizationMember.delete({
      where: {
        id: memberId,
        organization: { slug }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 