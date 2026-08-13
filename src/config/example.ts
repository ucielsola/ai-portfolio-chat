import { defineSiteConfig } from './site.js';

/** Copy this into your application and replace the sample profile content. */
export const siteConfig = defineSiteConfig({
	site: { name: 'Your portfolio', url: 'https://example.com', locale: 'en' },
	person: {
		name: 'Your Name',
		headline: 'Product-minded software engineer',
		contact: { email: 'hello@example.com', linkedin: 'https://linkedin.com/in/your-name' }
	},
	portfolio: [
		{
			label: 'Professional profile',
			content:
				'Add a concise profile, experience, projects, skills, outcomes, and contact details here. Keep it factual and current.'
		}
	],
	chat: { provider: { kind: 'openai-compatible', model: 'gpt-4o-mini' } },
	langfuse: { enabled: false }
});
