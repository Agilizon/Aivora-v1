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

interface RestaurantSettingsFormProps {
  initialName: string;
  initialDescription: string;
  initialAddress: string;
  initialPhone: string;
  initialEmail: string;
  initialWebsite: string;
  initialRestaurantType: string;
  initialTimezone: string;
}

export function RestaurantSettingsForm({
  initialName,
  initialDescription,
  initialAddress,
  initialPhone,
  initialEmail,
  initialWebsite,
  initialRestaurantType,
  initialTimezone,
}: RestaurantSettingsFormProps) {
  const supabase = createClient();

  const [name, setName] = useState(initialName);
  const [description, setDescription] =
    useState(initialDescription);
  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [website, setWebsite] = useState(initialWebsite);
  const [restaurantType, setRestaurantType] =
    useState(initialRestaurantType);
  const [timezone, setTimezone] = useState(initialTimezone);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setSuccess("");
    setError("");

    if (!name.trim()) {
      setError("Restaurant name is required.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.rpc(
      "update_current_restaurant",
      {
        p_name: name.trim(),
        p_description: description.trim() || null,
        p_website_url: website.trim() || null,
        p_phone: phone.trim() || null,
        p_email: email.trim() || null,
        p_address: address.trim() || null,
        p_timezone:
          timezone.trim() || "Africa/Johannesburg",
        p_restaurant_type:
          restaurantType.trim() || null,
      }
    );

    if (updateError) {
      console.error(
        "Restaurant settings error:",
        updateError
      );

      setError(
        "We couldn't save your restaurant settings. Please try again."
      );

      setSaving(false);
      return;
    }

    setSuccess("Restaurant settings saved successfully.");
    setSaving(false);

    window.dispatchEvent(
      new Event("restaurant-settings-updated")
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Restaurant information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Restaurant name
            </Label>

            <Input
              id="name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              disabled={saving}
              placeholder="The Cape Kitchen"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              disabled={saving}
              placeholder="Tell customers about your restaurant..."
              rows={4}
              className="flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Address
            </Label>

            <Input
              id="address"
              value={address}
              onChange={(event) =>
                setAddress(event.target.value)
              }
              disabled={saving}
              placeholder="123 Long Street, Cape Town"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone
              </Label>

              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                disabled={saving}
                placeholder="+27 21 000 0000"
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
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                disabled={saving}
                placeholder="hello@restaurant.co.za"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">
                Website
              </Label>

              <Input
                id="website"
                type="url"
                value={website}
                onChange={(event) =>
                  setWebsite(event.target.value)
                }
                disabled={saving}
                placeholder="https://restaurant.co.za"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurantType">
                Restaurant type
              </Label>

              <Input
                id="restaurantType"
                value={restaurantType}
                onChange={(event) =>
                  setRestaurantType(event.target.value)
                }
                disabled={saving}
                placeholder="Fine dining, café, takeaway..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">
              Timezone
            </Label>

            <Input
              id="timezone"
              value={timezone}
              onChange={(event) =>
                setTimezone(event.target.value)
              }
              disabled={saving}
              placeholder="Africa/Johannesburg"
            />

            <p className="text-xs text-slate-500">
              Used for restaurant operating times and
              scheduling.
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

          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}