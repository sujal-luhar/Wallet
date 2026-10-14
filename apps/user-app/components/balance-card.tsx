import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@wallet/ui/components/ui/card";

interface BalanceCardProps {
  formattedBalance: string;
  currency: string | undefined;
}

export default async function BalanceCard({formattedBalance, currency}: BalanceCardProps) {
    return (
        < Card className = "lg:col-span-2 shadow-sm border-border/60 bg-gradient-to-br from-card to-muted/20" >
        {/* Row 1: Primary Cards */ }
            {/* Wallet Balance Card (DYNAMIC FROM DB) */ }
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Wallet Balance</CardTitle>
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-4xl font-black tracking-tight">₹{formattedBalance}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span>Currency: <strong className="text-foreground">{currency || "INR"}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-emerald-600 dark:text-emerald-400">Active</strong></span>
              </div>
            </div>

            {/* Quick Summary Badges
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
            </div> */}
          </CardContent>
        </Card >
        )
}