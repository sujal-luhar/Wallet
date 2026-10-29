import { db } from "@wallet/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@wallet/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";

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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header currentApp="merchant" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
