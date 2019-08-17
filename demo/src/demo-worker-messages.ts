/* eslint-disable no-empty-function, no-useless-constructor, @typescript-eslint/no-parameter-properties */
import { expand } from '../../src/pattern';

interface WorkerMessage {
	readonly kind: string;
}

// Requests

export class ExpandNRequest implements WorkerMessage {
	public readonly kind: string = 'ExpandNRequest';

	public constructor(
		public numResults: number,
		public pattern: Parameters<typeof expand>[0]
	) {}
}

export type DemoWorkerRequest = ExpandNRequest;

// Responses

export class CountResult implements WorkerMessage {
	public readonly kind: string = 'CountResult';

	public constructor(
		public readonly totalNum: ReturnType<typeof expand>['count']
	) {}
}

export class ExpandNResult implements WorkerMessage {
	public readonly kind: string = 'ExpandNResult';

	public constructor(public readonly expansions: string[]) {}
}

export type DemoWorkerResponse = CountResult | ExpandNResult;

// Type Guards

export function isExpandNRequest(msg: WorkerMessage): msg is ExpandNRequest {
	return msg.kind === 'ExpandNRequest';
}

export function isCountResult(msg: WorkerMessage): msg is CountResult {
	return msg.kind === 'CountResult';
}

export function isExpandNResult(msg: WorkerMessage): msg is ExpandNResult {
	return msg.kind === 'ExpandNResult';
}
