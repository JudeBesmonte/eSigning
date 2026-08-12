"use client"

import { useRouter } from "next/navigation"
import { Home } from "lucide-react"

import { Button } from "@/core/components/ui/button"

interface MySignedHeaderProps {
  totalCount: number
}

export function MySignedHeader({ totalCount }: MySignedHeaderProps) {
  const router = useRouter()

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="border-b bg-background backdrop-blur dark:bg-muted/60">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Title and Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-foreground">
              My Signed Documents
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View and manage documents you have signed ({totalCount} total)
            </p>
          </div>

          {/* Back to Home Button */}
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
