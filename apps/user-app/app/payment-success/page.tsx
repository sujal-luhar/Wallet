import { redirect } from "next/navigation";
import { PaymentStatus } from "@/components/payment-status";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ txId?: string }>;
}) {
  const { txId } = await searchParams;

  if (!txId) redirect("/dashboard");

  return <PaymentStatus txId={txId} />;
}