import { searchBookSegments } from "@/lib/actions/book.actions";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  try {
    const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;
    if (!expectedSecret) {
      console.error("VAPI_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    if (request.headers.get("x-vapi-secret") !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    const toolCalls = message?.toolCalls ?? [];

    const results = await Promise.all(
      toolCalls.map(async (toolCall: { id: string; function: { name: string; arguments: Record<string, string> } }) => {
        if (toolCall.function.name === "searchBook") {
          const { bookId, query } = toolCall.function.arguments;

          const response = await searchBookSegments(bookId, query, 3);

          let resultText: string;

          if (response.success && response.data && response.data.length > 0) {
            resultText = response.data
              .map((segment) => segment.content)
              .join("\n\n");
          } else {
            resultText = "No information found about this topic.";
          }

          return {
            toolCallId: toolCall.id,
            result: resultText,
          };
        }

        return {
          toolCallId: toolCall.id,
          result: "Unknown tool call.",
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Vapi search-book error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request." },
      { status: 500 }
    );
  }
};
