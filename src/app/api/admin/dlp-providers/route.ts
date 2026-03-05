import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

// GET /api/admin/dlp-providers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SECURITY_OFFICER'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providers = await prisma.dLPProviderConfig.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        name: true,
        endpoint: true,
        isActive: true,
        lastUsed: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
        options: true
      }
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error("Error fetching DLP providers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/dlp-providers
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SECURITY_OFFICER'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, name, apiKey, endpoint, isActive, options } = await req.json();

    if (!provider || !name || !apiKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Encrypt API key before storing
    const encryptedApiKey = await encrypt(apiKey);

    const newProvider = await prisma.dLPProviderConfig.create({
      data: {
        provider,
        name,
        apiKey: encryptedApiKey,
        endpoint,
        isActive,
        options: options || {}
      }
    });

    // Don't return the API key in the response
    const { apiKey: _, ...providerData } = newProvider;
    return NextResponse.json(providerData, { status: 201 });
  } catch (error) {
    console.error("Error creating DLP provider:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/dlp-providers/[id]
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SECURITY_OFFICER'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, name, apiKey, endpoint, isActive, options } = await req.json();

    if (!provider || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updateData: any = {
      provider,
      name,
      endpoint,
      isActive,
      options: options || {}
    };

    // Only update API key if provided
    if (apiKey) {
      updateData.apiKey = await encrypt(apiKey);
    }

    const updatedProvider = await prisma.dLPProviderConfig.update({
      where: { id: params.id },
      data: updateData
    });

    // Don't return the API key in the response
    const { apiKey: _, ...providerData } = updatedProvider;
    return NextResponse.json(providerData);
  } catch (error) {
    console.error("Error updating DLP provider:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/dlp-providers/[id]
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SECURITY_OFFICER'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.dLPProviderConfig.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting DLP provider:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 