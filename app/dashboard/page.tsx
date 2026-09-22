import { redirect } from "next/navigation";
import {
  MessageSquare,
  CalendarDays,
  FileText,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    redirect("/login");
  }

  const userId = claimsData.claims.sub;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select(
      `
        full_name,
        restaurant_id,
        restaurants (
          name
        )
      `
    )
    .eq("id", userId)
    .maybeSingle();

  if (userError || !user?.restaurant_id) {
    redirect("/onboarding");
  }

  const restaurant = Array.isArray(user.restaurants)
    ? user.restaurants[0]
    : user.restaurants;

  const restaurantName =
    restaurant?.name ?? "Your Restaurant";

  const [
    conversationsResult,
    bookingsResult,
    documentsResult,
    recentConversationsResult,
  ] = await Promise.all([
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("documents")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("conversations")
      .select(
        "id, customer_name, customer_email, status, channel, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const conversationCount =
    conversationsResult.count ?? 0;

  const bookingCount =
    bookingsResult.count ?? 0;

  const documentCount =
    documentsResult.count ?? 0;

  const recentConversations =
    recentConversationsResult.data ?? [];

  const firstName =
    user.full_name?.split(" ")[0] ?? "there";

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500">
              Dashboard
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Welcome back, {firstName}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Here&apos;s an overview of {restaurantName}.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Conversations
                </CardTitle>

                <MessageSquare className="h-5 w-5 text-slate-400" />
              </CardHeader>

              <CardContent>
                <p className="text-3xl font-semibold text-slate-900">
                  {conversationCount}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Total conversations
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Bookings
                </CardTitle>

                <CalendarDays className="h-5 w-5 text-slate-400" />
              </CardHeader>

              <CardContent>
                <p className="text-3xl font-semibold text-slate-900">
                  {bookingCount}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Total bookings
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">
                  Knowledge
                </CardTitle>

                <FileText className="h-5 w-5 text-slate-400" />
              </CardHeader>

              <CardContent>
                <p className="text-3xl font-semibold text-slate-900">
                  {documentCount}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Uploaded documents
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Recent conversations</CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                {recentConversations.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No conversations yet
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Customer conversations will appear here once
                      AIVORA starts receiving messages.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className="flex items-center justify-between gap-4 px-6 py-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {conversation.customer_name ||
                              "Anonymous customer"}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {conversation.customer_email ||
                              "No email provided"}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                            {conversation.status}
                          </span>

                          <span className="text-xs capitalize text-slate-400">
                            {conversation.channel}
                          </span>
                        </div>
                      </div>
                    ))}
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