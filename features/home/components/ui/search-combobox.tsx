"use client"

import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle, FileTextIcon, FolderIcon, SearchIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import type { Session } from "next-auth"
import { useSession } from "next-auth/react"

import {
	Command,
	CommandEmpty,
	CommandItem,
	CommandList
} from "@/core/components/ui/command"
import { Input } from "@/core/components/ui/input"
import { cn } from "@/core/lib/utils"

import { trpc } from "@/services/trpc/client"

import { ActionButton } from "./action-buttons"

export interface SearchOption {
	value: string
	label: string
	type: "document" | "envelope"
	envelopeId?: string
	description?: string
}

interface SearchComboboxProps {
	placeholders?: string[]
	options?: SearchOption[]
	value?: string
	onChange?: (value: string) => void
	onSelect?: (option: SearchOption) => void
	onCreateEnvelope?: () => void
	onCreateFolder?: () => void
	className?: string
	disabled?: boolean
}

// Simplified animated placeholders hook
function useAnimatedPlaceholders(placeholders: string[]) {
	const [currentIndex, setCurrentIndex] = useState(0)

	useEffect(() => {
		if (placeholders.length <= 1) return

		const id = setInterval(
			() => setCurrentIndex((p) => (p + 1) % placeholders.length),
			3000
		)
		return () => clearInterval(id)
	}, [placeholders.length])

	return currentIndex
}

// Simplified animated placeholder component
function AnimatedPlaceholder({
	placeholders,
	currentIndex,
	show
}: {
	placeholders: string[]
	currentIndex: number
	show: boolean
}) {
	if (!show) return null

	return (
		<div className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2">
			<AnimatePresence mode="wait">
				<motion.span
					key={currentIndex}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="text-sm text-muted-foreground"
				>
					{placeholders[currentIndex]}
				</motion.span>
			</AnimatePresence>
		</div>
	)
}

// Simplified search result item component
const SearchResultItem: React.FC<{
	option: SearchOption
	onSelect: (o: SearchOption) => void
	isActive?: boolean
}> = ({ option, onSelect, isActive }) => {
	const isDocument = option.type === "document"
	const id = `search-item-${option.type}-${option.value}`

	return (
		<CommandItem
			id={id}
			value={option.value}
			onSelect={() => onSelect(option)}
			aria-selected={isActive}
			className={cn(
				"search-combobox__item flex cursor-pointer gap-3 px-3 py-2",
				isActive ? "bg-accent text-accent-foreground" : undefined
			)}
		>
			{isDocument ? (
				<FileTextIcon className="h-4 w-4 text-blue-500" />
			) : (
				<FolderIcon className="h-4 w-4 text-amber-500" />
			)}

			<div className="flex-1 text-start">
				<div className="truncate font-medium">{option.label}</div>
				{option.description && (
					<div className="truncate text-xs text-muted-foreground">
						{option.description}
					</div>
				)}
			</div>

			<span className="text-xs text-muted-foreground">
				{isDocument ? "Document" : "Envelope"}
			</span>
		</CommandItem>
	)
}

