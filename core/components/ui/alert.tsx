import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/lib/utils"

const alertVariants = cva(
	// "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
	"relative w-full rounded-lg border px-4 py-3 text-sm flex items-start gap-x-3 gap-y-0.5 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
	{
		variants: {
			variant: {
				default: "bg-card text-card-foreground",
				destructive:
					"text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	}
)

function Alert({
	className,
	variant,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
	return (
		<div
			data-slot="alert"
			role="alert"
			className={cn(alertVariants({ variant }), className)}
			{...props}
		/>
	)
}

function AlertContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-content"
			className={cn("flex w-full flex-col items-start", className)}
			{...props}
		/>
	)
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-title"
			className={cn(
				"line-clamp-1 flex min-h-4 items-center font-medium tracking-tight",
				className
			)}
			{...props}
		/>
	)
}

function AlertDescription({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-description"
			className={cn(
				"flex flex-col items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed",
				className
			)}
			{...props}
		/>
	)
}

function AlertActions({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-actions"
			className={cn("flex items-center gap-x-3", className)}
			{...props}
		/>
	)
}

export { Alert, AlertActions, AlertContent, AlertTitle, AlertDescription }
