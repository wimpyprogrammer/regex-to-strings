/* eslint-disable no-empty-function, no-useless-constructor, @typescript-eslint/no-parameter-properties */
import { expand } from '../../src/pattern';

interface WorkerMessage {
	readonly kind: string;
}

// Requests

export class ExpandRequest implements WorkerMessage {
	public readonly kind: string = 'ExpandRequest';

	public constructor(
		public numResults: number,
		public pattern: Parameters<typeof expand>[0]
	) {}
}

export type DemoWorkerRequest = ExpandRequest;

// Responses

export class CountResult implements WorkerMessage {
	public readonly kind: string = 'CountResult';

	public constructor(
		public readonly totalNum: ReturnType<typeof expand>['count']
	) {}
}

export class ExpandResult implements WorkerMessage {
	public readonly kind: string = 'ExpandResult';

	public constructor(public readonly expansions: string[]) {}
}

export class OptimizeResult implements WorkerMessage {
	public readonly kind: string = 'OptimizeResult';

	public constructor(public readonly optimizedPattern: string) {}
}

export type DemoWorkerResponse = CountResult | ExpandResult | OptimizeResult;

// Type Guards

export function isExpandRequest(msg: WorkerMessage): msg is ExpandRequest {
	return msg.kind === 'ExpandRequest';
}

export function isCountResult(msg: WorkerMessage): msg is CountResult {
	return msg.kind === 'CountResult';
}

export function isExpandResult(msg: WorkerMessage): msg is ExpandResult {
	return msg.kind === 'ExpandResult';
}

export function isOptimizeResult(msg: WorkerMessage): msg is OptimizeResult {
	return msg.kind === 'OptimizeResult';
}
