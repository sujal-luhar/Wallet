import { getServerSession } from "next-auth";
import { authOptions } from "@wallet/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app-sidebar";
import { cookies } from "next/headers";
import { AppHeader } from "@/components/app-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  // Redirect Google users without a phone number to onboarding
  if (!session.user.phone) {
    redirect("/onboarding");
  }

  const cookieStore = await cookies();
  const appModeCookie = cookieStore.get("app_mode")?.value;
  const appMode: "user" | "merchant" = appModeCookie === "merchant" ? "merchant" : "user";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader currentApp={appMode} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
