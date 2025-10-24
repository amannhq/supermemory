import Supermemory from "supermemory"
import { tool } from "ai"
import { z } from "zod"
import {
	DEFAULT_VALUES,
	PARAMETER_DESCRIPTIONS,
	TOOL_DESCRIPTIONS,
	getContainerTags,
} from "./shared"
import type { SupermemoryToolsConfig } from "./types"

// Export individual tool creators
export const searchMemoriesTool = (
	apiKey: string,
	config?: SupermemoryToolsConfig,
) => {
	const client = new Supermemory({
		apiKey,
		...(config?.baseUrl ? { baseURL: config.baseUrl } : {}),
	})

	const containerTags = getContainerTags(config)

	const schema = z.object({
		informationToGet: z
			.string()
			.describe(PARAMETER_DESCRIPTIONS.informationToGet),
		includeFullDocs: z
			.boolean()
			.optional()
			.default(DEFAULT_VALUES.includeFullDocs)
			.describe(PARAMETER_DESCRIPTIONS.includeFullDocs),
		limit: z
			.number()
			.optional()
			.default(DEFAULT_VALUES.limit)
			.describe(PARAMETER_DESCRIPTIONS.limit),
	})

	return tool({
		description: TOOL_DESCRIPTIONS.searchMemories,
		parameters: schema,
		// @ts-expect-error - Zod v4 compatibility with AI SDK v5
		execute: async ({
			informationToGet,
			includeFullDocs,
			limit,
		}: {
			informationToGet: string
			includeFullDocs?: boolean
			limit?: number
		}) => {
			try {
				const response = await client.search.execute({
					q: informationToGet,
					containerTags,
					limit: limit ?? DEFAULT_VALUES.limit,
					chunkThreshold: DEFAULT_VALUES.chunkThreshold,
					includeFullDocs: includeFullDocs ?? DEFAULT_VALUES.includeFullDocs,
				})

				return {
					success: true,
					results: response.results,
					count: response.results?.length || 0,
				}
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				}
			}
		},
	})
}

export const addMemoryTool = (
	apiKey: string,
	config?: SupermemoryToolsConfig,
) => {
	const client = new Supermemory({
		apiKey,
		...(config?.baseUrl ? { baseURL: config.baseUrl } : {}),
	})

	const containerTags = getContainerTags(config)

	const schema = z.object({
		memory: z.string().describe(PARAMETER_DESCRIPTIONS.memory),
	})

	return tool({
		description: TOOL_DESCRIPTIONS.addMemory,
		parameters: schema,
		// @ts-expect-error - Zod v4 compatibility with AI SDK v5
		execute: async ({ memory }: { memory: string }) => {
			try {
				const metadata: Record<string, string | number | boolean> = {}

				const response = await client.memories.add({
					content: memory,
					containerTags,
					...(Object.keys(metadata).length > 0 && { metadata }),
				})

				return {
					success: true,
					memory: response,
				}
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				}
			}
		},
	})
}

/**
 * Create Supermemory tools for AI SDK
 */
export function supermemoryTools(
	apiKey: string,
	config?: SupermemoryToolsConfig,
) {
	return {
		searchMemories: searchMemoriesTool(apiKey, config),
		addMemory: addMemoryTool(apiKey, config),
	}
}

export { withSupermemory } from "./vercel"
