/**
 * Langfuse is an optional integration, not a dependency of the chat core. A host
 * can provide this port using its Langfuse SDK version of choice.
 */
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

export type OptionalLangfuse = {
	enabled: boolean;
	port?: LangfusePort;
	promptName?: string;
	promptLabel: string;
};

export async function resolveSystemPrompt(
	localPrompt: string,
	variables: Record<string, string>,
	langfuse: OptionalLangfuse
): Promise<string> {
	if (!langfuse.enabled || !langfuse.port?.getPrompt || !langfuse.promptName) return localPrompt;
	try {
		return (await langfuse.port.getPrompt(langfuse.promptName, { label: langfuse.promptLabel })).compile(variables);
	} catch {
		// Observability must never make the portfolio unavailable.
		return localPrompt;
	}
}

export async function safelyTrace(port: LangfusePort | undefined, event: Parameters<NonNullable<LangfusePort['trace']>>[0]): Promise<void> {
	try {
		await port?.trace?.(event);
	} catch {
		// Do not leak telemetry failures into a visitor-facing response.
	}
}
