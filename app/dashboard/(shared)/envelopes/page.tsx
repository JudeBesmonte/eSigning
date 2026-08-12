import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/core/components/ui/tabs"

import { CreateEnvelopeForm } from "@/features/envelopes/components/forms/create-envelope-form"
import { MyEnvelopes } from "@/features/envelopes/components/my-envelopes"

export default async function Page() {
	return (
		<>
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Envelopes</h1>
				<p className="text-muted-foreground">
					Create and manage digital signature envelopes.
				</p>
			</div>

			<Tabs className="mt-6 space-y-4" defaultValue="list">
				<TabsList>
					<TabsTrigger value="list">My Envelopes</TabsTrigger>
					<TabsTrigger value="create">Create Envelope</TabsTrigger>
				</TabsList>

				<TabsContent value="list" className="space-y-4" asChild>
					<MyEnvelopes />
				</TabsContent>

				<TabsContent value="create" className="space-y-4" asChild>
					<CreateEnvelopeForm />
				</TabsContent>
			</Tabs>
		</>
	)
}
