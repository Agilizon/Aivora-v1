import { AppSidebar } from "@/components/layout/app-sidebar";
import { createClient } from "@/lib/supabase/server";

interface AppShellProps {
  children: React.ReactNode;
}

export async function AppShell({ children }: AppShellProps) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;

  let fullName = "Restaurant Admin";
  let restaurantName = "AIVORA Restaurant";

  if (userId) {
    const { data: user } = await supabase
      .from("users")
      .select(
        `
          full_name,
          restaurants (
            name
          )
        `
      )
      .eq("id", userId)
      .maybeSingle();

    if (user?.full_name) {
      fullName = user.full_name;
    }

    const restaurant = Array.isArray(user?.restaurants)
      ? user.restaurants[0]
      : user?.restaurants;

    if (restaurant?.name) {
      restaurantName = restaurant.name;
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar
        fullName={fullName}
        restaurantName={restaurantName}
      />

      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}