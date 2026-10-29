import { getMerchantDashboardData } from "@/dal/dashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@wallet/ui/components/ui/card";
import { RevenueChart } from "@/components/revenue-chart";
import { SettleToBankCard } from "@/components/settle-to-bank-card";
import { IndianRupee, TrendingUp, Wallet } from "lucide-react";

export default async function MerchantDashboard() {
  const data = await getMerchantDashboardData();

  return (
    <div className="space-y-6">
      {/* Summary Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sales (Weekly)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{data.weeklyTotalSales.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">
              Updated in real time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Balance
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{data.availableBalance.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for instant bank settlement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Locked / Pending
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{data.lockedBalance.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">
              Processing in current payout cycle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Graph & Quick Settlement Card */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Daily Revenue (7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <RevenueChart data={data.dailyRevenueGraph} />
          </CardContent>
        </Card>

        {/* Isolated Settle to Bank Component */}
        <SettleToBankCard availableBalance={data.availableBalance} />
      </div>

      {/* Recent Sales Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent sales transactions recorded.
              </p>
            ) : (
              data.recentSales.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Incoming Customer Payment
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">
                      +₹{tx.amount.toFixed(2)}
                    </p>
                    <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
