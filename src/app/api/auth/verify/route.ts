import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findUnique({
      where: { verifyToken: token },
      include: {
        organizations: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null // Clear the token after use
      }
    });

    // Redirect to the organization's dashboard
    const organizationSlug = user.organizations[0]?.organization.slug;
    if (organizationSlug) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/organizations/${organizationSlug}/dashboard`
      );
    }

    // If no organization found, redirect to home
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/`);
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Error verifying email" },
      { status: 500 }
    );
  }
} 