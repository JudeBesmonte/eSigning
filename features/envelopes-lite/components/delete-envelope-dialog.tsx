"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/core/components/ui/alert-dialog"
import { Button } from "@/core/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/core/components/tooltip"

import { trpc } from "@/services/trpc/client"

interface DeleteEnvelopeDialogProps {
  envelopeId: string
  envelopeTitle: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function DeleteEnvelopeDialog({
  envelopeId,
  envelopeTitle,
  trigger,
  onSuccess
}: DeleteEnvelopeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const deleteEnvelope = trpc.envelopeLite.deleteEnvelope.useMutation({
    onSuccess: () => {
      toast.success("Envelope deleted successfully!")
      setIsOpen(false)

      // Always redirect to envelopes list after successful deletion
      router.push("/envelopes")

      // Call custom success handler if provided (for cache invalidation)
      if (onSuccess) {
        onSuccess()
      }
    },
    onError: (error) => {
      console.error("Delete envelope error:", error)
      toast.error("Failed to delete envelope. Please try again.")
    }
  })

  const handleDelete = () => {
    deleteEnvelope.mutate({ envelopeId })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Envelope</TooltipContent>
          </Tooltip>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Envelope</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{envelopeTitle}&rdquo;? This action cannot be undone and will permanently delete:
          </AlertDialogDescription>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>All documents in this envelope</li>
            <li>All recipient assignments</li>
            <li>All signature data</li>
            <li>All audit history for this envelope</li>
          </ul>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteEnvelope.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteEnvelope.isPending ? "Deleting..." : "Delete Envelope"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}