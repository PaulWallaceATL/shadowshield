import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Severity } from "@prisma/client";
import { queryLLM } from "@/lib/llm";
import { checkDLPRules } from "@/lib/dlp";

type CreateAlertParams = {
  type: string;
  message: string;
  severity: Severity;
  userId: string;
  chatId?: string;
  queryId?: string;
  metadata?: Record<string, any>;
};

type QueryMetadata = {
  temperature?: number;
  isAdmin?: boolean;
  provider?: string;
  model?: string;
  error?: string;
  stack?: string;
};

async function createAlert({
  type,
  message,
  severity,
  userId,
  chatId,
  queryId,
  metadata = {}
}: CreateAlertParams) {
  return prisma.alert.create({
    data: {
      type,
      message,
      severity,
      status: 'OPEN',
      user: { connect: { id: userId } },
      ...(chatId && { chat: { connect: { id: chatId } } }),
      ...(queryId && { query: { connect: { id: queryId } } }),
      metadata
    }
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: "User not found" }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    let requestBody;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      requestBody = text ? JSON.parse(text) : null;
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new NextResponse(
        JSON.stringify({ 
          error: "Invalid request body",
          details: parseError instanceof Error ? parseError.message : 'Failed to parse request body'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!requestBody || typeof requestBody !== 'object') {
      return new NextResponse(
        JSON.stringify({ 
          error: "Invalid request body",
          details: "Request body must be a valid JSON object"
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { content, chatId, provider, model, temperature } = requestBody;

    if (!content || !provider || !model) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Missing required fields",
          details: "content, provider, and model are required"
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check user input for DLP violations
    console.log('Checking user input for DLP violations');
    console.log('User input content:', content);
    const inputDLPResult = await checkDLPRules(content);
    console.log('DLP check result:', {
      blocked: inputDLPResult.blocked,
      flagged: inputDLPResult.flagged,
      reason: inputDLPResult.reason,
      rules: inputDLPResult.rules
    });
    
    if (inputDLPResult.blocked) {
      // Create DLP violation alert
      console.log('DLP violation detected:', inputDLPResult);
      await createAlert({
        type: 'DLP_VIOLATION',
        message: `User input blocked: ${inputDLPResult.reason}`,
        severity: 'HIGH',
        userId: user.id,
        chatId,
        metadata: {
          rules: inputDLPResult.rules,
          content: content.substring(0, 100) // First 100 chars for context
        }
      });

      return new NextResponse(
        JSON.stringify({ 
          error: "Message blocked by DLP rule",
          reason: inputDLPResult.reason,
          ruleName: inputDLPResult.rules[0]?.name || 'Unknown',
          rules: inputDLPResult.rules
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (inputDLPResult.flagged) {
      // Create DLP warning alert
      await createAlert({
        type: 'DLP_WARNING',
        message: `Potentially sensitive user input: ${inputDLPResult.reason}`,
        severity: 'MEDIUM',
        userId: user.id,
        chatId,
        metadata: {
          rules: inputDLPResult.rules,
          content: content.substring(0, 100)
        }
      });
    }

    // Create query record
    let query;
    try {
      // For admin test chat, we need to create or find a special chat
      let adminChatId;
      if (requestBody.isAdmin && !chatId) {
        // Try to find existing admin test chat
        const adminChat = await prisma.chat.findFirst({
          where: {
            userId: user.id,
            isAdminTest: true
          }
        });

        if (adminChat) {
          adminChatId = adminChat.id;
        } else {
          // Create a new admin test chat
          const newAdminChat = await prisma.chat.create({
            data: {
              title: "Admin Test Chat",
              userId: user.id,
              isAdminTest: true,
              messages: []
            }
          });
          adminChatId = newAdminChat.id;
        }
      }

      query = await prisma.query.create({
        data: {
          content,
          status: 'PENDING',
          userId: user.id,
          chatId: requestBody.isAdmin ? adminChatId : chatId,
          provider,
          model,
          metadata: {
            temperature,
            isAdmin: requestBody.isAdmin,
            dlpFlagged: inputDLPResult.flagged,
            dlpRules: inputDLPResult.rules
          }
        },
      });
    } catch (dbError) {
      // Safely handle the case where dbError could be null
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Database error creating query:', errorMessage);
      
      return new NextResponse(
        JSON.stringify({ 
          error: "Failed to create query record", 
          details: errorMessage
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      // Query LLM
      console.log('Querying LLM with:', { content, provider, model, temperature, isAdmin: requestBody.isAdmin });
      const llmResponse = await queryLLM(content, provider, model, requestBody.isAdmin);
      console.log('LLM Response:', llmResponse);
      
      if (!llmResponse || !llmResponse.content) {
        throw new Error('Empty response from LLM');
      }

      // Check LLM response for DLP violations
      console.log('Checking LLM response for DLP violations');
      const responseDLPResult = await checkDLPRules(llmResponse.content);
      
      if (responseDLPResult.blocked) {
        // Create DLP violation alert
        await createAlert({
          type: 'DLP_VIOLATION',
          message: `LLM response blocked: ${responseDLPResult.reason}`,
          severity: 'HIGH',
          userId: user.id,
          chatId,
          queryId: query.id,
          metadata: {
            rules: responseDLPResult.rules,
            content: llmResponse.content.substring(0, 100)
          }
        });

        // Update query with error
        await prisma.query.update({
          where: { id: query.id },
          data: {
            status: 'BLOCKED',
            metadata: {
              temperature,
              isAdmin: requestBody.isAdmin,
              provider: llmResponse.provider,
              model: llmResponse.model,
              dlpBlocked: true,
              dlpReason: responseDLPResult.reason,
              dlpRules: responseDLPResult.rules
            } as QueryMetadata,
          }
        });

        return new NextResponse(
          JSON.stringify({ 
            error: "Response blocked by DLP policy",
            details: responseDLPResult.reason,
            rules: responseDLPResult.rules,
            queryId: query.id
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (responseDLPResult.flagged) {
        // Create DLP warning alert
        await createAlert({
          type: 'DLP_WARNING',
          message: `Potentially sensitive LLM response: ${responseDLPResult.reason}`,
          severity: 'MEDIUM',
          userId: user.id,
          chatId,
          queryId: query.id,
          metadata: {
            rules: responseDLPResult.rules,
            content: llmResponse.content.substring(0, 100)
          }
        });
      }

      // Update query with response
      const updatedQuery = await prisma.query.update({
        where: { id: query.id },
        data: {
          response: llmResponse.content,
          status: 'PROCESSED',
          latency: llmResponse.latency,
          tokens: llmResponse.tokens,
          metadata: {
            temperature,
            isAdmin: requestBody.isAdmin,
            provider: llmResponse.provider,
            model: llmResponse.model,
            dlpFlagged: responseDLPResult.flagged,
            dlpRules: responseDLPResult.rules
          } as QueryMetadata,
        },
      });

      // Return the LLM response
      return new NextResponse(
        JSON.stringify({
          id: updatedQuery.id,
          content: llmResponse.content,
          flagged: responseDLPResult.flagged,
          flagReason: responseDLPResult.reason,
          provider: llmResponse.provider,
          model: llmResponse.model,
          latency: llmResponse.latency,
          tokens: llmResponse.tokens
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (llmError) {
      // Safely handle null llmError
      const errorMessage = llmError instanceof Error ? llmError.message : 'Unknown LLM error';
      const errorStack = llmError instanceof Error ? llmError.stack : undefined;
      
      console.error('LLM Error:', errorMessage);
      
      // Update query status to error
      try {
        await prisma.query.update({
          where: { id: query.id },
          data: {
            status: 'ERROR',
            metadata: {
              temperature,
              isAdmin: requestBody.isAdmin,
              error: errorMessage,
              stack: errorStack
            } as QueryMetadata,
          }
        });
      } catch (updateError) {
        const updateErrorMsg = updateError instanceof Error ? updateError.message : 'Unknown update error';
        console.error('Failed to update query status:', updateErrorMsg);
      }

      // Create an alert for the error
      try {
        await prisma.alert.create({
          data: {
            type: 'LLM_ERROR',
            message: `Error querying ${provider} LLM: ${errorMessage}`,
            severity: 'HIGH',
            status: 'OPEN',
            metadata: {
              provider,
              model,
              error: errorMessage,
              stack: errorStack,
              queryId: query.id
            },
            user: { connect: { id: user.id } }
          }
        });
      } catch (alertError) {
        const alertErrorMsg = alertError instanceof Error ? alertError.message : 'Unknown alert error';
        console.error('Failed to create error alert:', alertErrorMsg);
      }

      // Return a properly formatted error response
      return new NextResponse(
        JSON.stringify({
          error: errorMessage,
          details: errorStack,
          status: 'error',
          queryId: query.id
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    // Safely handle the error object even if it's null
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error in query route:', errorMessage);
    
    return new NextResponse(
      JSON.stringify({ 
        error: errorMessage,
        details: errorStack,
        status: 'error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 