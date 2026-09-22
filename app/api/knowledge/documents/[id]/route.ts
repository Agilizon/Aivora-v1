import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
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
    const { id } = await context.params;

    const { data: user, error: userError } =
      await supabase
        .from("users")
        .select("restaurant_id")
        .eq("id", userId)
        .maybeSingle();

    if (userError || !user?.restaurant_id) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 403 }
      );
    }

    const { data: document, error: documentError } =
      await supabase
        .from("documents")
        .select("id, name, file_path")
        .eq("id", id)
        .maybeSingle();

    if (documentError) {
      console.error(
        "Document lookup error:",
        documentError
      );

      return NextResponse.json(
        { error: "Unable to load document." },
        { status: 500 }
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    const { data: signedUrl, error: signedUrlError } =
      await supabase.storage
        .from("knowledge-documents")
        .createSignedUrl(
          document.file_path,
          60 * 5
        );

    if (signedUrlError || !signedUrl?.signedUrl) {
      console.error(
        "Signed URL error:",
        signedUrlError
      );

      return NextResponse.json(
        { error: "Unable to access document." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: signedUrl.signedUrl,
      name: document.name,
    });
  } catch (error) {
    console.error(
      "Document access error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to access document.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
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
    const { id } = await context.params;

    const { data: user, error: userError } =
      await supabase
        .from("users")
        .select("restaurant_id")
        .eq("id", userId)
        .maybeSingle();

    if (userError || !user?.restaurant_id) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 403 }
      );
    }

    const { data: document, error: documentError } =
      await supabase
        .from("documents")
        .select("id, file_path")
        .eq("id", id)
        .maybeSingle();

    if (documentError) {
      console.error(
        "Document lookup error:",
        documentError
      );

      return NextResponse.json(
        { error: "Unable to load document." },
        { status: 500 }
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    const { error: chunksError } =
      await supabase
        .from("document_chunks")
        .delete()
        .eq("document_id", document.id);

    if (chunksError) {
      console.error(
        "Chunk deletion error:",
        chunksError
      );

      return NextResponse.json(
        { error: "Unable to delete document chunks." },
        { status: 500 }
      );
    }

    const { error: storageError } =
      await supabase.storage
        .from("knowledge-documents")
        .remove([document.file_path]);

    if (storageError) {
      console.error(
        "Storage deletion error:",
        storageError
      );

      return NextResponse.json(
        { error: "Unable to delete stored file." },
        { status: 500 }
      );
    }

    const { error: deleteError } =
      await supabase
        .from("documents")
        .delete()
        .eq("id", document.id);

    if (deleteError) {
      console.error(
        "Document deletion error:",
        deleteError
      );

      return NextResponse.json(
        { error: "Unable to delete document." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Document deletion error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete document.",
      },
      { status: 500 }
    );
  }
}