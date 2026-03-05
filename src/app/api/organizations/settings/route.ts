import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';

// Default settings structure
const defaultSettings = {
  llmProvider: {
    provider: 'ANTHROPIC' as const,
    defaultModel: 'claude-3-opus-20240229',
    maxTokens: 4096,
    temperature: 0.7
  },
  dlp: {
    enabled: true,
    autoBlock: true,
    sensitivityThreshold: 0.8
  },
  notifications: {
    email: true,
    slack: false,
    teams: false
  },
  apiKeys: {
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    openai: '',
    google: ''
  }
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    if (!orgMember) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get organization settings
    const settings = await prisma.organization.findUnique({
      where: { id: orgMember.organizationId },
      select: {
        settings: true
      }
    });

    if (!settings?.settings) {
      // If no settings exist, return default settings
      return NextResponse.json(defaultSettings);
    }

    // Ensure all required fields exist by merging with default settings
    const mergedSettings = {
      ...defaultSettings,
      ...settings.settings,
      // Ensure nested objects are properly merged
      llmProvider: {
        ...defaultSettings.llmProvider,
        ...(settings.settings.llmProvider || {})
      },
      dlp: {
        ...defaultSettings.dlp,
        ...(settings.settings.dlp || {})
      },
      notifications: {
        ...defaultSettings.notifications,
        ...(settings.settings.notifications || {})
      }
    };

    // Decrypt API keys if they exist
    const decryptedSettings = {
      ...mergedSettings,
      apiKeys: {
        anthropic: settings.settings.apiKeys?.anthropic ? await decrypt(settings.settings.apiKeys.anthropic) : defaultSettings.apiKeys.anthropic,
        openai: settings.settings.apiKeys?.openai ? await decrypt(settings.settings.apiKeys.openai) : defaultSettings.apiKeys.openai,
        google: settings.settings.apiKeys?.google ? await decrypt(settings.settings.apiKeys.google) : defaultSettings.apiKeys.google
      }
    };

    return NextResponse.json(decryptedSettings);
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await request.json();

    // Get the organization ID for the current user
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

    // Ensure all required fields exist by merging with default settings
    const mergedSettings = {
      ...defaultSettings,
      ...settings,
      // Ensure nested objects are properly merged
      llmProvider: {
        ...defaultSettings.llmProvider,
        ...(settings.llmProvider || {})
      },
      dlp: {
        ...defaultSettings.dlp,
        ...(settings.dlp || {})
      },
      notifications: {
        ...defaultSettings.notifications,
        ...(settings.notifications || {})
      }
    };

    // Encrypt API keys before saving
    const encryptedSettings = {
      ...mergedSettings,
      apiKeys: {
        anthropic: settings.apiKeys?.anthropic ? await encrypt(settings.apiKeys.anthropic) : null,
        openai: settings.apiKeys?.openai ? await encrypt(settings.apiKeys.openai) : null,
        google: settings.apiKeys?.google ? await encrypt(settings.apiKeys.google) : null
      }
    };

    // Update organization settings
    await prisma.organization.update({
      where: { id: orgMember.organizationId },
      data: {
        settings: encryptedSettings
      }
    });

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 