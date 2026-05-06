import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { getBrandByUserId } from "@/lib/scraper-store";
import OnboardingForm from "./form";

export default async function OnboardingPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const brand = await getBrandByUserId(session.user.id);
  if (brand) redirect("/visibility");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">Open D2C</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Set up your store</h1>
          <p className="mt-2 text-sm text-gray-500">
            Tell us about your store to get started.
          </p>
        </div>

        <OnboardingForm />
      </div>
    </div>
  );
}
