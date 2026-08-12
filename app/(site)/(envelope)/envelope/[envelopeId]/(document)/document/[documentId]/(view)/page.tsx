import { SiteNavbar } from "@/core/components/navbar/site-navbar"

import { HydrateClient, trpc } from "@/services/trpc/server"

import { DocumentPreviewPage } from "@/features/envelopes-lite/components/document-preview-page"

export default async function Page({
	params
}: {
	params: Promise<{ envelopeId: string; documentId: string }>
}) {
	const { envelopeId, documentId } = await params

	// Prefetch envelope and document data on the server so the client component hydrates instantly
	await trpc.envelopeLite.getEnvelopeById.prefetch({ envelopeId })
	await trpc.envelopeLite.getDocumentForViewing.prefetch({
		envelopeId,
		documentId
	})

	return (
		<HydrateClient>
			<SiteNavbar
				items={[
					{ label: "Envelopes", url: "/envelopes" },
					{ label: "Document View", url: `/envelopes/${envelopeId}` }
				]}
			/>

			<DocumentPreviewPage envelopeId={envelopeId} documentId={documentId} />
		</HydrateClient>
	)
}
