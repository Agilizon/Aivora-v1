"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface DocumentUploadProps {
  restaurantId: string;
}

export function DocumentUpload({
  restaurantId,
}: DocumentUploadProps) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setUploading(true);

    try {
      const extension =
        file.name.split(".").pop()?.toLowerCase() ?? "";

      const allowedExtensions = ["pdf", "txt", "docx"];

      if (!allowedExtensions.includes(extension)) {
        setError(
          "Only PDF, TXT, and DOCX files are supported."
        );
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("The maximum file size is 10 MB.");
        return;
      }

      const fileId = crypto.randomUUID();
      const filePath = `${restaurantId}/${fileId}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("knowledge-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(
          "Storage upload error:",
          uploadError
        );

        throw new Error(
          "Unable to upload the document."
        );
      }

      const { data: document, error: documentError } =
        await supabase
          .from("documents")
          .insert({
            restaurant_id: restaurantId,
            name: file.name,
            file_path: filePath,
            file_type: file.type || extension,
            file_size: file.size,
            status: "uploaded",
          })
          .select("id")
          .single();

      if (documentError || !document) {
        console.error(
          "Document record error:",
          documentError
        );

        await supabase.storage
          .from("knowledge-documents")
          .remove([filePath]);

        throw new Error(
          "The document was uploaded but could not be registered."
        );
      }

      const response = await fetch(
        "/api/knowledge/process",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: document.id,
          }),
        }
      );

      const responseText = await response.text();

      let result: {
        error?: string;
        success?: boolean;
      } = {};

      try {
        result = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        console.error(
          "Document processing returned invalid JSON:",
          responseText
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            responseText ||
            `Document processing failed with status ${response.status}.`
        );
      }

      if (!result.success) {
        throw new Error(
          result.error ||
            "The document processing did not complete successfully."
        );
      }

      window.location.reload();
    } catch (uploadError) {
      console.error(uploadError);

      if (uploadError instanceof Error) {
        setError(uploadError.message);
      } else {
        setError(
          "Something went wrong while uploading the document."
        );
      }
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  return (
    <div className="flex flex-col items-end">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      <Button
        type="button"
        disabled={uploading}
        onClick={openFilePicker}
      >
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}

        {uploading
          ? "Uploading..."
          : "Upload document"}
      </Button>

      {error && (
        <p className="mt-2 max-w-xs text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}