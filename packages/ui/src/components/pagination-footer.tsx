import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import React from "react";

// A generic contract for what a custom Link component should look like
interface CustomLinkProps {
  href: string;
  children: React.ReactNode;
}

interface PaginationFooterProps {
  currentPage: number;
  totalPages: number;
  limit: number;
  pageRoute: string;
  Link: React.ComponentType<CustomLinkProps>; // Accept any component matching the custom link structure
}

export default function PaginationFooter({
  currentPage,
  totalPages,
  limit,
  pageRoute,
  Link,
}: PaginationFooterProps) {
  return (
    <div className="flex flex-col gap-3 border-t pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div>
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        {currentPage > 1 ? (
          <Link href={`/${pageRoute}?page=${currentPage - 1}&limit=${limit}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-none"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-none"
            aria-label="Previous page"
            disabled
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {currentPage < totalPages ? (
          <Link href={`/${pageRoute}?page=${currentPage + 1}&limit=${limit}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-none"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-none"
            aria-label="Next page"
            disabled
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
