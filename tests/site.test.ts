import { describe, expect, it, vi } from 'vitest';
import { createPortfolioChat } from '../src/chat.js';
import { defineSiteConfig } from '../src/config/site.js';
import { createPortfolioSystemPrompt } from '../src/prompts/portfolio.js';

const config = defineSiteConfig({
	site: { name: 'Ada Portfolio' },
	person: { name: 'Ada Example', headline: 'Full-stack engineer' },
	portfolio: [{ content: 'Ada built accessible products with TypeScript.' }],
	chat: { provider: { kind: 'custom', adapter: 'test', model: 'test-model' } }
});

describe('site config and portfolio chat', () => {
	it('applies safe defaults and rejects malformed config', () => {
		expect(config.chat.maxMessageChars).toBe(2000);
		expect(() => defineSiteConfig({})).toThrow();
	});

	it('builds a portfolio-bounded prompt', () => {
		const prompt = createPortfolioSystemPrompt(config, 'What did Ada build?');
		expect(prompt).toContain('Ada Example');
		expect(prompt).toContain('Use only the portfolio context');
		expect(prompt).toContain('accessible products');
	});

	it('uses the provider adapter and traces only when configured', async () => {
		const complete = vi.fn().mockResolvedValue({ text: 'A concise answer.' });
		const trace = vi.fn();
		const chat = createPortfolioChat(config, { name: 'test', complete }, { enabled: true, port: { trace }, promptLabel: 'production' });
		await expect(chat.answer({ question: 'Tell me about Ada.' })).resolves.toBe('A concise answer.');
		expect(complete).toHaveBeenCalledOnce();
		expect(trace).toHaveBeenCalledOnce();
	});
});
