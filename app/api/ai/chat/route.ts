import { NextResponse } from "next/server";

import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const question =
      typeof body?.question === "string"
        ? body.question.trim()
        : "";

    const conversationId =
      typeof body?.conversationId === "string"
        ? body.conversationId
        : null;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }

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

    const { data: user, error: userError } =
      await supabase
        .from("users")
        .select("restaurant_id")
        .eq("id", userId)
        .maybeSingle();

    if (userError) {
      console.error("User lookup error:", userError);

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

    let activeConversationId = conversationId;

    if (activeConversationId) {
      const { data: existingConversation, error } =
        await supabase
          .from("conversations")
          .select("id")
          .eq("id", activeConversationId)
          .eq("restaurant_id", user.restaurant_id)
          .maybeSingle();

      if (error) {
        console.error(
          "Conversation lookup error:",
          error
        );

        return NextResponse.json(
          { error: "Unable to load conversation." },
          { status: 500 }
        );
      }

      if (!existingConversation) {
        activeConversationId = null;
      }
    }

    if (!activeConversationId) {
      const { data: conversation, error } =
        await supabase
          .from("conversations")
          .insert({
            restaurant_id: user.restaurant_id,
            session_id: crypto.randomUUID(),
            channel: "website",
            status: "active",
          })
          .select("id")
          .single();

      if (error || !conversation) {
        console.error(
          "Conversation creation error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Unable to create conversation.",
          },
          { status: 500 }
        );
      }

      activeConversationId = conversation.id;
    }

    const { error: customerMessageError } =
      await supabase.from("messages").insert({
        conversation_id: activeConversationId,
        sender_type: "customer",
        content: question,
      });

    if (customerMessageError) {
      console.error(
        "Customer message error:",
        customerMessageError
      );

      return NextResponse.json(
        { error: "Unable to save message." },
        { status: 500 }
      );
    }

    const embeddingResponse =
      await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: question,
      });

    const queryEmbedding =
      embeddingResponse.data[0]?.embedding;

    if (!queryEmbedding) {
      return NextResponse.json(
        {
          error:
            "Unable to generate question embedding.",
        },
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

    const context = (matches ?? [])
      .map(
        (match: {
          content: string;
          metadata: Record<
            string,
            unknown
          > | null;
        }) => match.content
      )
      .join("\n\n");

    const prompt = `
You are AIVORA, the AI assistant for a restaurant.

Answer the customer's question using ONLY the
restaurant knowledge provided below.

Restaurant knowledge:

${context || "No relevant restaurant information was found."}

Rules:
- Do not invent information.
- If the answer is not contained in the knowledge,
  clearly say that you do not have that information.
- Do not ask the customer to provide the restaurant
  name or location.
- If appropriate, recommend contacting the restaurant
  directly.
- Keep the answer concise and natural.
- Do not mention internal systems, embeddings,
  vectors, or knowledge retrieval.
`;

    const completion =
      await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: question,
          },
        ],
      });

    const answer =
      completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json(
        {
          error:
            "The AI did not return a response.",
        },
        { status: 500 }
      );
    }

    const { error: assistantMessageError } =
      await supabase.from("messages").insert({
        conversation_id: activeConversationId,
        sender_type: "assistant",
        content: answer,
        metadata: {
          model: "gpt-5-mini",
          retrieved_chunks: (matches ?? []).length,
        },
      });

    if (assistantMessageError) {
      console.error(
        "Assistant message error:",
        assistantMessageError
      );

      return NextResponse.json(
        {
          error:
            "The response was generated but could not be saved.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversationId: activeConversationId,
      question,
      answer,
      matches: matches ?? [],
    });
  } catch (error) {
    console.error("AI chat error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI response failed.",
      },
      { status: 500 }
    );
  }
}