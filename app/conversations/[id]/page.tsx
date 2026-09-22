import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

interface ConversationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { id } = await params;

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

  const { data: conversation, error: conversationError } =
    await supabase
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
      .eq("id", id)
      .maybeSingle();

  if (conversationError) {
    console.error(
      "Conversation error:",
      conversationError
    );
  }

  if (!conversation) {
    notFound();
  }

  const { data: messages, error: messagesError } =
    await supabase
      .from("messages")
      .select(
        `
          id,
          sender_type,
          content,
          metadata,
          created_at
        `
      )
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

  if (messagesError) {
    console.error(
      "Messages error:",
      messagesError
    );
  }

  const messageList = messages ?? [];

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <Link
              href="/conversations"
              className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to conversations
            </Link>
          </div>

          <div className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <MessageSquare className="h-5 w-5 text-slate-500" />
                  </div>

                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                      {conversation.customer_name ||
                        "Anonymous customer"}
                    </h1>

                    <p className="text-sm text-slate-500">
                      {conversation.channel}
                    </p>
                  </div>
                </div>
              </div>

              <span className="w-fit rounded-full border px-3 py-1 text-xs font-medium capitalize text-slate-600">
                {conversation.status}
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <Card className="h-fit shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  Customer
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Name
                  </p>

                  <p className="mt-1 text-sm text-slate-900">
                    {conversation.customer_name ||
                      "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm text-slate-900">
                    {conversation.customer_email ||
                      "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Phone
                  </p>

                  <p className="mt-1 text-sm text-slate-900">
                    {conversation.customer_phone ||
                      "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Session
                  </p>

                  <p className="mt-1 break-all text-sm text-slate-900">
                    {conversation.session_id}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  Messages
                </CardTitle>
              </CardHeader>

              <CardContent>
                {messageList.length === 0 ? (
                  <div className="py-12 text-center">
                    <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No messages yet
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Messages from this conversation will appear
                      here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messageList.map((message) => {
                      const isCustomer =
                        message.sender_type === "customer";

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isCustomer
                              ? "justify-start"
                              : "justify-end"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-3 ${
                              isCustomer
                                ? "bg-slate-100 text-slate-900"
                                : "bg-slate-900 text-white"
                            }`}
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-xs font-medium capitalize opacity-70">
                                {message.sender_type}
                              </span>
                            </div>

                            <p className="whitespace-pre-wrap text-sm">
                              {message.content}
                            </p>

                            <p
                              className={`mt-2 text-[11px] ${
                                isCustomer
                                  ? "text-slate-400"
                                  : "text-slate-400"
                              }`}
                            >
                              {new Date(
                                message.created_at
                              ).toLocaleString()}
                            </p>
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
      </div>
    </AppShell>
  );
}