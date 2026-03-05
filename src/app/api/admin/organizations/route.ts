import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import crypto from 'crypto';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Only super admins can list all organizations
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizations = await prisma.organization.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only super admins can create organizations
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, adminEmail } = await req.json();

    if (!name || !adminEmail) {
      return NextResponse.json({ 
        error: "Organization name and admin email are required" 
      }, { status: 400 });
    }

    // Check if organization with same name exists
    const existingOrg = await prisma.organization.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingOrg) {
      return NextResponse.json({ 
        error: "An organization with this name already exists" 
      }, { status: 400 });
    }

    // Check if admin email is already an org admin in another organization
    const existingAdmin = await prisma.organizationMember.findFirst({
      where: {
        user: {
          email: adminEmail
        },
        role: 'ORG_ADMIN'
      },
      include: {
        organization: true
      }
    });

    if (existingAdmin) {
      return NextResponse.json({ 
        error: `This email is already an admin of organization: ${existingAdmin.organization.name}` 
      }, { status: 400 });
    }

    // Generate slug from name
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug uniqueness
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    
    // Log the temporary password prominently
    console.log('\n==== TEMPORARY PASSWORD ====');
    console.log('Email:', adminEmail);
    console.log('Password:', tempPassword);
    console.log('============================\n');

    // Create organization and admin user in a transaction
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
          settings: {
            apiKeys: {},
            dlpProviders: {}
          }
        }
      });

      // Check if admin user exists
      let adminUser = await tx.user.findUnique({
        where: { email: adminEmail }
      });

      const hashedPassword = await hash(tempPassword, 10);
      
      if (!adminUser) {
        // Create admin user if doesn't exist
        adminUser = await tx.user.create({
          data: {
            email: adminEmail,
            name: name.split(' ')[0], // Use first word of org name as user name
            password: hashedPassword,
            role: 'ORG_ADMIN',
            isActive: true,
            mustChangePassword: true
          }
        });
      } else {
        // Update existing user with new password and role
        adminUser = await tx.user.update({
          where: { id: adminUser.id },
          data: {
            password: hashedPassword,
            role: 'ORG_ADMIN',
            isActive: true,
            mustChangePassword: true
          }
        });
      }

      // Create organization membership
      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: adminUser.id,
          role: 'ORG_ADMIN'
        }
      });

      return { organization, adminUser };
    });

    // Send email with temporary password
    await sendEmail({
      to: adminEmail,
      subject: `Welcome to ${name} on ShadowAI Shield`,
      text: `
        You have been set up as an administrator for ${name} on ShadowAI Shield.
        
        Your temporary login credentials:
        Email: ${adminEmail}
        Password: ${tempPassword}
        
        Please log in and change your password immediately for security purposes.
        
        Login URL: ${process.env.NEXTAUTH_URL}/auth/signin
      `,
      html: `
        <h1>Welcome to ${name} on ShadowAI Shield</h1>
        <p>You have been set up as an administrator for ${name}.</p>
        
        <h2>Your temporary login credentials:</h2>
        <p><strong>Email:</strong> ${adminEmail}</p>
        <p><strong>Password:</strong> ${tempPassword}</p>
        
        <p style="color: red;"><strong>Important:</strong> Please log in and change your password immediately for security purposes.</p>
        
        <p>
          <a href="${process.env.NEXTAUTH_URL}/auth/signin" style="
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 16px 0;
          ">
            Login Now
          </a>
        </p>
      `
    });

    return NextResponse.json({
      message: "Organization created successfully",
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug
      },
      temporaryPassword: tempPassword
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 