import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { IKIGAI_PROMPT } from "@/lib/constants";
import { fetchWithErrorHandlers } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { messages = [], isIkigaiChat, userId } = await req.json();

    if (!userId) {
      return new NextResponse("Missing userId in request body", {
        status: 400,
      });
    }

    // Maximum token limit per mentee
    const MAX_TOKENS_PER_MENTEE = 15000;

    const getIkigaiBalance = async (id: string) => {
      try {
        const response = await fetchWithErrorHandlers(
          `${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai-balance?userId=${id}`
        );
        const data = await response.json();
        return data.ikigai_balance;
      } catch (error) {
        console.error("Error fetching ikigai balance:", error);
        return 0; // Default to 0 if there's an error
      }
    };

    const updateIkigaiBalance = async (id: string, newBalance: number) => {
      try {
        await fetchWithErrorHandlers(
          `${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/ikigai-balance`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: id, amount: newBalance }),
          }
        );
      } catch (error) {
        console.error("Error updating ikigai balance:", error);
      }
    };

    const model = openai.chat("gpt-5");

    const processedMessages = isIkigaiChat
      ? [{ role: "system", content: IKIGAI_PROMPT }, ...messages]
      : messages;

    if (processedMessages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided." },
        { status: 400 }
      );
    }

    const currentIkigaiBalance = await getIkigaiBalance(userId);
    if (currentIkigaiBalance < 0) {
      // Check if balance is already negative
      return NextResponse.json(
        { error: "Token limit exceeded for this mentee." },
        { status: 429 }
      );
    }

    const result = streamText({
      model: model,
      messages: processedMessages,
    });

    const usage = await result.usage;
    if (usage) {
      console.log("Token Usage:");
      console.log(`  Input Tokens: ${usage.inputTokens}`);
      console.log(`  Output Tokens: ${usage.outputTokens}`);
      console.log(`  Total Tokens: ${usage.totalTokens}`);
      const newBalance = currentIkigaiBalance - (usage?.totalTokens || 0);
      await updateIkigaiBalance(userId, newBalance);
    }

    // Add token usage headers
    const streamResponse = result.toUIMessageStreamResponse();
    if (usage) {
      streamResponse.headers.set(
        "X-Prompt-Tokens",
        usage.inputTokens?.toString() || "0"
      );
      streamResponse.headers.set(
        "X-Completion-Tokens",
        usage.outputTokens?.toString() || "0"
      );
      streamResponse.headers.set(
        "X-Total-Tokens",
        usage.totalTokens?.toString() || "0"
      );
    }

    return streamResponse;
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
