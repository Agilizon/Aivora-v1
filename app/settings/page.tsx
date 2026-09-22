import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { RestaurantSettingsForm } from "@/components/settings/restaurant-settings-form";
import { createClient } from "@/lib/supabase/server";
import { AccountSettingsForm } from "@/components/knowledge/account-settings-form";

export default async function SettingsPage() {
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
    email,
    role,
    restaurants (
      name,
      description,
      address,
      phone,
      email,
      website_url,
      timezone,
      settings
    )
  `
)
    .eq("id", userId)
    .maybeSingle();

  if (userError || !user) {
    redirect("/onboarding");
  }

  const restaurant = Array.isArray(user.restaurants)
    ? user.restaurants[0]
    : user.restaurants;

  if (!restaurant) {
    redirect("/onboarding");
  }

  const settings =
    restaurant.settings &&
    typeof restaurant.settings === "object" &&
    !Array.isArray(restaurant.settings)
      ? restaurant.settings
      : {};

  const restaurantType =
    typeof settings.restaurant_type === "string"
      ? settings.restaurant_type
      : "";

  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500">
              Workspace
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your restaurant information and AIVORA
              workspace.
            </p>
          </div>

          <RestaurantSettingsForm
            initialName={restaurant.name ?? ""}
            initialDescription={
              restaurant.description ?? ""
            }
            initialAddress={restaurant.address ?? ""}
            initialPhone={restaurant.phone ?? ""}
            initialEmail={restaurant.email ?? ""}
            initialWebsite={
              restaurant.website_url ?? ""
            }
            initialRestaurantType={restaurantType}
            initialTimezone={
              restaurant.timezone ??
              "Africa/Johannesburg"
            }
          />
        </div>
        <div className="mt-8">
  <AccountSettingsForm
    userId={userId}
    initialFullName={user.full_name ?? ""}
    email={user.email}
    role={user.role}
  />
</div>
      </div>
    </AppShell>
  );
}