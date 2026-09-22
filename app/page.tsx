import Link from "next/link";
import { ArrowRight, Bot, MessageSquare, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <Bot className="h-4 w-4 text-white" />
            </div>

            <span className="text-lg font-semibold tracking-tight">
              AIVORA
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>

            <Button>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
            <Bot className="h-3.5 w-3.5" />
            AI for modern restaurants
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            Your restaurant&apos;s AI assistant.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
            AIVORA helps restaurants organize their knowledge and prepare for
            smarter customer conversations.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg">
              <Link href="/register">
                Create your account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          <FeatureCard
            icon={BookOpen}
            title="Restaurant knowledge"
            description="Keep the information your future AI assistant needs in one place."
          />

          <FeatureCard
            icon={MessageSquare}
            title="Customer conversations"
            description="Prepare a single workspace for managing customer interactions."
          />

          <FeatureCard
            icon={Bot}
            title="AI-ready foundation"
            description="A professional foundation designed to grow into a complete restaurant AI platform."
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>

      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}