import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN', 'SECURITY_OFFICER'].includes(session.user.role)) {
      console.error("Unauthorized access attempt:", session?.user);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        chats: {
          include: {
            messages: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        alerts: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate analytics
    const totalChats = user.chats.length;
    const totalMessages = user.chats.reduce(
      (acc, chat) => acc + chat.messages.length,
      0
    );
    const totalAlerts = user.alerts.length;
    
    // Get alert categories
    const alertCategories = user.alerts.reduce((acc, alert) => {
      const category = alert.type || 'UNKNOWN';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get chat activity by date
    const chatsByDate = user.chats.reduce((acc, chat) => {
      const date = chat.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get most used models
    const modelUsage = user.chats.reduce((acc, chat) => {
      const model = chat.model || 'UNKNOWN';
      acc[model] = (acc[model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Prepare data for AI analysis
    const userData = {
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      createdAt: user.createdAt,
      totalChats,
      totalMessages,
      totalAlerts,
      alertCategories,
      chatsByDate,
      modelUsage,
      recentAlerts: user.alerts.slice(0, 5).map(alert => ({
        type: alert.type,
        message: alert.message,
        createdAt: alert.createdAt,
      })),
      recentChats: user.chats.slice(0, 5).map(chat => ({
        title: chat.title,
        model: chat.model,
        messageCount: chat.messages.length,
        createdAt: chat.createdAt,
      })),
    };

    // Generate AI report
    const aiReport = await generateAIReport(userData);

    return NextResponse.json(aiReport);
  } catch (error) {
    console.error("Error generating user report:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate user report" },
      { status: 500 }
    );
  }
}

async function generateAIReport(userData: any) {
  try {
    const prompt = `
      Generate a comprehensive user activity report based on the following data:
      
      User: ${userData.name} (${userData.email})
      Role: ${userData.role}
      Department: ${userData.department}
      Account created: ${new Date(userData.createdAt).toLocaleDateString()}
      
      Activity Statistics:
      - Total chats: ${userData.totalChats}
      - Total messages: ${userData.totalMessages}
      - Total alerts: ${userData.totalAlerts}
      
      Alert Categories:
      ${Object.entries(userData.alertCategories)
        .map(([category, count]) => `- ${category}: ${count}`)
        .join('\n')}
      
      Chat Activity by Date:
      ${Object.entries(userData.chatsByDate)
        .map(([date, count]) => `- ${date}: ${count} chats`)
        .join('\n')}
      
      Model Usage:
      ${Object.entries(userData.modelUsage)
        .map(([model, count]) => `- ${model}: ${count} chats`)
        .join('\n')}
      
      Recent Alerts:
      ${userData.recentAlerts
        .map(
          (alert: any) =>
            `- ${alert.type}: ${alert.message} (${new Date(
              alert.createdAt
            ).toLocaleDateString()})`
        )
        .join('\n')}
      
      Recent Chats:
      ${userData.recentChats
        .map(
          (chat: any) =>
            `- "${chat.title}" using ${chat.model} with ${
              chat.messageCount
            } messages (${new Date(chat.createdAt).toLocaleDateString()})`
        )
        .join('\n')}
      
      Please provide:
      1. A summary of the user's activity and behavior
      2. A breakdown of their usage patterns
      3. Any security insights based on alerts
      4. Recommendations for the user
      
      Format the response as a JSON object with the following structure:
      {
        "summary": "Overall summary of user activity",
        "activityBreakdown": ["point 1", "point 2", ...],
        "usagePatterns": "Analysis of usage patterns",
        "securityInsights": "Security analysis based on alerts",
        "recommendations": ["recommendation 1", "recommendation 2", ...]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an analytics expert that generates insightful user reports based on activity data.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const reportContent = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      summary: reportContent.summary || "No summary available",
      activityBreakdown: reportContent.activityBreakdown || [],
      usagePatterns: reportContent.usagePatterns || "No usage patterns available",
      securityInsights: reportContent.securityInsights || "No security insights available",
      recommendations: reportContent.recommendations || [],
      generatedAt: new Date().toISOString(),
      userData: {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
      }
    };
  } catch (error) {
    console.error("Error generating AI report:", error);
    return {
      summary: "Failed to generate AI report. Please try again later.",
      activityBreakdown: [],
      usagePatterns: "Not available",
      securityInsights: "Not available",
      recommendations: ["Try generating the report again"],
      generatedAt: new Date().toISOString(),
    };
  }
} 