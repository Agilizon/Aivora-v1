import { NextResponse } from "next/server";
import { extractText } from "unpdf";
import mammoth from "mammoth";

import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
    const documentId = body?.documentId;

    if (
      typeof documentId !== "string" ||
      !documentId
    ) {
      return NextResponse.json(
        { error: "Document ID is required." },
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
      console.error("User lookup error:", userError);
      throw userError;
    }

    if (!user?.restaurant_id) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 403 }
      );
    }

    const { data: document, error: documentError } =
      await supabase
        .from("documents")
        .select(
          `
            id,
            name,
            file_path,
            file_type,
            file_size,
            status
          `
        )
        .eq("id", documentId)
        .maybeSingle();

    if (documentError) {
      console.error(
        "Document lookup error:",
        documentError
      );
      throw documentError;
    }

    if (!document) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    if (
      document.file_size !== null &&
      document.file_size > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "Document exceeds the 10 MB limit.",
        },
        { status: 400 }
      );
    }

    await supabase
      .from("documents")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id);

    console.log(
      `Processing document: ${document.name}`
    );

    const { data: file, error: downloadError } =
      await supabase.storage
        .from("knowledge-documents")
        .download(document.file_path);

    if (downloadError || !file) {
      console.error(
        "Storage download error:",
        downloadError
      );

      throw new Error(
        "Unable to download the document from storage."
      );
    }

    console.log("Document downloaded successfully.");

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    console.log(
      `Document size: ${buffer.length} bytes`
    );

    let text = "";

    const fileType =
      document.file_type?.toLowerCase() ?? "";

    const fileName =
      document.name.toLowerCase();

    console.log(
      `Processing file type: ${fileType}`
    );
if (
  fileType === "application/pdf" ||
  fileName.endsWith(".pdf")
) {
  console.log("Extracting PDF text...");

  const result = await extractText(
  new Uint8Array(buffer),
  {
    mergePages: true,
  }
);

  text = result.text;

  console.log(
    `PDF text extracted: ${text.length} characters`
  );
}
    else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      console.log("Extracting DOCX text...");

      const result =
        await mammoth.extractRawText({
          buffer,
        });

      text = result.value;

      console.log(
        `DOCX text extracted: ${text.length} characters`
      );
    } else if (
      fileType === "text/plain" ||
      fileName.endsWith(".txt")
    ) {
      console.log("Reading TXT file...");

      text = buffer.toString("utf-8");

      console.log(
        `TXT text extracted: ${text.length} characters`
      );
    } else {
      throw new Error(
        "Unsupported document type."
      );
    }

    text = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      throw new Error(
        "No readable text was found in the document."
      );
    }

    const chunks = createChunks(text);

    console.log(
      `Created ${chunks.length} document chunks.`
    );

    if (chunks.length === 0) {
      throw new Error(
        "The document did not contain enough readable content."
      );
    }

    const { error: deleteChunksError } =
      await supabase
        .from("document_chunks")
        .delete()
        .eq("document_id", document.id);

    if (deleteChunksError) {
      console.error(
        "Delete chunks error:",
        deleteChunksError
      );

      throw deleteChunksError;
    }
console.log("Generating embeddings...");

const embeddingResponse =
  await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: chunks,
  });

const embeddings =
  embeddingResponse.data.map(
    (item) => item.embedding
  );

console.log(
  `Generated ${embeddings.length} embeddings.`
);
    const chunkRows = chunks.map(
  (content, index) => ({
    document_id: document.id,
    restaurant_id: user.restaurant_id,
    chunk_index: index,
    content,
    embedding: embeddings[index],
    metadata: {
      source: document.name,
    },
  })
);

    const { error: insertChunksError } =
      await supabase
        .from("document_chunks")
        .insert(chunkRows);

    if (insertChunksError) {
      console.error(
        "Insert chunks error:",
        insertChunksError
      );

      throw insertChunksError;
    }

    const { error: updateError } =
      await supabase
        .from("documents")
        .update({
          status: "ready",
          metadata: {
            extracted_text_length: text.length,
            chunk_count: chunks.length,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", document.id);

    if (updateError) {
      console.error(
        "Document update error:",
        updateError
      );

      throw updateError;
    }

    console.log(
      `Document "${document.name}" processed successfully.`
    );

    return NextResponse.json({
      success: true,
      documentId: document.id,
      chunkCount: chunks.length,
    });
  } catch (error) {
    console.error(
      "DOCUMENT PROCESSING ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

function createChunks(
  text: string,
  chunkSize = 1200,
  overlap = 200
): string[] {
  const chunks: string[] = [];

  let start = 0;

  while (start < text.length) {
    const end = Math.min(
      start + chunkSize,
      text.length
    );

    const chunk = text
      .slice(start, end)
      .trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
}