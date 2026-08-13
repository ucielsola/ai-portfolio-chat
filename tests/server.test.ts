import { describe, expect, it, vi } from 'vitest';
import { defineSiteConfig } from '../src/config/site.js';
import { createPortfolioChatPostHandler } from '../src/server.js';

const config = defineSiteConfig({
	site: { name: 'Ada Portfolio' },
	person: { name: 'Ada Example', headline: 'Full-stack engineer' },
	portfolio: [{ content: 'Ada built accessible products with TypeScript.' }],
	chat: { provider: { kind: 'custom', adapter: 'fake', model: 'fake-model' } }
});

describe('framework-neutral server handler', () => {
	it('answers a POST request through a fake provider without exposing its environment', async () => {
		const complete = vi.fn().mockResolvedValue({ text: 'Ada built accessible TypeScript products.' });
		const handler = createPortfolioChatPostHandler(config, {
			env: { PROVIDER_SECRET: 'not-in-client-response' },
			customProviders: { fake: () => ({ name: 'fake', complete }) }
		});

		const response = await handler(
			new Request('https://portfolio.example/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question: 'What did Ada build?' })
			})
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ answer: 'Ada built accessible TypeScript products.' });
		expect(complete).toHaveBeenCalledWith(expect.objectContaining({ model: 'fake-model' }));
	});

	it('returns safe errors for invalid requests and provider failures', async () => {
		const handler = createPortfolioChatPostHandler(config, {
			env: {},
			customProviders: { fake: () => ({ name: 'fake', complete: vi.fn().mockRejectedValue(new Error('secret upstream detail')) }) }
		});

		const invalid = await handler(new Request('https://portfolio.example/api/chat', { method: 'POST', body: '{}' }));
		expect(invalid.status).toBe(400);
		expect(await invalid.json()).toEqual({ error: 'A non-empty question is required.' });

		const failure = await handler(
			new Request('https://portfolio.example/api/chat', { method: 'POST', body: JSON.stringify({ question: 'Hello' }) })
		);
		expect(failure.status).toBe(502);
		expect(await failure.json()).toEqual({ error: 'Unable to answer right now.' });
	});
});
