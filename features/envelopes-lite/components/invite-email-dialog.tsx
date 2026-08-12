"use client"

import { useRef, useState, useEffect } from "react"
import { Loader2, Mail, UserIcon, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/core/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/core/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/core/components/ui/dialog"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { normalCase } from "@/core/lib/utils"

import { trpc } from "@/services/trpc/client"

const emailSchema = z.string().email("Please enter a valid email address")

interface InviteEmailDialogProps {
  envelopeId: string
  documentId: string
  placeholderName: string
  trigger?: React.ReactNode
}

export function InviteEmailDialog({
  envelopeId,
  documentId,
  placeholderName,
  trigger
}: InviteEmailDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const emailInputRef = useRef<HTMLInputElement | null>(null)

  // Search for existing users
  const {
    data: searchResults = [],
    isLoading: isSearching
  } = trpc.envelope.searchUsers.useQuery(
    { query: email, limit: 6 },
    {
      enabled: email.length >= 2 && showSuggestions,
      staleTime: 30000
    }
  )

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Filter suggestions and add external email option
  const suggestions = searchResults.filter(user => user.email && user.email !== email)
  const externalEmailSuggestion =
    emailRegex.test(email) &&
      !suggestions.some(s => s.email === email.toLowerCase())
      ? [{
        id: `external-${email}`,
        name: email,
        email: email.toLowerCase(),
        role: "CLIENT" as const,
        isExternal: true
      }]
      : []

  const allSuggestions = [
    ...suggestions.map(s => ({
      ...s,
      email: s.email!, // We filtered out null emails above
      isExternal: false
    })),
    ...externalEmailSuggestion
  ]

  const { mutateAsync, isPending } =
    trpc.envelopeLite.sendInviteEmailToPlaceholder.useMutation({
      onSuccess: () => {
        toast.success("Invitation email sent")
        setOpen(false)
        setEmail("")
        setShowSuggestions(false)
      },
      onError: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to send invitation"
        toast.error(message)
      }
    })

  // Handle email input changes
  const handleEmailChange = (value: string) => {
    setEmail(value)
    setShowSuggestions(value.length >= 1)
    setSelectedIndex(-1)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === "Enter") {
        e.preventDefault()
        void onSubmit()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          setEmail(allSuggestions[selectedIndex].email)
          setShowSuggestions(false)
          setSelectedIndex(-1)
        } else {
          void onSubmit()
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle suggestion selection
  const selectSuggestion = (suggestion: typeof allSuggestions[0]) => {
    setEmail(suggestion.email)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    toast.success(`Selected ${suggestion.name}`)
  }

  // Handle blur with delay to allow for clicks
  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150)
  }

  // Handle focus
  const handleFocus = () => {
    if (email.length >= 1) {
      setShowSuggestions(true)
    }
  }

  const onSubmit = async () => {
    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email")
      emailInputRef.current?.focus()
      return
    }
    await mutateAsync({
      envelopeId,
      documentId,
      placeholderName,
      recipientEmail: email
    })
  }

  const emailValid = emailSchema.safeParse(email).success

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setEmail("")
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Mail className="mr-1 h-3.5 w-3.5" />
            Invite via Email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite signer via email</DialogTitle>
          <DialogDescription>
            Send a signing invitation to a specific email for placeholder &quot;
            {placeholderName}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              ref={emailInputRef}
              className="pr-8"
            />
            {showSuggestions && email.length >= 1 && (
              <ChevronDown className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            )}

            {/* Autocomplete Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 z-50 w-full rounded-md border bg-popover p-0 text-popover-foreground shadow-md">
                <Command>
                  <CommandList>
                    {isSearching && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
                        Searching...
                      </div>
                    )}

                    {!isSearching && allSuggestions.length === 0 && (
                      <CommandEmpty>
                        {emailRegex.test(email)
                          ? "Press Enter to use this email"
                          : "Type a valid email address"
                        }
                      </CommandEmpty>
                    )}

                    {!isSearching && allSuggestions.length > 0 && (
                      <CommandGroup>
                        {allSuggestions.map((suggestion, index) => (
                          <CommandItem
                            key={suggestion.email}
                            onSelect={() => selectSuggestion(suggestion)}
                            className={`cursor-pointer ${index === selectedIndex ? "bg-accent" : ""
                              }`}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center gap-3">
                                {suggestion.isExternal ? (
                                  <Mail className="size-4 text-muted-foreground" />
                                ) : (
                                  <UserIcon className="size-4 text-muted-foreground" />
                                )}
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {suggestion.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {suggestion.email}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {suggestion.isExternal && (
                                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                    External
                                  </span>
                                )}
                                {!suggestion.isExternal && (
                                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                    {normalCase(suggestion.role)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </div>
            )}
          </div>

          {/* Help Text */}
          <p className="text-xs text-muted-foreground">
            Start typing to search for existing users or enter any email address.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={Boolean(isPending)}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!emailValid || Boolean(isPending)}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Send
              </>
            ) : (
              "Send"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
