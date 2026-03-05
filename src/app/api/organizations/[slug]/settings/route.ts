import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization and check if user is a member
    const organization = await prisma.organization.findUnique({
      where: { slug: params.slug },
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

    // Only return non-sensitive settings
    const { settings } = organization;
    const safeSettings = {
      ...settings,
      apiKeys: Object.keys(settings?.apiKeys || {}).reduce((acc, key) => ({
        ...acc,
        [key]: '••••••••'
      }), {})
    };

    return NextResponse.json({ settings: safeSettings });
  } catch (error) {
    console.error("Error fetching organization settings:", error);
    return NextResponse.json(
      { error: "Error fetching organization settings" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization and check if user is an admin/owner
    const organization = await prisma.organization.findUnique({
      where: { slug: params.slug },
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

    const { settings } = await req.json();

    // Encrypt API keys before storing
    const encryptedSettings = {
      ...settings,
      apiKeys: await Object.entries(settings.apiKeys || {}).reduce(async (accPromise, [key, value]) => {
        const acc = await accPromise;
        if (value && value !== '••••••••') {
          acc[key] = await encrypt(value as string);
        } else if (organization.settings?.apiKeys?.[key]) {
          // Keep existing encrypted value if no new value provided
          acc[key] = organization.settings.apiKeys[key];
        }
        return acc;
      }, Promise.resolve({} as Record<string, string>))
    };

    // Update organization settings
    const updatedOrg = await prisma.organization.update({
      where: { slug: params.slug },
      data: {
        settings: encryptedSettings
      }
    });

    return NextResponse.json({
      message: "Settings updated successfully"
    });
  } catch (error) {
    console.error("Error updating organization settings:", error);
    return NextResponse.json(
      { error: "Error updating organization settings" },
      { status: 500 }
    );
  }
} 