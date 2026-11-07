// This is the client wrapper for the page-size-select.tsx UI component
// To help the UI component framework-agnostic and
// to keep the settlements page a server component
// It's bad to make the entire settlements page client component just
// because of this single component which uses hooks. 

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import PageSizeSelect from "@wallet/ui/components/page-size-select";

interface SettlementsPageSizeProps {
  currentLimit: number;
}

export function SettlementsPageSize({ currentLimit }: SettlementsPageSizeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  return (
    <PageSizeSelect
      currentLimit={currentLimit}
      currentPathname={pathname}
      currentSearchString={searchParams.toString()}
      onNavigate={(newUrl) => router.push(newUrl)}
    />
  );
}
