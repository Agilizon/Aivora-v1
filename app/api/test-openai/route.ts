import { NextResponse } from "next/server";

import { openai } from "@/lib/openai";

export async function GET() {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "AIVORA restaurant knowledge test",
    });

    return NextResponse.json({
      success: true,
      dimensions: response.data[0]?.embedding.length,
    });
  } catch (error) {
    console.error("OpenAI test error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "OpenAI request failed.",
      },
      { status: 500 }
    );
  }
}