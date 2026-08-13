import type { SiteConfig } from '../config/site.js';

/** Langfuse is optional; a host adapts the SDK version it chooses to this port. */
export type PromptTemplate = { compile(values: Record<string, string>): string };

export interface LangfusePort {
	getPrompt?(name: string, options: { label: string }): Promise<PromptTemplate>;
	trace?(event: {
		name: string;
		input?: unknown;
		output?: unknown;
		metadata?: Record<string, unknown>;
	}): Promise<void> | void;
}

export type PromptId = 'portfolioAssistant';
export type PortfolioPromptVariables = { name: string; headline: string; question: string; context: string };
type PromptDefinition = {
	name: string;
	label: string;
	localFallback: (variables: PortfolioPromptVariables) => string;
};

export type PromptCatalog = Record<PromptId, PromptDefinition>;

/** Every model-facing prompt has a named remote version and a checked-in fallback. */
export function createPromptCatalog(config: SiteConfig): PromptCatalog {
	const remote = config.langfuse.prompts.portfolioAssistant;
	return {
		portfolioAssistant: {
			name: remote.name,
			label: remote.label,
			localFallback: () =>
				'Use an approachable, concise tone. Emphasize relevant outcomes and invite a useful follow-up when appropriate.'
		}
	};
}

export type PromptResolverOptions = { port?: LangfusePort; timeoutMs?: number };

export function createPromptResolver(config: SiteConfig, options: PromptResolverOptions = {}) {
	const catalog = createPromptCatalog(config);
	const timeoutMs = options.timeoutMs ?? 1_500;
	return {
		async resolve(id: PromptId, variables: PortfolioPromptVariables): Promise<string> {
			const prompt = catalog[id];
			if (!config.langfuse.enabled || !options.port?.getPrompt) return prompt.localFallback(variables);
			try {
				const template = await withTimeout(
					options.port.getPrompt(prompt.name, { label: prompt.label }),
					timeoutMs
				);
				const compiled = template.compile(variables);
				if (typeof compiled !== 'string' || !compiled.trim()) throw new Error('Langfuse returned an invalid prompt.');
				return compiled.trim();
			} catch {
				return prompt.localFallback(variables);
			}
		}
	};
}

function withTimeout<T>(value: Promise<T>, timeoutMs: number): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('Langfuse prompt request timed out.')), timeoutMs);
		value.then(resolve, reject).finally(() => clearTimeout(timer));
	});
}

export async function safelyTrace(port: LangfusePort | undefined, event: Parameters<NonNullable<LangfusePort['trace']>>[0]): Promise<void> {
	try {
		await port?.trace?.(event);
	} catch {
		// Do not leak telemetry failures into a visitor-facing response.
	}
}
