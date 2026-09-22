import { AppShell } from "@/components/layout/app-shell";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default function OnboardingPage() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500">
              Setup
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Set up your restaurant
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Add some basic information so AIVORA can understand
              your restaurant.
            </p>
          </div>

          <OnboardingForm />
        </div>
      </div>
    </AppShell>
  );
}