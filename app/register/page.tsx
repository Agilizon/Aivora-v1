"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationRequired, setConfirmationRequired] =
    useState(false);

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setConfirmationRequired(false);

    if (
      !fullName ||
      !restaurantName ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError("Please complete all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const slug = createSlug(restaurantName);

    if (!slug) {
      setError("Please enter a valid restaurant name.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } =
      await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

    if (signUpError) {
      setLoading(false);

      const message = signUpError.message.toLowerCase();

      if (
        message.includes("already registered") ||
        message.includes("already exists")
      ) {
        setError(
          "This email address is already registered. Try signing in instead."
        );
      } else if (message.includes("password")) {
        setError("Please choose a stronger password.");
      } else {
        setError(
          "Unable to create your account. Please try again."
        );
      }

      return;
    }

    /*
     * When email confirmation is enabled, Supabase does not
     * return an authenticated session immediately.
     */
    if (!data.session) {
      setLoading(false);
      setConfirmationRequired(true);
      return;
    }

    /*
     * The auth trigger has already created public.users.
     * Now create the restaurant and associate it with the user.
     */
    const { error: restaurantError } = await supabase.rpc(
      "create_restaurant_for_current_user",
      {
        p_name: restaurantName.trim(),
        p_slug: slug,
      }
    );

    if (restaurantError) {
      setLoading(false);

      console.error(
        "Restaurant creation error:",
        restaurantError
      );

      setError(
        "Your account was created, but we couldn't finish setting up your restaurant. Please try again."
      );

      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  if (confirmationRequired) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
                <Bot className="h-5 w-5 text-white" />
              </div>

              <span className="text-xl font-semibold tracking-tight">
                AIVORA
              </span>
            </Link>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <h1 className="text-xl font-semibold">
                Check your email
              </h1>

              <p className="text-sm text-slate-500">
                Your account was created. Please confirm your email
                address before signing in.
              </p>
            </CardHeader>

            <CardContent>
              <Button
                type="button"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
              <Bot className="h-5 w-5 text-white" />
            </div>

            <span className="text-xl font-semibold tracking-tight">
              AIVORA
            </span>
          </Link>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              Create your account
            </h1>

            <p className="text-sm text-slate-500">
              Set up your restaurant workspace with AIVORA.
            </p>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleRegister}
              className="space-y-5"
            >
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>

                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Smith"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurantName">
                  Restaurant name
                </Label>

                <Input
                  id="restaurantName"
                  type="text"
                  placeholder="The Cape Kitchen"
                  value={restaurantName}
                  onChange={(event) =>
                    setRestaurantName(event.target.value)
                  }
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="you@restaurant.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>

                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm password
                </Label>

                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-slate-900 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}