import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, name, department, role } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create new user - always set role to USER for security
    // Admin and Security Officer roles should be assigned through admin interface
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        department,
        role: "USER", // Force USER role for security
        isActive: true,
        lastLogin: new Date(),
      },
    });

    // Create default user settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        settings: JSON.stringify({
          llmProvider: 'ANTHROPIC',
          model: 'claude-3-opus-20240229',
          temperature: 0.7,
          maxTokens: 4096,
          notifications: {
            email: true,
            slack: false,
            teams: false
          }
        })
      }
    });

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Error creating user" },
      { status: 500 }
    );
  }
} 