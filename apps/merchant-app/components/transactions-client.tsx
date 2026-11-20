"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@wallet/ui/components/ui/card";
import { Input } from "@wallet/ui/components/ui/input";
import { Button } from "@wallet/ui/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { refundTransactionAction } from "@/app/actions/tx.refund.action";
import PaginationFooter from "@wallet/ui/components/pagination-footer";

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
      tx.shortId.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRefund = (transactionId: string) => {
    setError(null);
    setLoadingId(transactionId);
    startTransition(async () => {
      const result = await refundTransactionAction({ transactionId });

      if (!result.success) {
        setError(result.error);
      }

      setLoadingId(null);
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
        <CardHeader className="flex flex-col items-stretch justify-between gap-3 p-4 pb-4 sm:flex-row sm:items-center sm:gap-4 sm:p-6 sm:pb-4">
          <div className="min-w-0">
            <CardTitle className="text-base font-medium">
              Customer Payments
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Showing {initialTransactions.length} of {totalCount} total
              transactions
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customer or Tx ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm rounded-none"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[760px] text-left text-sm">
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
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No transactions found on this page.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{tx.customer}</td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {tx.shortId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">
                        +₹
                        {tx.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {tx.date}
                      </td>
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

          <div className="space-y-3 sm:hidden">
            {filteredTransactions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No transactions found on this page.
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="space-y-3 border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">
                        {tx.customer}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {tx.shortId}
                      </p>
                    </div>
                    <p className="shrink-0 whitespace-nowrap text-sm font-semibold text-emerald-600">
                      +₹
                      {tx.amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t pt-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          tx.status === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : tx.status === "REFUNDED"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    {tx.status === "SUCCESS" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending && loadingId === tx.id}
                        onClick={() => handleRefund(tx.id)}
                        className="h-8 shrink-0 rounded-none border-rose-200 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        {isPending && loadingId === tx.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : null}
                        Issue Refund
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 rounded-none text-xs text-muted-foreground hover:text-foreground"
                        disabled
                      >
                        Refunded
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Footer */}
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            limit={limit}
            pageRoute="transactions"
            Link={Link}
          />
        </CardContent>
      </Card>
    </div>
  );
}
