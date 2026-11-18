'use client' // Error boundaries must be Client Components

import { Button } from "@wallet/ui/components/ui/button"

export default function Error({
    reset,
}: {
    error: unknown
    reset: () => void
}) {

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" >
            <h2 className="text-xl font-semibold">
                Something went wrong!
            </h2>
            <p className="text-muted-foreground">
                We couldn&apos;t load this page. Please try again.
            </p>
            <Button
                onClick={
                    // Attempt to recover by re-fetching and re-rendering the segment
                    () => reset()
                }
            >
                Try again
            </Button>
        </div >
    )
}