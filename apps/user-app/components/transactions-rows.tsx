import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import { getPaginatedTransactions } from "@/dal/tx.history.dal";

type TransactionItem = Awaited<
  ReturnType<typeof getPaginatedTransactions>
>["transactions"][number];
// [number] Extracts the type of items inside an array
//
// just like arr[0] accesses an actual item inside an array at runtime,
// ArrayType[number] accesses the type of any element indexed by a number.

interface TransactionsRowsProps {
  transactions: TransactionItem[];
}

export function TransactionsRows({ transactions }: TransactionsRowsProps) {
  return (
    <div className="divide-y divide-border/50">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0 sm:items-center"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-full bg-muted p-2">
              {tx.amount.startsWith("+") ? (
                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="break-words text-sm font-medium leading-snug">
                {tx.title}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {tx.date}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p
              className={`whitespace-nowrap text-sm font-semibold ${
                tx.amount.startsWith("-")
                  ? "text-foreground"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {tx.amount}
            </p>
            <span
              className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                tx.status === "SUCCESS"
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
  );
}
