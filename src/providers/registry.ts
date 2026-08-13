import type { ProviderConfigSchema } from '../config/site.js';
import type { z } from 'zod';
import { createOpenAICompatibleProvider } from './openai-compatible.js';
import type { ChatProvider } from './types.js';

type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type ProviderFactory = (config: Extract<ProviderConfig, { kind: 'custom' }>) => ChatProvider;

export function createProvider(config: ProviderConfig, env: Record<string, string | undefined>, custom: Record<string, ProviderFactory> = {}): ChatProvider {
	if (config.kind === 'openai-compatible') {
		const apiKey = env[config.apiKeyEnv];
		if (!apiKey) throw new Error(`Missing required environment variable: ${config.apiKeyEnv}`);
		return createOpenAICompatibleProvider({ apiKey, baseUrl: config.baseUrl });
	}
	const factory = custom[config.adapter];
	if (!factory) throw new Error(`No provider adapter registered for "${config.adapter}".`);
	return factory(config);
}
