import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);
const url = z.string().url();

export const ContactSchema = z
	.object({
		email: z.string().email().optional(),
		linkedin: url.optional(),
		github: url.optional(),
		website: url.optional()
	})
	.strict();

export const PortfolioSourceSchema = z
	.object({
		/** Markdown or plain text supplied to the chat at request time. */
		content: nonEmpty,
		/** A stable label useful for tracing and citations in a host app. */
		label: nonEmpty.default('Portfolio profile')
	})
	.strict();

export const ProviderConfigSchema = z
	.discriminatedUnion('kind', [
		z
			.object({
				kind: z.literal('openai-compatible'),
				model: nonEmpty.default('gpt-4o-mini'),
				apiKeyEnv: nonEmpty.default('OPENAI_API_KEY'),
				baseUrl: url.default('https://api.openai.com/v1'),
				temperature: z.number().min(0).max(2).default(0.2)
			})
			.strict(),
		z
			.object({
				kind: z.literal('custom'),
				adapter: nonEmpty,
				model: nonEmpty,
				temperature: z.number().min(0).max(2).default(0.2)
			})
			.strict()
	]);

export const LangfuseConfigSchema = z
	.object({
		enabled: z.boolean().default(false),
		publicKeyEnv: nonEmpty.default('LANGFUSE_PUBLIC_KEY'),
		secretKeyEnv: nonEmpty.default('LANGFUSE_SECRET_KEY'),
		baseUrl: url.default('https://cloud.langfuse.com'),
		prompts: z
			.object({
				/** The remote prompt supplies optional style guidance, never policy or portfolio context. */
				portfolioAssistant: z
					.object({ name: nonEmpty.default('Portfolio Assistant'), label: nonEmpty.default('production') })
					.strict()
					.default({})
			})
			.strict()
			.default({})
	})
	.strict();

export const SiteConfigSchema = z
	.object({
		site: z
			.object({ name: nonEmpty, url: url.optional(), locale: nonEmpty.default('en') })
			.strict(),
		person: z
			.object({
				name: nonEmpty,
				headline: nonEmpty,
				pronouns: nonEmpty.optional(),
				contact: ContactSchema.default({})
			})
			.strict(),
		portfolio: z.array(PortfolioSourceSchema).min(1),
		chat: z
			.object({
				provider: ProviderConfigSchema,
				maxHistoryMessages: z.number().int().min(0).max(50).default(8),
				maxMessageChars: z.number().int().min(100).max(20_000).default(2_000),
				offTopicReply: nonEmpty.optional()
			})
			.strict(),
		langfuse: LangfuseConfigSchema.default({})
	})
	.strict();

export type SiteConfig = z.infer<typeof SiteConfigSchema>;

/** Parses and applies defaults once at application startup; fail fast on bad site data. */
export function defineSiteConfig(input: unknown): SiteConfig {
	return SiteConfigSchema.parse(input);
}
