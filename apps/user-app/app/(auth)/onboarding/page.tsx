import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { db } from "@wallet/db";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect("/signin");
  }

  // Check user's phone status from the database
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { phone: true },
  });

  // If user already has a phone number set, block re-entering onboarding
  if (user?.phone) {
    redirect("/dashboard");
  }

  return <OnboardingForm />;
}