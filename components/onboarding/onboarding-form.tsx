"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm() {
  const router = useRouter();
  const supabase = createClient();

  const [restaurantName, setRestaurantName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [restaurantType, setRestaurantType] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!restaurantName.trim()) {
      setError("Restaurant name is required.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.rpc(
      "update_current_restaurant",
      {
        p_name: restaurantName.trim(),
        p_address: address.trim() || null,
        p_phone: phone.trim() || null,
        p_website_url: website.trim() || null,
        p_restaurant_type: restaurantType.trim() || null,
      }
    );

    if (updateError) {
      console.error("Onboarding error:", updateError);

      setError(
        "We couldn't save your restaurant information. Please try again."
      );

      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Restaurant information</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="restaurantName">
              Restaurant name
            </Label>

            <Input
              id="restaurantName"
              value={restaurantName}
              onChange={(event) =>
                setRestaurantName(event.target.value)
              }
              placeholder="The Cape Kitchen"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>

            <Input
              id="address"
              value={address}
              onChange={(event) =>
                setAddress(event.target.value)
              }
              placeholder="123 Long Street, Cape Town"
              disabled={loading}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>

              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="+27 21 000 0000"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>

              <Input
                id="website"
                type="url"
                value={website}
                onChange={(event) =>
                  setWebsite(event.target.value)
                }
                placeholder="https://restaurant.co.za"
                disabled={loading}
              />
            </div>
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
              placeholder="Fine dining, café, takeaway, etc."
              disabled={loading}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading}>
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {loading ? "Saving..." : "Continue"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}