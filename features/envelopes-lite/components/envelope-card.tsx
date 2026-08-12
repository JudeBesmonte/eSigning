"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Clock,
  FileText,
  MoreVertical,
  PlusIcon,
  Trash2
} from "lucide-react"

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/core/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/core/components/ui/dropdown-menu"
import { Separator } from "@/core/components/ui/separator"
import { getInitials } from "@/core/lib/utils"

import type { RouterOutputs } from "@/services/trpc/client"

import { formatRelativeTime } from "../utils/date"
import { DeleteEnvelopeDialog } from "./delete-envelope-dialog"
import { useQueryClient } from "@tanstack/react-query"

export function EnvelopeCard({
  envelope
}: {
  envelope: RouterOutputs["envelopeLite"]["getMyEnvelopes"][number]
}) {
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
      <Card className={`group flex h-full cursor-pointer flex-col overflow-hidden border border-border bg-background transition-all duration-300 hover:border-foreground/20 hover:shadow-sm dark:bg-muted/60 ${isDeleting ? "opacity-0 scale-95 transform" : ""
        }`}>
        <CardHeader className="group flex flex-1 flex-row items-start justify-between">
          <div className="flex flex-col gap-1 flex-1">
            <CardTitle className="text-sm">{envelope.title}</CardTitle>
            <CardDescription className="text-xs">
              {envelope.description ?? "No description"}
            </CardDescription>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Actions Dropdown Menu */}
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="!mt-0 h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
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
        </CardHeader>

        <CardContent className="pb-4 pt-4">
          <Separator />
        </CardContent>

        <CardFooter className="flex flex-row items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {uniqueRecipients.length > 0 ? (
              <div className="flex items-center gap-2">
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
                {uniqueRecipients.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{uniqueRecipients.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <AvatarGroup className="h-6 -space-x-1.5">
                {[
                  <Avatar key="plus" className="size-6 border bg-muted">
                    <AvatarFallback className="text-[10px] font-medium">
                      <PlusIcon className="size-3.5" />
                    </AvatarFallback>
                    <AvatarGroupTooltip>
                      <span className="text-sm">Signetories will show here.</span>
                    </AvatarGroupTooltip>
                  </Avatar>
                ]}
              </AvatarGroup>
            )}
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span>{envelope.documents.filter(doc => !doc.name.includes("_signed")).length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatRelativeTime(envelope.updatedAt)}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}