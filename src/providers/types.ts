export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = { role: ChatRole; content: string };

export type ChatRequest = {
	model: string;
	messages: ChatMessage[];
	temperature?: number;
	signal?: AbortSignal;
};

/** Minimal common denominator for an LLM provider. Implement this to swap vendors. */
export interface ChatProvider {
	readonly name: string;
	complete(request: ChatRequest): Promise<{ text: string; model?: string }>;
	stream?(request: ChatRequest): AsyncIterable<string>;
}
