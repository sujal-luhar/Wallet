import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import React from "react";

// A generic contract for what a custom Link component should look like
interface CustomLinkProps {
    href: string;
    children: React.ReactNode;
}

interface PaginationFooterProps {
    currentPage: number,
    totalPages: number,
    limit: number,
    pageRoute: string,
    Link: React.ComponentType<CustomLinkProps> // Accept any component matching the custom link structure
}

export default function PaginationFooter({
    currentPage,
    totalPages,
    limit,
    pageRoute,
    Link
}: PaginationFooterProps) {

    return (
        <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
            <div>
                Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                    <Link
                        href={`/${pageRoute}?page=${currentPage - 1}&limit=${limit}`}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-none"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-none"
                        disabled
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                )}

                {currentPage < totalPages ? (
                    <Link
                        href={`/${pageRoute}?page=${currentPage + 1}&limit=${limit}`}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-none"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-none"
                        disabled
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}