// Simplified search dropdown component with positioning
function SearchDropdown({
	isOpen,
	searchValue,
	flatOptions,
	grouped,
	onSelect,
	containerRef,
	isLoading,
	session,
	isAuthLoading,
	activeIndex,
	setActiveIndex
}: {
	isOpen: boolean
	searchValue: string
	flatOptions: SearchOption[]
	grouped: { group: string; items: SearchOption[] }[]
	onSelect: (option: SearchOption) => void
	containerRef: React.RefObject<HTMLDivElement | null>
	isLoading?: boolean
	session: Session | null
	isAuthLoading: boolean
	activeIndex?: number | null
	setActiveIndex?: (n: number | null) => void
}) {
	const [position, setPosition] = useState<"below" | "above">("below")

	useEffect(() => {
		if (!isOpen || !containerRef.current) return

		const rect = containerRef.current.getBoundingClientRect()
		const dropdownHeight = 280
		const below = window.innerHeight - rect.bottom
		const above = rect.top

		setPosition(
			below < dropdownHeight && above > dropdownHeight ? "above" : "below"
		)
	}, [isOpen, containerRef])

	// Scroll the active item into view when the activeIndex changes
	useEffect(() => {
		if (!isOpen || activeIndex === undefined || activeIndex === null) return
		const root = containerRef.current
		if (!root) return
		// CommandList is inside the component; find the element with data-idx
		const el = root.querySelector(`[data-idx="${activeIndex}"]`)
		if (el && typeof (el as HTMLElement).scrollIntoView === "function") {
			;(el as HTMLElement).scrollIntoView({
				block: "nearest",
				behavior: "auto"
			})
		}
	}, [isOpen, activeIndex, containerRef])

	if (!isOpen) return null

	return (
		<AnimatePresence>
			<motion.div
				className={cn(
					"absolute z-50 w-full overflow-hidden rounded-lg border bg-muted shadow-lg",
					position === "above" ? "bottom-full mb-2" : "top-12"
				)}
				initial={{ opacity: 0, height: 0 }}
				animate={{ opacity: 1, height: "auto" }}
				exit={{ opacity: 0, height: 0 }}
				transition={{ duration: 0.18 }}
			>
				<Command shouldFilter={false} className="rounded-b-none">
					{isAuthLoading ? (
						<CommandEmpty>
							<div className="py-6 text-center text-sm text-muted-foreground">
								Loading...
							</div>
						</CommandEmpty>
					) : !session ? (
						<CommandEmpty>
							<div className="py-6 text-center text-sm text-muted-foreground">
								Please sign in to use search.{" "}
								<a href="/auth/login" className="underline">
									Log in
								</a>
							</div>
						</CommandEmpty>
					) : (
						<CommandList className="max-h-60 overflow-y-auto">
							{flatOptions.length === 0 ? (
								<CommandEmpty>
									<div className="py-6 text-center text-sm text-muted-foreground">
										{searchValue
											? "No results found."
											: isLoading
												? "Loading recent items..."
												: "No recent items."}
									</div>
								</CommandEmpty>
							) : (
								grouped.map((g) => (
									<div key={g.group}>
										<div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
											{g.group}
										</div>
										{g.items.map((option) => {
											const globalIdx = flatOptions.findIndex(
												(o) =>
													o.type === option.type && o.value === option.value
											)
											const isActive = globalIdx === activeIndex
											return (
												<div
													key={`${option.type}-${option.value}`}
													data-idx={globalIdx}
													onMouseMove={() => setActiveIndex?.(globalIdx)}
													onMouseLeave={() => setActiveIndex?.(null)}
												>
													<SearchResultItem
														option={option}
														onSelect={onSelect}
														isActive={isActive}
													/>
												</div>
											)
										})}
									</div>
								))
							)}
						</CommandList>
					)}
				</Command>

				<div className="border-t px-3 py-2">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>Click to select</span>
						<span>ESC to cancel</span>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	)
}

