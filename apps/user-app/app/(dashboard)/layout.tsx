import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header";

export default async function DashboardLayout({ children, }: { children: React.ReactNode; }) {

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  // Redirect Google users without a phone number to onboarding
  if (!session.user.phone) {
    redirect("/onboarding");
  }


  return (<div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header currentApp="user"/>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>)
}