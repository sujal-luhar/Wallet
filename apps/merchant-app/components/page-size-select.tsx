"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wallet/ui/components/ui/select";

interface PageSizeSelectProps {
  currentLimit: number;
}

export function PageSizeSelect({ currentLimit }: PageSizeSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname(); // Dynamically detects /transactions or /settlements

  const handleLimitChange = (value: string | null) => {
    if (!value) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", value);
    params.set("page", "1"); // Reset to page 1 when page size changes
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">Rows per page:</span>
      <Select value={String(currentLimit)} onValueChange={handleLimitChange}>
        <SelectTrigger className="h-8 w-[70px] text-xs">
          <SelectValue placeholder={String(currentLimit)} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}