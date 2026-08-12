import { Briefcase, FileText, User as UserIcon } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle
} from "@/core/components/ui/sheet"

import { type User } from "../api/user.schema"

interface ClientProfileProps {
	user: User | null
	isOpen: boolean
	onClose: () => void
	getRoleBadge: (role: string) => string
	getStatusBadge: (verified: Date | null) => string
}

export function ClientProfile({
	user,
	isOpen,
	onClose,
	getRoleBadge,
	getStatusBadge
}: ClientProfileProps) {
	const getRoleDisplayName = (role: string) => {
		switch (role) {
			case "CLIENT":
				return "Client"
			case "ADMIN":
				return "Administrator"
			case "SUPER_ADMIN":
				return "Super Administrator"
			default:
				return role
		}
	}

	return (
		<Sheet open={isOpen} onOpenChange={onClose}>
			<SheetContent side="right" className="w-[400px] sm:w-[540px]">
				<SheetHeader>
					<SheetTitle>Client Profile</SheetTitle>
					<SheetDescription>
						View detailed information about this client
					</SheetDescription>
				</SheetHeader>

				{user && (
					<div className="mt-6 space-y-6">
						{/* User Avatar and Basic Info */}
						<div className="flex items-center space-x-4">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
								<UserIcon className="h-8 w-8 text-gray-500" />
							</div>
							<div>
								<h3 className="text-lg font-semibold">{user.name}</h3>
								<p className="text-sm text-gray-500">{user.email}</p>
							</div>
						</div>

						{/* User Details */}
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-gray-500">
										Role
									</label>
									<div className="mt-1">
										<Badge className={getRoleBadge(user.role)}>
											{user.role === "ADMIN" ? (
												<Briefcase className="mr-1 h-3 w-3" />
											) : user.role === "SUPER_ADMIN" ? (
												<FileText className="mr-1 h-3 w-3" />
											) : (
												<UserIcon className="mr-1 h-3 w-3" />
											)}
											{getRoleDisplayName(user.role)}
										</Badge>
									</div>
								</div>

								<div>
									<label className="text-sm font-medium text-gray-500">
										Status
									</label>
									<div className="mt-1">
										<Badge
											className={getStatusBadge(
												user.emailVerified ? new Date(user.emailVerified) : null
											)}
										>
											{user.emailVerified ? "Active" : "Inactive"}
										</Badge>
									</div>
								</div>
							</div>

							{user.organization && (
								<div>
									<label className="text-sm font-medium text-gray-500">
										Organization
									</label>
									<p className="mt-1 text-sm">{user.organization}</p>
								</div>
							)}

							<div>
								<label className="text-sm font-medium text-gray-500">
									Email Verified
								</label>
								<p className="mt-1 text-sm">
									{user.emailVerified
										? new Date(user.emailVerified).toLocaleDateString()
										: "Not verified"}
								</p>
							</div>

							<div>
								<label className="text-sm font-medium text-gray-500">
									User ID
								</label>
								<p className="mt-1 font-mono text-sm text-gray-600">
									{user.id}
								</p>
							</div>
						</div>

						{/* Activity Section */}
						<div className="border-t pt-4">
							<h4 className="mb-3 text-sm font-medium text-gray-900">
								Activity
							</h4>
							<div className="flex items-center space-x-1 text-sm text-gray-500">
								<FileText className="h-4 w-4" />
								<span>0 documents</span>
							</div>
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
}
