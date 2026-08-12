"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRightIcon, Clock, FileText, MoreVertical, PlusIcon, Trash2 } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/core/components/tooltip"
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/core/components/ui/avatar"
import {
  AvatarGroup,
  AvatarGroupTooltip
} from "@/core/components/ui/avatar-group"
import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/core/components/ui/dropdown-menu"
import { getInitials } from "@/core/lib/utils"

import type { RouterOutputs } from "@/services/trpc/client"

import { formatRelativeTime } from "../utils/date"
import { DeleteEnvelopeDialog } from "./delete-envelope-dialog"
import { useQueryClient } from "@tanstack/react-query"

interface EnvelopeListItemProps {
  envelope: RouterOutputs["envelopeLite"]["getMyEnvelopes"][number]
}

export function EnvelopeListItem({ envelope }: EnvelopeListItemProps) {
  const queryClient = useQueryClient()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Deduplicate recipients based on user ID or email
  const uniqueRecipients = envelope.recipient.filter(
    (recipient, index, self) => {
      const identifier = recipient.user?.id ?? recipient.email
      return (
        index === self.findIndex((r) => (r.user?.id ?? r.email) === identifier)
      )
    }
  )

  const handleDeleteSuccess = () => {
    setIsDropdownOpen(false) // Close dropdown immediately when delete starts
    setIsDeleting(true) // Start deletion animation

    // Invalidate and refetch envelopes to update the list
    void queryClient.invalidateQueries({
      queryKey: [["envelopeLite", "getMyEnvelopes"]]
    })

    // Also invalidate the specific envelope query to prevent stale data
    void queryClient.invalidateQueries({
      queryKey: [["envelopeLite", "getEnvelopeById"]]
    })
  }

  return (
    <Link href={`/envelope/${envelope.id}`} className="block">
      <Card className={`group cursor-pointer border border-border bg-background transition-all duration-300 hover:border-foreground/20 hover:shadow-sm dark:bg-muted/60 ${isDeleting ? "opacity-0 scale-95 transform" : ""
        }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Main content - left side */}
            <div className="flex flex-1 items-center gap-4">
              {/* Title and description */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-foreground">
                  {envelope.title}
                </h3>
                <p className="truncate text-xs text-muted-foreground">
                  {envelope.description ?? "No description"}
                </p>
              </div>

              {/* Recipients */}
              <div className="flex items-center gap-2">
                {uniqueRecipients.length > 0 ? (
                  <AvatarGroup className="h-6 -space-x-1.5">
                    {uniqueRecipients.slice(0, 3).map((recipient, index) => (
                      <Avatar
                        key={recipient.user?.id ?? recipient.email ?? index}
                        className="size-6 border"
                      >
                        <AvatarImage src={recipient.user?.image ?? ""} />
                        <AvatarFallback className="text-[10px] font-medium">
                          {getInitials(
                            recipient.user?.name ?? recipient.name ?? "?"
                          )}
                        </AvatarFallback>
                        <AvatarGroupTooltip>
                          <p className="font-medium">
                            {recipient.user?.name ?? recipient.name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {recipient.user?.email ?? recipient.email}
                          </p>
                        </AvatarGroupTooltip>
                      </Avatar>
                    ))}
                  </AvatarGroup>
                ) : (
                  <AvatarGroup className="h-6 -space-x-1.5">
                    {[
                      <Avatar key="plus" className="size-6 border bg-muted">
                        <AvatarFallback className="text-[10px] font-medium">
                          <PlusIcon className="size-3.5" />
                        </AvatarFallback>
                        <AvatarGroupTooltip>
                          <span className="text-sm">
                            Signetories will show here.
                          </span>
                        </AvatarGroupTooltip>
                      </Avatar>
                    ]}
                  </AvatarGroup>
                )}
                {uniqueRecipients.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{uniqueRecipients.length - 3}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{envelope.documents.filter(doc => !doc.name.includes("_signed")).length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatRelativeTime(envelope.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Actions - right side */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {/* Three dots menu */}
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/envelope/${envelope.id}`} className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      View Envelope
                    </Link>
                  </DropdownMenuItem>
                  <DeleteEnvelopeDialog
                    envelopeId={envelope.id}
                    envelopeTitle={envelope.title}
                    onSuccess={handleDeleteSuccess}
                    trigger={
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Envelope
                      </DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}