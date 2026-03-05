import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

type Role = 'USER' | 'ADMIN' | 'ORG_ADMIN' | 'SUPER_ADMIN';

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

export async function POST(request: Request) {
  try {
    console.log('POST /api/users/request - Starting request handling');
    
    const session = await getServerSession(authOptions);
    console.log('Session data:', {
      authenticated: !!session,
      userRole: session?.user?.role,
      userId: session?.user?.id,
      email: session?.user?.email
    });
    
    if (!session?.user) {
      console.log('Authentication failed - no session user');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has appropriate role
    if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role || '')) {
      console.log('Authorization failed - invalid role:', session.user.role);
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);

    const { email, name, department = '', role, justification } = body;

    // Validate required fields
    if (!email || !name || !role) {
      console.log('Missing required fields:', { email, name, role });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['USER', 'ADMIN', 'ORG_ADMIN'].includes(role)) {
      console.log('Invalid role specified:', role);
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Get the organization ID for the current user
    const orgMember = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        role: 'ORG_ADMIN'
      },
      include: {
        organization: true
      }
    });

    // For super admin direct user creation
    if (session.user.role === 'SUPER_ADMIN') {
      try {
        const tempPassword = generateTemporaryPassword();
        console.log('\n==== TEMPORARY PASSWORD ====');
        console.log('Email:', email);
        console.log('Password:', tempPassword);
        console.log('============================\n');

        // Create the user with temporary password
        const hashedPassword = await hash(tempPassword, 10);
        
        const user = await prisma.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
            role: role as Role,
            department,
            isActive: true,
            mustChangePassword: true
          }
        });

        // If organization is specified, add user to it
        if (orgMember?.organization?.id) {
          await prisma.organizationMember.create({
            data: {
              organizationId: orgMember.organization.id,
              userId: user.id,
              role: role as Role
            }
          });
        }

        return NextResponse.json(
          { 
            message: 'User created successfully',
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            },
            temporaryPassword: tempPassword
          },
          { status: 201 }
        );
      } catch (error: any) {
        console.error('Error creating user:', error);
        
        if (error.code === 'P2002') {
          return NextResponse.json(
            { error: 'A user with this email already exists' },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
    }

    // Regular org admin user request flow
    if (!orgMember?.organization?.id) {
      console.error('Organization not found for user request');
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    if (!justification) {
      return NextResponse.json(
        { error: 'Justification is required for user requests' },
        { status: 400 }
      );
    }

    try {
      // Create the user request
      const userRequest = await prisma.userRequest.create({
        data: {
          email,
          name,
          department,
          role: role as Role,
          status: 'PENDING',
          notes: justification,
          organizationId: orgMember.organization.id,
          requestedById: session.user.id
        }
      });

      return NextResponse.json(
        { 
          message: 'User request created successfully',
          request: userRequest 
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Error creating user request:', error);
      
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A request for this email already exists in your organization' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create user request' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let userRequests;
    
    if (session.user.role === 'SUPER_ADMIN') {
      // Super admin can see all requests
      userRequests = await prisma.userRequest.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      // Org admin can only see requests for their organization
      const orgMember = await prisma.organizationMember.findFirst({
        where: {
          userId: session.user.id,
          role: 'ORG_ADMIN'
        }
      });

      if (!orgMember) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      userRequests = await prisma.userRequest.findMany({
        where: {
          organizationId: orgMember.organizationId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    return NextResponse.json(userRequests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 