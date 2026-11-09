import Link from "next/link";
import { getPaginatedTransactions } from "@/dal/transactions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@wallet/ui/components/ui/card";
import PaginationFooter from "@wallet/ui/components/pagination-footer";
import { TransactionsPageSize } from "@/components/transactions-page-size";
import { TransactionsRows } from "@/components/transactions-rows";

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

  const { transactions, totalCount, totalPages, currentPage } =
    await getPaginatedTransactions({
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

          <TransactionsPageSize currentLimit={limit} />
        </CardHeader>

        <CardContent className="space-y-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No transactions found on this page.
            </div>
          ) : (
            <TransactionsRows transactions={transactions} />
          )}

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
