import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { DLPType, DLPAction, Severity } from "@prisma/client";

// Get all DLP rules
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await prisma.dLPRule.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching DLP rules:", error);
    return NextResponse.json({ error: "Failed to fetch DLP rules" }, { status: 500 });
  }
}

// Create new DLP rule
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, pattern, description, type, severity, action, isActive } = body;

    // Validate required fields
    if (!name?.trim() || !pattern?.trim() || !type || !severity || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate type
    if (!Object.values(DLPType).includes(type)) {
      return NextResponse.json({ error: "Invalid rule type" }, { status: 400 });
    }

    // Validate severity
    if (!Object.values(Severity).includes(severity)) {
      return NextResponse.json({ error: "Invalid severity level" }, { status: 400 });
    }

    // Validate action
    if (!Object.values(DLPAction).includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Validate pattern is a valid regex
    try {
      new RegExp(pattern);
    } catch (error) {
      return NextResponse.json({ error: "Invalid regex pattern" }, { status: 400 });
    }

    const rule = await prisma.dLPRule.create({
      data: {
        name: name.trim(),
        pattern: pattern.trim(),
        description: description?.trim(),
        type,
        severity,
        action,
        isActive: isActive ?? true
      }
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating DLP rule:", error);
    return NextResponse.json({ error: "Failed to create DLP rule" }, { status: 500 });
  }
}

// Update DLP rule
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, pattern, description, severity, isActive } = await req.json();

    if (!id || !name || !pattern || !severity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate pattern is a valid regex
    try {
      new RegExp(pattern);
    } catch (error) {
      return NextResponse.json({ error: "Invalid regex pattern" }, { status: 400 });
    }

    const rule = await prisma.dLPRule.update({
      where: { id },
      data: {
        name,
        pattern,
        description,
        severity,
        isActive
      }
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error updating DLP rule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete DLP rule
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Missing rule ID" }, { status: 400 });
    }

    // Check if rule exists
    const existingRule = await prisma.dLPRule.findUnique({
      where: { id }
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    await prisma.dLPRule.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting DLP rule:", error);
    return NextResponse.json({ error: "Failed to delete DLP rule" }, { status: 500 });
  }
} 