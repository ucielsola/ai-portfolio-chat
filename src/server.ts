import { createPortfolioChat, type PortfolioChatOptions } from './chat.js';
import type { SiteConfig } from './config/site.js';
import { createProvider, type ProviderFactory } from './providers/registry.js';

export type PortfolioChatPostHandlerOptions = PortfolioChatOptions & {
	/** Supply server-only environment variables, such as `process.env`. */
	env: Record<string, string | undefined>;
	/** Adapters for `custom` provider configurations. */
	customProviders?: Record<string, ProviderFactory>;
};

/**
 * Creates a framework-neutral POST handler using the standard Web Request/Response APIs.
 * Mount the returned function only in server code; it creates the provider from server env.
 */
export function createPortfolioChatPostHandler(config: SiteConfig, options: PortfolioChatPostHandlerOptions) {
	const provider = createProvider(config.chat.provider, options.env, options.customProviders);
	const chat = createPortfolioChat(config, provider, options);

	return async function handlePortfolioChatPost(request: Request): Promise<Response> {
		if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });

		let payload: unknown;
		try {
			payload = await request.json();
		} catch {
			return json({ error: 'Request body must be valid JSON.' }, 400);
		}

		if (!isQuestionRequest(payload)) return json({ error: 'A non-empty question is required.' }, 400);

		try {
			const answer = await chat.answer({ question: payload.question });
			return json({ answer });
		} catch {
			// Provider and tracing details may contain sensitive context, so stay server-side.
			return json({ error: 'Unable to answer right now.' }, 502);
		}
	};
}

function isQuestionRequest(value: unknown): value is { question: string } {
	return (
		typeof value === 'object' &&
		value !== null &&
		'question' in value &&
		typeof (value as { question?: unknown }).question === 'string' &&
		(value as { question: string }).question.trim().length > 0
	);
}

function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
	});
}
