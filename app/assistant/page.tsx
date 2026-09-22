import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { AiChat } from "@/components/ai/ai-chat";

export const metadata: Metadata = {
  title: "AI Assistant",
};

export default function AssistantPage() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              AI Assistant
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Test how AIVORA responds using your
              restaurant knowledge.
            </p>
          </div>

          <AiChat />
        </div>
      </div>
    </AppShell>
  );
}