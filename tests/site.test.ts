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
		const prompt = createPortfolioSystemPrompt(config, 'What did Ada build?', 'Be concise.');
		expect(prompt).toContain('Ada Example');
		expect(prompt).toContain('Use only the portfolio context');
		expect(prompt).toContain('accessible products');
	});

	it('uses the provider adapter and traces only when configured', async () => {
		const complete = vi.fn().mockResolvedValue({ text: 'A concise answer.' });
		const trace = vi.fn();
		const tracedConfig = defineSiteConfig({ ...config, langfuse: { enabled: true } });
		const chat = createPortfolioChat(tracedConfig, { name: 'test', complete }, { langfuse: { trace } });
		await expect(chat.answer({ question: 'Tell me about Ada.' })).resolves.toBe('A concise answer.');
		expect(complete).toHaveBeenCalledOnce();
		expect(trace).toHaveBeenCalledOnce();
	});

	it('uses Langfuse guidance without allowing it to replace local policy and context', async () => {
		const complete = vi.fn().mockResolvedValue({ text: 'Answer.' });
		const langfuseConfig = defineSiteConfig({ ...config, langfuse: { enabled: true } });
		const chat = createPortfolioChat(langfuseConfig, { name: 'test', complete }, {
			langfuse: { getPrompt: vi.fn().mockResolvedValue({ compile: () => 'Mention measurable outcomes.' }) }
		});
		await chat.answer({ question: 'What did Ada build?' });
		const system = complete.mock.calls[0][0].messages[0].content;
		expect(system).toContain('Mention measurable outcomes.');
		expect(system).toContain('Use only the portfolio context');
		expect(system).toContain('accessible products');
	});

	it('falls back when Langfuse has no prompt port or returns an invalid template', async () => {
		const complete = vi.fn().mockResolvedValue({ text: 'Answer.' });
		const langfuseConfig = defineSiteConfig({ ...config, langfuse: { enabled: true } });
		const chat = createPortfolioChat(langfuseConfig, { name: 'test', complete }, {
			langfuse: { getPrompt: vi.fn().mockResolvedValue({ compile: () => '' }) }
		});
		await chat.answer({ question: 'What did Ada build?' });
		expect(complete.mock.calls[0][0].messages[0].content).toContain('Use an approachable, concise tone.');
	});

	it('falls back when the Langfuse prompt request times out', async () => {
		const complete = vi.fn().mockResolvedValue({ text: 'Answer.' });
		const langfuseConfig = defineSiteConfig({ ...config, langfuse: { enabled: true } });
		const chat = createPortfolioChat(langfuseConfig, { name: 'test', complete }, {
			langfuse: { getPrompt: () => new Promise(() => undefined) },
			promptTimeoutMs: 1
		});
		await chat.answer({ question: 'What did Ada build?' });
		expect(complete.mock.calls[0][0].messages[0].content).toContain('Use an approachable, concise tone.');
	});
});
