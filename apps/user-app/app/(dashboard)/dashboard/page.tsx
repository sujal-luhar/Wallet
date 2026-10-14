import { getServerSession } from "next-auth";
import { authOptions } from "@wallet/auth";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wallet/ui/components/ui/card";
import { Button } from "@wallet/ui/components/ui/button";
import { Input } from "@wallet/ui/components/ui/input";
import { ArrowUpRight, ArrowDownLeft, Wallet, Send, Clock } from "lucide-react";
import getDashboardData from "@/dal/dashboard";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const { wallet, recentTransactions, monthlyStats } = await getDashboardData()

  return (
    <div className="p-6 space-y-8 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, <span className="font-semibold text-foreground">{session?.user?.name || "User"}</span>! Here is your wallet summary.
          </p>
        </div>
      </div>

      {/* Row 1: Primary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Wallet Balance Card (DYNAMIC FROM DB) */}
        <Card className="lg:col-span-2 shadow-sm border-border/60 bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Wallet Balance</CardTitle>
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-4xl font-black tracking-tight">₹{wallet.formattedBalance}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span>Currency: <strong className="text-foreground">{wallet?.currency || "INR"}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-emerald-600 dark:text-emerald-400">Active</strong></span>
              </div>
            </div>

            {/* Quick Summary Badges */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ArrowDownLeft className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Month In</p>
                  <p className="text-sm font-semibold">{monthlyStats.monthlyReceived}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This Month Out</p>
                  <p className="text-sm font-semibold">{monthlyStats.monthlySent}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick P2P Send Card */}
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Quick Transfer
            </CardTitle>
            <CardDescription>Send funds instantly via phone number</CardDescription>
          </CardHeader>
          <CardContent>
            {/* =========================================================================
                TODO [YOUR PRACTICE 3]: Form Submission Handler
                Replace this plain form with a Client Component or attach a Server Action
                like `action={sendMoneyAction}` to process P2P transfers.
               ========================================================================= */}
            <form className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Recipient Phone</label>
                <Input placeholder="10-digit number" type="tel" maxLength={10} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Amount (₹)</label>
                <Input placeholder="0.00" type="number" min={1} />
              </div>
              <Button type="button" className="w-full font-medium">
                Send Instantly
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Recent Activity Ledger */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Your latest deposits and transfers</CardDescription>
          </div>
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="text-xs">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border/50">
            {recentTransactions.map((tx: (typeof recentTransactions)[number]) => (
              <div key={tx.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    {tx.amount.startsWith("+") ? (
                      <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{tx.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tx.date}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-semibold ${tx.amount.startsWith("-") ? "text-foreground" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {tx.amount}
                  </p>
                  <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${tx.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                    }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}