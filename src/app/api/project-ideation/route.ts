import { NextResponse } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function parseProjectIdeaResponse(
  text: string
): { problemStatement: string; solution: string; features: string[] } | null {
  try {
    const jsonMatch = text.match(/PROJECT_IDEA_AGREED_TO_SAVE:\s*([\s\S]*)/);
    if (jsonMatch && jsonMatch[1]) {
      const jsonString = jsonMatch[1];
      const parsed = JSON.parse(jsonString);
      return {
        problemStatement: parsed.problemStatement || "",
        solution: parsed.solution || "",
        features: parsed.features || [],
      };
    }

    // Fallback for old format (if needed, otherwise remove)
    const problemStatementMatch = text.match(
      /Problem Statement:\s*([\s\S]*?)\nSolution:/i
    );
    const solutionMatch = text.match(
      /Solution:\s*([\s\S]*?)(?:\nFeatures:|$)/i
    );
    const featuresMatch = text.match(/Features:\s*([\s\S]*)/i);

    if (problemStatementMatch && solutionMatch) {
      const features = featuresMatch
        ? featuresMatch[1].split(",").map((f) => f.trim())
        : [];
      return {
        problemStatement: problemStatementMatch[1].trim(),
        solution: solutionMatch[1].trim(),
        features: features,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to parse project idea response:", error);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const moduleName = searchParams.get("moduleName");

    if (!userId || !moduleName) {
      return NextResponse.json(
        { error: "User ID or Module Name is missing" },
        { status: 400 }
      );
    }

    const profileSystemApiBaseUrl =
      process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL;

    const response = await fetch(
      `${profileSystemApiBaseUrl}/api/project-ideas?userId=${userId}&moduleName=${moduleName}`
    );

    if (!response.ok) {
      console.error("Failed to fetch project idea data:", response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch project idea data" },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data && data.length > 0) {
      // Assuming we want the chat history of the latest project idea
      const latestProjectIdea = data[data.length - 1];
      return NextResponse.json(
        { chat_history: latestProjectIdea.chat_history || [] },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ chat_history: [] }, { status: 200 });
    }
  } catch (error) {
    console.error("Error in project ideation GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      userId,
      systemPrompt,
      moduleContext,
      userIkigaiData,
      chatHistory, // Add chatHistory here
    } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    if (!moduleContext || !userIkigaiData || !systemPrompt) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Call LLM for initial project idea generation
    const model = openai.chat("gpt-5");

    // Deduct ideation credit
    const profileSystemApiBaseUrl =
      process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL;

    const ideationBalanceResponse = await fetch(
      `${profileSystemApiBaseUrl}/api/ideation-balance?userId=${userId}&balanceType=${moduleContext.balanceType}`
    );
    if (!ideationBalanceResponse.ok) {
      console.error("Error fetching ideation balance from profile-system");
      return new Response("Error fetching ideation balance", { status: 500 });
    }
    const { ideation_balance: currentIdeationBalance } =
      await ideationBalanceResponse.json();

    const MAX_TOKENS_PER_MENTEE = 15000; // Define the max tokens here for percentage calculation

    if (currentIdeationBalance <= 0) {
      return new Response("Ideation balance is 0. Please request a recharge.", {
        status: 403,
      });
    }

    const result = streamText({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        ...(messages as ChatMessage[]).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
    });

    const streamResponse = result.toUIMessageStreamResponse();

    // Deduct tokens after streaming
    result.usage.then(async (usage) => {
      if (usage && usage.totalTokens) {
        const newBalance = currentIdeationBalance - usage.totalTokens;
        await fetch(`${profileSystemApiBaseUrl}/api/ideation-balance`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            amount: newBalance,
            balanceType: moduleContext.balanceType,
          }),
        });
      }

      // Store project idea after streaming is complete
      const fullLlmResponse = await result.text; // Get the full text from the stream
      const parsedProjectIdea = parseProjectIdeaResponse(fullLlmResponse);

      const projectIdeaAgreedToSave = fullLlmResponse.includes(
        "PROJECT_IDEA_AGREED_TO_SAVE"
      );

      let savedProjectIdeaId = null;

      const existingIdeasResponse = await fetch(
        `${profileSystemApiBaseUrl}/api/project-ideas?userId=${userId}&moduleName=${moduleContext.name}`
      );
      if (!existingIdeasResponse.ok) {
        console.error("Failed to fetch existing project ideas");
        // Continue without enforcing limit if fetching fails
      }
      const existingIdeas = await existingIdeasResponse.json();

      if (existingIdeas && existingIdeas.length >= 4) {
        console.warn(
          "User has reached the limit of 4 project ideas for this module."
        );
        // If limit is reached, we still want to return the LLM response, but not save a new idea
      } else if (parsedProjectIdea) {
        const body = {
          userId: userId,
          moduleName: moduleContext.name,
          problem_statement: parsedProjectIdea
            ? parsedProjectIdea.problemStatement
            : null,
          solution: parsedProjectIdea ? parsedProjectIdea.solution : null,
          features:
            projectIdeaAgreedToSave &&
            parsedProjectIdea &&
            parsedProjectIdea.features
              ? parsedProjectIdea.features
              : [],
          chatHistory: chatHistory,
        };

        // Update to new profile-system endpoint
        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL}/api/project-ideas-update`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body }),
          }
        );

        const createProjectIdeaResponse = await fetch(
          `${profileSystemApiBaseUrl}/api/project-ideas`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        if (createProjectIdeaResponse.ok) {
          const newIdea = await createProjectIdeaResponse.json();
          savedProjectIdeaId = newIdea.id;
        } else {
          console.error(
            "Failed to store project idea:",
            createProjectIdeaResponse
          );
        }
      }
    });

    return streamResponse;
  } catch (error) {
    console.error("Error in project ideation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, moduleName, chatHistory } = await req.json();

    if (!userId || !moduleName) {
      return NextResponse.json(
        { error: "User ID or Module Name is missing" },
        { status: 400 }
      );
    }

    // Only proceed if chatHistory is not empty
    if (!chatHistory || chatHistory.length === 0) {
      return NextResponse.json(
        { error: "Chat history is empty, not saving." },
        { status: 200 }
      );
    }

    const profileSystemApiBaseUrl =
      process.env.NEXT_PUBLIC_PROFILE_SYSTEM_API_BASE_URL;

    // 1. Check if a project idea already exists for the user and module
    const existingIdeasResponse = await fetch(
      `${profileSystemApiBaseUrl}/api/project-ideas?userId=${userId}&moduleName=${moduleName}`
    );

    if (!existingIdeasResponse.ok) {
      console.error(
        "Failed to fetch existing project ideas:",
        existingIdeasResponse.statusText
      );
      return NextResponse.json(
        { error: "Failed to check for existing project ideas" },
        { status: 500 }
      );
    }

    const existingIdeas = await existingIdeasResponse.json();
    let projectIdeaId = null;

    if (existingIdeas && existingIdeas.length > 0) {
      // Assuming we want to update the latest one if multiple exist
      projectIdeaId = existingIdeas[existingIdeas.length - 1].id;
    }

    if (projectIdeaId) {
      // 2. If an idea exists, update it
      const updateProjectIdeaResponse = await fetch(
        `${profileSystemApiBaseUrl}/api/project-ideas`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, moduleName, chatHistory }),
        }
      );

      if (!updateProjectIdeaResponse.ok) {
        console.error(
          "Failed to update project idea in profile-system:",
          updateProjectIdeaResponse.statusText
        );
        return NextResponse.json(
          { error: "Failed to update project idea" },
          { status: 500 }
        );
      }
      const updatedIdea = await updateProjectIdeaResponse.json();
      return NextResponse.json(updatedIdea, { status: 200 });
    } else {
      // 3. If no idea exists, create a new one
      const createProjectIdeaResponse = await fetch(
        `${profileSystemApiBaseUrl}/api/project-ideas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            module_name: moduleName,
            chat_history: chatHistory,
          }),
        }
      );

      if (!createProjectIdeaResponse.ok) {
        console.error(
          "Failed to create new project idea in profile-system:",
          createProjectIdeaResponse.statusText
        );
        return NextResponse.json(
          { error: "Failed to create new project idea" },
          { status: 500 }
        );
      }
      const newIdea = await createProjectIdeaResponse.json();
      return NextResponse.json(newIdea, { status: 201 });
    }
  } catch (error) {
    console.error("Error in project ideation PUT API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
