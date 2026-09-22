"use client";

import { useState } from "react";
import {
  Download,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface DocumentActionsProps {
  documentId: string;
  documentName: string;
}

export function DocumentActions({
  documentId,
  documentName,
}: DocumentActionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function getDocumentUrl() {
    const response = await fetch(
      `/api/knowledge/documents/${documentId}`
    );

    const result = await response.json();

    if (!response.ok || !result.url) {
      throw new Error(
        result.error ||
          "Unable to access document."
      );
    }

    return result.url;
  }

  async function handleOpen() {
    setLoading(true);
    setOpen(false);

    try {
      const url = await getDocumentUrl();

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to open document."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setLoading(true);
    setOpen(false);

    try {
      const url = await getDocumentUrl();

      const link = document.createElement("a");

      link.href = url;
      link.download = documentName;
      link.target = "_blank";

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to download document."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${documentName}"?\n\nThis will permanently remove the document and its processed knowledge chunks.`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setOpen(false);

    try {
      const response = await fetch(
        `/api/knowledge/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to delete document."
        );
      }

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete document."
      );

      setDeleting(false);
    }
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={loading || deleting}
        onClick={() => setOpen((value) => !value)}
      >
        {loading || deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}

        <span className="sr-only">
          Document actions
        </span>
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border bg-white p-1 shadow-lg">
            <button
              type="button"
              onClick={handleOpen}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100"
            >
              <Download className="h-4 w-4" />
              Download
            </button>

            <div className="my-1 border-t" />

            <button
              type="button"
              onClick={handleDelete}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}