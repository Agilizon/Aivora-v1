import { FileText, FileType, HardDrive } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { DocumentUpload } from "@/components/knowledge/document-upload";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { DocumentActions } from "@/components/knowledge/document-actions";
function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function getStatusVariant(
  status: string
) {
  switch (status) {
    case "ready":
      return "default";

    case "processing":
      return "secondary";

    case "failed":
      return "destructive";

    default:
      return "outline";
  }
}

export default async function KnowledgePage() {
  const supabase = await createClient();

  const { data: claimsData } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return null;
  }

  const { data: user } = await supabase
    .from("users")
    .select("restaurant_id")
    .eq("id", userId)
    .maybeSingle();

  if (!user?.restaurant_id) {
    return null;
  }

  const { data: documents } = await supabase
    .from("documents")
    .select(
      `
        id,
        name,
        file_type,
        file_size,
        status,
        metadata,
        created_at,
        updated_at
      `
    )
    .order("created_at", {
      ascending: false,
    });

  const documentCount = documents?.length ?? 0;

  const readyCount =
    documents?.filter(
      (document) => document.status === "ready"
    ).length ?? 0;

  const processingCount =
    documents?.filter(
      (document) =>
        document.status === "processing"
    ).length ?? 0;

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Knowledge
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Upload restaurant information that AIVORA
                can use as its knowledge base.
              </p>
            </div>

            <DocumentUpload
              restaurantId={user.restaurant_id}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-slate-100 p-3">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Documents
                  </p>

                  <p className="text-2xl font-semibold">
                    {documentCount}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-slate-100 p-3">
                  <FileType className="h-5 w-5 text-slate-600" />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Ready
                  </p>

                  <p className="text-2xl font-semibold">
                    {readyCount}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-slate-100 p-3">
                  <HardDrive className="h-5 w-5 text-slate-600" />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Processing
                  </p>

                  <p className="text-2xl font-semibold">
                    {processingCount}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Uploaded documents
              </CardTitle>
            </CardHeader>

            <CardContent>
              {!documents ||
              documents.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center">
                  <FileText className="mx-auto h-8 w-8 text-slate-400" />

                  <h3 className="mt-3 text-sm font-medium">
                    No documents yet
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Upload menus, policies, FAQs,
                    opening hours, or other restaurant
                    information.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {documents.map((document) => {
                    const metadata =
                      document.metadata as {
                        chunk_count?: number;
                      } | null;

                    return (
                      <div
                        key={document.id}
                        className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="rounded-lg bg-slate-100 p-3">
                            <FileText className="h-5 w-5 text-slate-600" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {document.name}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span>
                                {formatFileSize(
                                  document.file_size
                                )}
                              </span>

                              <span>
                                Uploaded{" "}
                                {formatDate(
                                  document.created_at
                                )}
                              </span>

                              {metadata?.chunk_count && (
                                <span>
                                  {metadata.chunk_count}{" "}
                                  chunks
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                       <div className="flex items-center gap-2">
  <Badge
    variant={getStatusVariant(
      document.status
    )}
    className="w-fit capitalize"
  >
    {document.status}
  </Badge>

  <DocumentActions
    documentId={document.id}
    documentName={document.name}
  />
</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}