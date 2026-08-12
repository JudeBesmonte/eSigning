"use client"

import { UserPlus } from "lucide-react"

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/core/components/tooltip"
import { Button } from "@/core/components/ui/button"

interface AddSignersButtonProps {
	envelopeId: string
	documentId: string
}

export function AddSignersButton({
	envelopeId,
	documentId
}: AddSignersButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 rounded-none border-r hover:bg-muted"
					asChild
				>
					<a
						href={`/envelope/${envelopeId}/document/${documentId}/update-prepositioning`}
					>
						<UserPlus className="size-4" />
					</a>
				</Button>
			</TooltipTrigger>
			<TooltipContent>Add Signers</TooltipContent>
		</Tooltip>
	)
}
