// import { Button } from '@/core/components/ui/button';
import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronRight, Home } from "lucide-react"

type BreadcrumbItem = {
	label: string
	href?: string
	active?: boolean
}

type NotaryBookLayoutProps = {
	title: string
	breadcrumbs?: BreadcrumbItem[]
	onBack?: () => void
	children: ReactNode

	onSync?: () => Promise<void>
	isSyncing?: boolean
	className?: string
}

export function NotaryBookLayout({
	title,
	breadcrumbs = [],
	children,

	// onSync,
	// isSyncing = false,
	className = ""
}: NotaryBookLayoutProps) {
	return (
		<div className={`min-h-screen bg-background text-foreground ${className}`}>
			{/* Breadcrumb navigation */}
			{breadcrumbs.length > 0 && (
				<nav
					className="border-b border-border px-6 py-4"
					aria-label="Breadcrumb"
				>
					<ol className="flex items-center space-x-2 text-sm">
						<li>
							<Link
								href="/dashboard/notary-book"
								className="flex items-center text-muted-foreground hover:text-foreground"
							>
								<Home className="mr-1 h-4 w-4" />
								Home
							</Link>
						</li>
						{breadcrumbs.map((crumb, index) => (
							<li key={index} className="flex items-center">
								<ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />
								{crumb.href ? (
									<Link
										href={crumb.href}
										className={`text-sm ${crumb.active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
									>
										{crumb.label}
									</Link>
								) : (
									<span
										className={`text-sm ${crumb.active ? "font-medium text-foreground" : "text-muted-foreground"}`}
									>
										{crumb.label}
									</span>
								)}
							</li>
						))}
					</ol>
				</nav>
			)}

			{/* Main content */}
			<div className="p-6">
				{/* Header with title and actions */}
				<div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<h1 className="text-2xl font-semibold">{title}</h1>
						{breadcrumbs.length === 0 && (
							<p className="mt-1 text-sm text-muted-foreground">
								View and manage your notary book entries
							</p>
						)}
					</div>

					{/* {onSync && (
            <Button
              onClick={onSync}
              disabled={isSyncing}
              variant="outline"
              className="gap-2 h-9"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Sync Data</span>
                </>
              )}
            </Button>
          )} */}
				</div>

				{children}
			</div>
		</div>
	)
}
