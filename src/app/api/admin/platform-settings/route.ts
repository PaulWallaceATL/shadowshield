import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Mock platform settings for development
const mockPlatformSettings = {
  platform: {
    name: 'ShadowAI Shield',
    logo: '/shield-icon.svg',
    supportEmail: 'support@shadowai.com'
  },
  security: {
    minPasswordLength: 12,
    requireMFA: true,
    sessionTimeout: 8,
    maxLoginAttempts: 5
  },
  logging: {
    retentionDays: 90,
    detailedLogs: true,
    exportEnabled: true
  },
  backup: {
    enabled: true,
    frequency: 'DAILY',
    retentionPeriod: 30
  },
  maintenance: {
    enabled: false,
    startTime: '02:00',
    duration: 2
  }
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get platform settings from database
    const settings = await prisma.systemSettings.findFirst();

    if (!settings?.settings) {
      // If no settings exist, return mock settings
      return NextResponse.json(mockPlatformSettings);
    }

    return NextResponse.json(settings.settings);
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await request.json();

    // Validate settings
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    // Update platform settings
    await prisma.systemSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        settings
      },
      update: {
        settings
      }
    });

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating platform settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 