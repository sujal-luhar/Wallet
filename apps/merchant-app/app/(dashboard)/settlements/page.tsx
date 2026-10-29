import Link from "next/link";
import { getPaginatedMerchantSettlements } from "@/dal/settlements";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@wallet/ui/components/ui/card";
import { Button } from "@wallet/ui/components/ui/button";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { PageSizeSelect } from "@/components/page-size-select";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function SettlementsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 10;

  const { settlements, totalCount, totalPages, currentPage } =
    await getPaginatedMerchantSettlements({
      page,
      limit,
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Bank Settlements</h1>
        <p className="text-sm text-muted-foreground">
          Track payouts and bank transfer history from your merchant wallet.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-medium">
              Payout History
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Showing {settlements.length} of {totalCount} total settlements
            </CardDescription>
          </div>

          <PageSizeSelect currentLimit={limit} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-semibold">Settlement ID</th>
                  <th className="py-3 px-4 font-semibold">Destination Bank</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {settlements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No settlements initiated yet.
                    </td>
                  </tr>
                ) : (
                  settlements.map((stl) => (
                    <tr
                      key={stl.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {stl.shortId}
                      </td>
                      <td className="py-3 px-4 font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        HDFC Bank ****4892
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        -₹
                        {stl.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {stl.date}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                            stl.status === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : stl.status === "PENDING" ||
                                  stl.status === "PROCESSING"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {stl.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
            <div>
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={`/settlements?page=${currentPage - 1}&limit=${limit}`}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-none"
                  disabled
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={`/settlements?page=${currentPage + 1}&limit=${limit}`}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-none"
                  disabled
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
