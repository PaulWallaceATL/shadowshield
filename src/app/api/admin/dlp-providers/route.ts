import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

// GET /api/admin/dlp-providers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
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
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
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
