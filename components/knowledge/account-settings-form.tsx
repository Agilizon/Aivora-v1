"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AccountSettingsFormProps {
  userId: string;
  initialFullName: string;
  email: string;
  role: string;
}

export function AccountSettingsForm({
  userId,
  initialFullName,
  email,
  role,
}: AccountSettingsFormProps) {
  const supabase = createClient();

  const [fullName, setFullName] =
    useState(initialFullName);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSuccess("");
    setError("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        full_name: fullName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error(
        "Account settings error:",
        updateError
      );

      setError(
        "We couldn't save your account settings. Please try again."
      );

      setSaving(false);
      return;
    }

    setSuccess("Account settings saved successfully.");
    setSaving(false);

    window.dispatchEvent(
      new Event("account-settings-updated")
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full name
            </Label>

            <Input
              id="fullName"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              disabled={saving}
              placeholder="John Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email
            </Label>

            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-slate-50"
            />

            <p className="text-xs text-slate-500">
              Your login email is managed through your
              authentication account.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Role
            </Label>

            <Input
              id="role"
              value={role}
              disabled
              className="bg-slate-50 capitalize"
            />

            <p className="text-xs text-slate-500">
              Your role determines what you can access in
              AIVORA.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}

          {saving ? "Saving..." : "Save account"}
        </Button>
      </div>
    </form>
  );
}