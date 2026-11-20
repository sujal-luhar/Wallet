import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@wallet/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@wallet/ui/components/ui/sidebar";

const USER_APP_URL =
  process.env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3002";

export default async function MerchantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`${USER_APP_URL}/signin`);

  const merchantProfile = await db.merchantProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!merchantProfile) {
    redirect("/onboarding");
  }

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden bg-background">
      <Sidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <AppHeader currentApp="merchant" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
