import { SiteNavbar } from "@/core/components/navbar/site-navbar"

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<SiteNavbar items={[{ label: "My Signed", url: "/my-signed" }]} />

			<main className="">{children}</main>
		</div>
	)
}
