"use client"

import { ChevronRight } from "lucide-react"

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/core/components/tooltip"
import { Button } from "@/core/components/ui/button"
import {
	DisclosureTrigger,
	useDisclosure
} from "@/core/components/ui/disclosure"

export function DisclosureTriggerButton() {
	const { open } = useDisclosure()

	return (
		<Tooltip>
			<TooltipTrigger>
				<DisclosureTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="group/trigger h-8 w-8 rounded-none border-r hover:bg-muted"
					>
						<ChevronRight
							className={`size-4 transition-transform duration-200 group-hover/trigger:rotate-90 ${
								open ? "rotate-90 group-hover/trigger:-rotate-[0deg]" : ""
							}`}
						/>
					</Button>
				</DisclosureTrigger>
			</TooltipTrigger>
			<TooltipContent>Show Details</TooltipContent>
		</Tooltip>
	)
}
