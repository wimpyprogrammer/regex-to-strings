/* eslint-disable no-empty-function, no-useless-constructor, @typescript-eslint/no-parameter-properties */
import { expandN } from '../../src/pattern';

interface WorkerMessage {
	readonly kind: string;
}

export abstract class WorkerErrorMessage implements WorkerMessage {
	public abstract readonly kind: string;

	public constructor(public readonly errorMessage: string) {}
}

// Requests

export class ExpandNRequest implements WorkerMessage {
	public readonly kind: string = 'ExpandNRequest';

	public constructor(
		public numResults: Parameters<typeof expandN>[1],
		public pattern: Parameters<typeof expandN>[0]
	) {}
}

export type DemoWorkerRequest = ExpandNRequest;

// Responses

export class ExpandNResult implements WorkerMessage {
	public readonly kind: string = 'ExpandNResult';

	public constructor(public readonly expansions: ReturnType<typeof expandN>) {}
}

export class ExpandNError extends WorkerErrorMessage {
	public readonly kind: string = 'ExpandNError';
}

export type DemoWorkerResponse = ExpandNResult | ExpandNError;

// Type Guards

export function isExpandNRequest(msg: WorkerMessage): msg is ExpandNRequest {
	return msg.kind === 'ExpandNRequest';
}

export function isExpandNResult(msg: WorkerMessage): msg is ExpandNResult {
	return msg.kind === 'ExpandNResult';
}

export function isExpandNError(msg: WorkerMessage): msg is ExpandNError {
	return msg.kind === 'ExpandNError';
}
