"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@wallet/ui/components/ui/card";
import { Input } from "@wallet/ui/components/ui/input";
import { Button } from "@wallet/ui/components/ui/button";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { refundTransactionAction } from "@/app/actions/refundAction";

type TransactionItem = {
  id: string;
  shortId: string;
  customer: string;
  amount: number;
  date: string;
  status: string;
};

interface TransactionsClientProps {
  initialTransactions: TransactionItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export default function TransactionsClient({
  initialTransactions = [],
  totalCount,
  totalPages,
  currentPage,
  limit,
}: TransactionsClientProps) {
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredTransactions = initialTransactions.filter(
    (tx) =>
      tx.customer.toLowerCase().includes(search.toLowerCase()) ||
      tx.shortId.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefund = (id: string) => {
    setError(null);
    setLoadingId(id);
    startTransition(async () => {
      try {
        await refundTransactionAction(id);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to process refund.");
        }
      } finally {
        setLoadingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-medium">Customer Payments</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Showing {initialTransactions.length} of {totalCount} total transactions
            </CardDescription>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customer or Tx ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm rounded-none"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Tx ID</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No transactions found on this page.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{tx.customer}</td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{tx.shortId}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">
                        +₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{tx.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                            tx.status === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : tx.status === "REFUNDED"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {tx.status === "SUCCESS" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending && loadingId === tx.id}
                            onClick={() => handleRefund(tx.id)}
                            className="h-8 text-xs rounded-none border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            {isPending && loadingId === tx.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            Issue Refund
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs rounded-none text-muted-foreground hover:text-foreground"
                            disabled
                          >
                            Refunded
                          </Button>
                        )}
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
                <Link href={`/transactions?page=${currentPage - 1}&limit=${limit}`}>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-none">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-none" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}

              {currentPage < totalPages ? (
                <Link href={`/transactions?page=${currentPage + 1}&limit=${limit}`}>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-none">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-none" disabled>
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