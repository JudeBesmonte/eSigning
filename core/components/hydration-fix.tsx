"use client"

import { useEffect } from "react"

export function HydrationFix() {
	useEffect(() => {
		// Remove browser extension attributes that cause hydration mismatches
		const removeExtensionAttributes = () => {
			// Remove fdprocessedid attributes added by form autofill extensions
			const inputs = document.querySelectorAll("input[fdprocessedid]")
			inputs.forEach((input) => {
				input.removeAttribute("fdprocessedid")
			})

			// Remove other common extension attributes
			const elements = document.querySelectorAll("[data-form-type]")
			elements.forEach((element) => {
				element.removeAttribute("data-form-type")
			})
		}

		// Run after hydration
		const timer = setTimeout(removeExtensionAttributes, 0)
		return () => clearTimeout(timer)
	}, [])

	return null
}
