import { NextResponse } from "next/server";

import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: claimsData } =
      await supabase.auth.getClaims();

    if (!claimsData?.claims) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const userId = claimsData.claims.sub;

    const body = await request.json();
    const question = body?.question;

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }

    const { data: user, error: userError } =
      await supabase
        .from("users")
        .select("restaurant_id")
        .eq("id", userId)
        .maybeSingle();

    if (userError) {
      console.error(
        "User lookup error:",
        userError
      );

      return NextResponse.json(
        { error: "Unable to identify restaurant." },
        { status: 500 }
      );
    }

    if (!user?.restaurant_id) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 403 }
      );
    }

    const embeddingResponse =
      await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: question.trim(),
      });

    const queryEmbedding =
      embeddingResponse.data[0]?.embedding;

    if (!queryEmbedding) {
      return NextResponse.json(
        { error: "Unable to generate query embedding." },
        { status: 500 }
      );
    }

    const { data: matches, error: searchError } =
      await supabase.rpc(
        "match_document_chunks",
        {
          p_restaurant_id: user.restaurant_id,
          p_query_embedding: queryEmbedding,
          p_match_count: 5,
          p_match_threshold: 0.3,
        }
      );

    if (searchError) {
      console.error(
        "Knowledge search error:",
        searchError
      );

      return NextResponse.json(
        { error: "Knowledge search failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      question: question.trim(),
      matches: matches ?? [],
    });
  } catch (error) {
    console.error(
      "Knowledge search error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Knowledge search failed.",
      },
      { status: 500 }
    );
  }
}