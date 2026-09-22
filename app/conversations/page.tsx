import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ConversationsPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/login");
  }

  const userId = claimsData.claims.sub;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("restaurant_id")
    .eq("id", userId)
    .maybeSingle();

  if (userError || !user?.restaurant_id) {
    redirect("/onboarding");
  }

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(
      `
        id,
        session_id,
        customer_name,
        customer_email,
        customer_phone,
        status,
        channel,
        created_at,
        updated_at
      `
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Conversations error:", error);
  }

  const conversationList = conversations ?? [];

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500">
              Customer communication
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Conversations
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage customer conversations with your
              restaurant.
            </p>
          </div>

          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  All conversations
                </CardTitle>

                <span className="text-sm text-slate-500">
                  {conversationList.length} total
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {conversationList.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />

                  <h2 className="mt-4 text-sm font-semibold text-slate-900">
                    No conversations yet
                  </h2>

                  <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                    Customer conversations will appear here once
                    AIVORA starts receiving messages.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversationList.map((conversation) => (
                    <Link
  key={conversation.id}
  href={`/conversations/${conversation.id}`}
  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <MessageSquare className="h-5 w-5 text-slate-500" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {conversation.customer_name ||
                              "Anonymous customer"}
                          </p>

                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                            {conversation.channel}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                          {conversation.customer_email && (
                            <span>
                              {conversation.customer_email}
                            </span>
                          )}

                          {conversation.customer_phone && (
                            <span>
                              {conversation.customer_phone}
                            </span>
                          )}

                          <span>
                            Session: {conversation.session_id}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="rounded-full border px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                          {conversation.status}
                        </span>

                        <span className="text-xs text-slate-400">
                          {new Date(
                            conversation.updated_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}