import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10);

    // Update user's password and reset mustChangePassword flag
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false
      }
    });
    
    // Log information about the password change
    console.log(`Password changed for user ${updatedUser.email}`);
    console.log(`mustChangePassword set to ${updatedUser.mustChangePassword}`);
    
    // Force deletion of all sessions for this user to ensure they get a fresh session
    // This is important to pick up the mustChangePassword=false flag
    try {
      // Delete all sessions for this user
      await prisma.session.deleteMany({
        where: { userId: session.user.id }
      });
      console.log(`Deleted all sessions for user ${updatedUser.email}`);
    } catch (error) {
      console.error("Error deleting sessions:", error);
      // Continue anyway, the main password change was successful
    }

    // Return updated user data (excluding sensitive fields)
    return NextResponse.json({
      message: "Password updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        department: updatedUser.department,
        mustChangePassword: false
      }
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Error changing password" },
      { status: 500 }
    );
  }
} 