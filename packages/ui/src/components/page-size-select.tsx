import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wallet/ui/components/ui/select";

interface PageSizeSelectProps {
  currentLimit: number;
  // 1. Pass the existing search string from the parent (e.g., "?page=1&query=abc")
  currentSearchString: string;
  // 2. Pass the active path from the parent (e.g., "/transactions")
  currentPathname: string;
  // 3. Callback function that handles structural navigation changes
  onNavigate: (newUrl: string) => void;
}

export default function PageSizeSelect({
  currentLimit,
  currentSearchString,
  currentPathname,
  onNavigate,
}: PageSizeSelectProps) {
  const handleLimitChange = (value: string | null) => {
    if (!value) return;

    // Use standard browser URLSearchParams API (supported everywhere natively)
    const params = new URLSearchParams(currentSearchString);
    params.set("limit", value);
    params.set("page", "1");

    // Fire the abstract callback up to the parent framework
    onNavigate(`${currentPathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Rows per page:
      </span>
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
