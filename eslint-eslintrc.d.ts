declare module "@eslint/eslintrc" {
	export class FlatCompat {
		constructor(options: { baseDirectory: string })
		config(config: Record<string, unknown>): Record<string, unknown>[]
	}
}
