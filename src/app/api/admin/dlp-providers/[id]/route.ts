import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

// PUT /api/admin/dlp-providers/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    if (apiKey) {
      updateData.apiKey = await encrypt(apiKey);
    }

    const updatedProvider = await prisma.dLPProviderConfig.update({
      where: { id },
      data: updateData
    });

    const { apiKey: _masked, ...providerData } = updatedProvider;
    return NextResponse.json(providerData);
  } catch (error) {
    console.error("Error updating DLP provider:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/dlp-providers/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.dLPProviderConfig.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting DLP provider:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
