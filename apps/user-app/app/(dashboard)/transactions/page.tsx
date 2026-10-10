import Link from "next/link";
import { getPaginatedTransactions } from "@/dal/transactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, ArrowUpRight, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { PageSizeSelect } from "@/components/page-size-select";

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
    }>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;
    const limit = Number(resolvedParams.limit) || 10;

    const { transactions, totalCount, totalPages, currentPage } = await getPaginatedTransactions({
        page,
        limit,
    });

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
            <Card className="shadow-sm border-border/60">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl">Transaction History</CardTitle>
                        <CardDescription>
                            Showing {transactions.length} of {totalCount} total transactions
                        </CardDescription>
                    </div>

                    <PageSizeSelect currentLimit={limit} />
                </CardHeader>

                <CardContent className="space-y-6">
                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-sm text-muted-foreground">
                            No transactions found on this page.
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {transactions.map((tx) => (
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
                                        <p
                                            className={`text-sm font-semibold ${tx.amount.startsWith("-")
                                                ? "text-foreground"
                                                : "text-emerald-600 dark:text-emerald-400"
                                                }`}
                                        >
                                            {tx.amount}
                                        </p>
                                        <span
                                            className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${tx.status === "SUCCESS"
                                                ? "bg-emerald-500/10 text-emerald-600"
                                                : tx.status === "PENDING"
                                                    ? "bg-amber-500/10 text-amber-600"
                                                    : "bg-rose-500/10 text-rose-600"
                                                }`}
                                        >
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
                        <div>
                            Page {currentPage} of {totalPages}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Previous Page Button */}
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

                            {/* Next Page Button */}
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