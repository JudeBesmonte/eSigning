import { UploadIdWithMistral } from "@/features/id-info-ocr/components/upload-id-with-mistral"

export default function IdOcrTestPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-4xl">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">ID OCR Test</h1>
					<p className="mt-2 text-gray-600">
						Test both Tesseract.js and Mistral AI for extracting information
						from Philippine IDs
					</p>
				</div>

				<UploadIdWithMistral />

				<div className="mt-8 rounded-lg bg-blue-50 p-4">
					<h3 className="mb-2 font-semibold text-blue-900">Testing Tips:</h3>
					<ul className="space-y-1 text-sm text-blue-800">
						<li>
							• Use clear, well-lit images of Philippine driver&apos;s licenses
						</li>
						<li>• Ensure the ID is flat and not skewed</li>
						<li>• Try both methods to compare accuracy</li>
						<li>
							• Mistral AI should provide better accuracy for complex layouts
						</li>
						<li>• Check the console for detailed debug information</li>
					</ul>
				</div>
			</div>
		</div>
	)
}
