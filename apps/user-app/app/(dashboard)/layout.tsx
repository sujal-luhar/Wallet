import { getServerSession } from "next-auth";
import { authOptions } from "@wallet/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@wallet/ui/components/ui/sidebar";

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

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden bg-background">
      <Sidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <AppHeader currentApp="user" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
