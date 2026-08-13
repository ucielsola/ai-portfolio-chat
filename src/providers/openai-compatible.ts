import type { ChatProvider, ChatRequest } from './types.js';

export type OpenAICompatibleOptions = {
	apiKey: string;
	baseUrl?: string;
	fetch?: typeof globalThis.fetch;
};

/** Works with OpenAI and API-compatible endpoints such as OpenRouter or local gateways. */
export function createOpenAICompatibleProvider(options: OpenAICompatibleOptions): ChatProvider {
	const fetcher = options.fetch ?? globalThis.fetch;
	const baseUrl = (options.baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '');
	if (!options.apiKey.trim()) throw new Error('An API key is required for the OpenAI-compatible provider.');

	return {
		name: 'openai-compatible',
		async complete(request) {
			const response = await fetcher(`${baseUrl}/chat/completions`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: request.model,
					messages: request.messages,
					temperature: request.temperature
				}),
				signal: request.signal
			});
			if (!response.ok) throw new Error(`Provider request failed (${response.status}): ${await response.text()}`);
			const payload: unknown = await response.json();
			const text = getCompletionText(payload);
			return { text, model: getModel(payload) };
		}
	};
}

function getCompletionText(payload: unknown): string {
	if (!payload || typeof payload !== 'object') throw new Error('Provider returned an invalid response.');
	const choice = (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0];
	if (typeof choice?.message?.content !== 'string') throw new Error('Provider response did not contain text.');
	return choice.message.content;
}

function getModel(payload: unknown): string | undefined {
	return payload && typeof payload === 'object' && typeof (payload as { model?: unknown }).model === 'string'
		? (payload as { model: string }).model
		: undefined;
}
