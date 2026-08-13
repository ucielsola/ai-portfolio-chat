# AI Portfolio Chat Starter

A publishable, framework-neutral TypeScript package for a portfolio assistant. It keeps all site-specific material in one validated config object, so the chat can be reused across personal sites without copying server code.

## What is included

- Zod-backed `SiteConfig` with defaults and strict validation.
- A small provider interface plus an OpenAI-compatible adapter and custom-adapter registry.
- Optional Langfuse port for tracing and remote prompt templates; failures always fall back to the local prompt.
- Portfolio-specific local prompts: third-person answers, visitor-language matching, context-only factual claims, and no “go visit the portfolio” deflections.

## Quick start

```ts
import { createPortfolioChat, createProvider } from 'ai-portfolio-chat';
import { siteConfig } from './site-config.js';

const provider = createProvider(siteConfig.chat.provider, process.env);
const chat = createPortfolioChat(siteConfig, provider);

const answer = await chat.answer({ question: 'Which projects are most relevant to design systems?' });
```

Use [`src/config/example.ts`](src/config/example.ts) as the starting config. Keep profile text factual, current, and free of secrets; it becomes the model’s source of truth. Run `npm run build` before consuming the package locally or publishing it.

## Replacing providers

The built-in `openai-compatible` provider works with OpenAI-compatible `/chat/completions` services. To support another SDK, register a small adapter implementing `ChatProvider`:

```ts
const provider = createProvider(config.chat.provider, process.env, {
  anthropic: (providerConfig) => ({
    name: 'anthropic',
    async complete(request) {
      // Call the Anthropic SDK and return { text }.
      return { text: '...' };
    }
  })
});
```

Set `chat.provider` to `{ kind: 'custom', adapter: 'anthropic', model: '...' }`. API keys belong in server-only environment variables, never the config or browser bundle.

## Optional Langfuse

The core deliberately takes a `LangfusePort` rather than importing a particular Langfuse SDK version. `siteConfig.langfuse` controls whether it is used and names the production prompt. In your server integration, construct the SDK client only when `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` exist, then pass an adapter as `{ langfuse: port }` to `createPortfolioChat`. Missing credentials, network failures, timeouts, missing prompts, and invalid templates all use the checked-in local fallback.

`getPrompt` should return an object whose `compile({ name, headline, question, context })` method returns a string. The remote prompt is response guidance only: code always wraps it with the local third-person policy and portfolio context. This makes Langfuse prompt management opt-in while keeping reviewed enforcement in source control.

When enabled, Langfuse tracing sends visitor questions and model answers to the configured Langfuse project. Obtain appropriate visitor consent and avoid placing sensitive information in portfolio context.

## Checks

```bash
npm install
npm run check
npm test
```
