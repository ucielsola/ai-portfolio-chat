import type { SiteConfig } from './config/site.js';
import { resolveSystemPrompt, safelyTrace, type OptionalLangfuse } from './observability/langfuse.js';
import { createPortfolioSystemPrompt, getOffTopicReply } from './prompts/portfolio.js';
import type { ChatMessage, ChatProvider } from './providers/types.js';

export type PortfolioChat = {
	answer(input: { question: string; history?: ChatMessage[]; signal?: AbortSignal }): Promise<string>;
};

/** Create the framework-independent request pipeline used by API routes or server actions. */
export function createPortfolioChat(config: SiteConfig, provider: ChatProvider, langfuse: OptionalLangfuse = { enabled: false, promptLabel: 'production' }): PortfolioChat {
	return {
		async answer({ question, history = [], signal }) {
			const cleanedQuestion = question.trim();
			if (!cleanedQuestion) throw new Error('A question is required.');
			if (cleanedQuestion.length > config.chat.maxMessageChars) throw new Error('Question exceeds the configured length limit.');

			const localPrompt = createPortfolioSystemPrompt(config, cleanedQuestion);
			const system = await resolveSystemPrompt(localPrompt, {
				name: config.person.name,
				headline: config.person.headline,
				question: cleanedQuestion,
				context: config.portfolio.map((source) => source.content).join('\n\n')
			}, langfuse);
			const messages: ChatMessage[] = [
				{ role: 'system', content: system },
				...history
					.filter((message) => message.role === 'user' || message.role === 'assistant')
					.slice(-config.chat.maxHistoryMessages),
				{ role: 'user', content: cleanedQuestion }
			];

			try {
				const result = await provider.complete({
					model: config.chat.provider.model,
					messages,
					temperature: config.chat.provider.temperature,
					signal
				});
				await safelyTrace(langfuse.enabled ? langfuse.port : undefined, {
					name: 'portfolio-chat',
					input: { question: cleanedQuestion },
					output: { answer: result.text },
					metadata: { provider: provider.name, model: result.model ?? config.chat.provider.model }
				});
				return result.text;
			} catch (error) {
				await safelyTrace(langfuse.enabled ? langfuse.port : undefined, {
					name: 'portfolio-chat',
					input: { question: cleanedQuestion },
					metadata: { provider: provider.name, error: error instanceof Error ? error.message : 'Unknown error' }
				});
				throw error;
			}
		}
	};
}

export { getOffTopicReply };