export function SearchCombobox({
	placeholders = ["Search documents...", "Find envelopes..."],
	options = [],
	value = "",
	onChange,
	onSelect,
	// Unused callbacks retained for API consistency
	onCreateEnvelope: _onCreateEnvelope,
	onCreateFolder: _onCreateFolder,
	className,
	disabled = false
}: SearchComboboxProps) {
	const [searchValue, setSearchValue] = useState(value)
	const [isFocused, setIsFocused] = useState(false)
	const [activeIndex, setActiveIndex] = useState<number | null>(null)
	const { data: session, status } = useSession()
	const isAuthLoading = status === "loading"
	const inputRef = useRef<HTMLInputElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const currentPlaceholder = useAnimatedPlaceholders(placeholders)
	const router = useRouter()

	// debounce query
	const [debouncedQuery, setDebouncedQuery] = useState("")
	useEffect(() => {
		const id = setTimeout(() => setDebouncedQuery(searchValue), 250)
		return () => clearTimeout(id)
	}, [searchValue])

	const { data: remoteResults } = trpc.home.search.useQuery(
		{ query: debouncedQuery },
		{ enabled: Boolean(debouncedQuery && debouncedQuery.length > 0 && session) }
	)

	const { data: recentResults, isLoading: isLoadingRecent } =
		trpc.home.recent.useQuery(undefined, {
			enabled: Boolean(isFocused && !searchValue && session)
		})

	type InternalOption = SearchOption & { __group?: string }

	type RemoteDocument = {
		id: string
		name: string
		envelopeId?: string | null
		signed?: boolean
	}
	type RemoteEnvelope = {
		id: string
		title: string
		description?: string | null
	}

	const grouped = useMemo(() => {
		const signed: InternalOption[] = []
		const docs: InternalOption[] = []
		const envs: InternalOption[] = []

		const pushDoc = (d: RemoteDocument) =>
			docs.push({
				value: d.id,
				label: d.name,
				type: "document",
				envelopeId: d.envelopeId ?? undefined,
				__group: "documents"
			})
		const pushEnv = (e: RemoteEnvelope) =>
			envs.push({
				value: e.id,
				label: e.title,
				type: "envelope",
				description: e.description ?? undefined,
				__group: "envelopes"
			})

		const remoteDocuments = (remoteResults?.documents ?? []) as RemoteDocument[]
		const remoteEnvelopes = (remoteResults?.envelopes ?? []) as RemoteEnvelope[]
		const recentDocuments = (recentResults?.documents ?? []) as RemoteDocument[]
		const recentEnvelopes = (recentResults?.envelopes ?? []) as RemoteEnvelope[]

		if (searchValue) {
			remoteDocuments.forEach((d) =>
				d.signed
					? signed.push({
							value: d.id,
							label: d.name,
							type: "document",
							envelopeId: d.envelopeId ?? undefined,
							__group: "signed"
						})
					: pushDoc(d)
			)
			remoteEnvelopes.forEach((e) => pushEnv(e))
		} else if (isFocused) {
			recentDocuments.forEach((d) =>
				d.signed
					? signed.push({
							value: d.id,
							label: d.name,
							type: "document",
							envelopeId: d.envelopeId ?? undefined,
							__group: "signed"
						})
					: pushDoc(d)
			)
			recentEnvelopes.forEach((e) => pushEnv(e))
		} else {
			options.forEach((o) => {
				if (o.type === "document") {
					const maybeSigned = (o as SearchOption & { signed?: boolean }).signed
					if (maybeSigned)
						signed.push({ ...(o as InternalOption), __group: "signed" })
					else docs.push({ ...(o as InternalOption), __group: "documents" })
				} else envs.push({ ...(o as InternalOption), __group: "envelopes" })
			})
		}

		const groups: { group: string; items: InternalOption[] }[] = []
		if (signed.length) groups.push({ group: "Signed Documents", items: signed })
		if (docs.length) groups.push({ group: "Documents", items: docs })
		if (envs.length) groups.push({ group: "Envelopes", items: envs })

		return groups
	}, [searchValue, isFocused, remoteResults, recentResults, options])

	const flatOptions: SearchOption[] = useMemo(
		() => grouped.flatMap((g) => g.items),
		[grouped]
	)

	const filteredOptions = flatOptions

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value
			setSearchValue(newValue)
			setActiveIndex(null)
			onChange?.(newValue)
		},
		[onChange]
	)

	const handleSelect = useCallback(
		(option: SearchOption) => {
			setSearchValue(option.label)
			onChange?.(option.value)
			onSelect?.(option)
			setIsFocused(false)
			inputRef.current?.blur()
			setActiveIndex(null)

			if (option.type === "envelope") router.push(`/envelope/${option.value}`)
			else if (option.type === "document")
				router.push(
					option.envelopeId
						? `/envelope/${option.envelopeId}/document/${option.value}`
						: `/envelope/${option.value}`
				)
		},
		[onChange, onSelect, router]
	)

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (!filteredOptions || filteredOptions.length === 0) return

			if (e.key === "ArrowDown") {
				e.preventDefault()
				setActiveIndex((prev) =>
					prev === null ? 0 : Math.min(filteredOptions.length - 1, prev + 1)
				)
			} else if (e.key === "ArrowUp") {
				e.preventDefault()
				setActiveIndex((prev) =>
					prev === null ? filteredOptions.length - 1 : Math.max(0, prev - 1)
				)
			} else if (e.key === "Enter") {
				if (activeIndex !== null) {
					const opt = filteredOptions[activeIndex]
					if (opt) handleSelect(opt)
				}
			} else if (e.key === "Escape") {
				setIsFocused(false)
				setActiveIndex(null)
				inputRef.current?.blur()
			}
		},
		[filteredOptions, activeIndex, handleSelect]
	)

	// Auto-select top result when user types
	useEffect(() => {
		if (searchValue && filteredOptions.length > 0) setActiveIndex(0)
		else
			setActiveIndex((prev) =>
				filteredOptions.length === 0
					? null
					: prev === null
						? null
						: Math.min(prev, filteredOptions.length - 1)
			)
	}, [filteredOptions.length, searchValue])

	// Keep activeIndex clamped
	useEffect(() => {
		if (
			activeIndex !== null &&
			filteredOptions.length > 0 &&
			activeIndex > filteredOptions.length - 1
		)
			setActiveIndex(filteredOptions.length - 1)
		else if (filteredOptions.length === 0) setActiveIndex(null)
	}, [filteredOptions.length, activeIndex])

	const showDropdown = Boolean(isFocused)

	useEffect(() => {
		if (!showDropdown) return

		const onKey = (e: KeyboardEvent) => {
			if (document.activeElement === inputRef.current) return

			if (e.key === "ArrowDown") {
				e.preventDefault()
				setActiveIndex((prev) =>
					prev === null ? 0 : Math.min(filteredOptions.length - 1, prev + 1)
				)
			} else if (e.key === "ArrowUp") {
				e.preventDefault()
				setActiveIndex((prev) =>
					prev === null ? filteredOptions.length - 1 : Math.max(0, prev - 1)
				)
			} else if (e.key === "Enter") {
				if (activeIndex !== null && filteredOptions[activeIndex]) {
					e.preventDefault()
					handleSelect(filteredOptions[activeIndex])
				}
			} else if (e.key === "Escape") {
				setIsFocused(false)
				setActiveIndex(null)
				inputRef.current?.blur()
			}
		}

		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [
		showDropdown,
		filteredOptions,
		filteredOptions.length,
		activeIndex,
		handleSelect
	])

	return (
		<div className={cn("mx-auto w-full max-w-md", className)}>
			{/* Attach keydown handler to the container so arrow keys work even if the input
			   component stops propagation or loses focus. This keeps behavior consistent */}
			<div ref={containerRef} className="relative">
				<div className="flex w-full items-center gap-2">
					<div className="relative flex-1">
						<Input
							ref={inputRef}
							type="text"
							value={searchValue}
							onChange={handleInputChange}
							onFocus={() => setIsFocused(true)}
							onBlur={() => setTimeout(() => setIsFocused(false), 200)}
							onKeyDown={handleKeyDown}
							aria-activedescendant={
								activeIndex !== null && filteredOptions[activeIndex]
									? `search-item-${filteredOptions[activeIndex].type}-${filteredOptions[activeIndex].value}`
									: undefined
							}
							disabled={disabled}
							placeholder=""
							className="bg-white/90 pl-10 shadow-sm backdrop-blur-sm hover:bg-white/95 dark:border-white/10 dark:bg-muted/90 dark:hover:bg-muted/95"
						/>
						<SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

						<AnimatedPlaceholder
							placeholders={placeholders}
							currentIndex={currentPlaceholder}
							show={!searchValue}
						/>
					</div>

					<div className="flex gap-2">
						<ActionButton
							href="/envelopes"
							label="My Envelopes"
							Icon={FolderIcon}
							disabled={disabled}
						/>
						<ActionButton
							href="/my-signed"
							label="My Signed"
							Icon={CheckCircle}
							disabled={disabled}
						/>
					</div>
				</div>

				<SearchDropdown
					isOpen={showDropdown}
					searchValue={searchValue}
					flatOptions={flatOptions}
					grouped={grouped}
					onSelect={handleSelect}
					containerRef={containerRef}
					isLoading={isLoadingRecent}
					session={session}
					isAuthLoading={isAuthLoading}
					activeIndex={activeIndex}
					setActiveIndex={setActiveIndex}
				/>
			</div>
		</div>
	)
}
