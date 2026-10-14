import { getPaginatedMerchantTransactions } from "@/dal/transactions";
import TransactionsClient from "@/components/transactions-client";

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

  const { transactions, totalCount, totalPages, currentPage } = await getPaginatedMerchantTransactions({
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Manage customer payments, view statuses, and issue instant refunds.
        </p>
      </div>

      <TransactionsClient
        initialTransactions={transactions}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={currentPage}
        limit={limit}
      />
    </div>
  );
}