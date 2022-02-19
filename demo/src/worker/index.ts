import './polyfills';

import { expand, toRegExp } from 'regex-to-strings';
import { optimize } from 'regexp-tree';
import {
	CountResult,
	DemoWorkerRequest,
	DemoWorkerResponse,
	ExpandResult,
	isExpandRequest,
	OptimizeResult,
} from './messages';

function assertNeverRequest(x: never): never {
	throw new TypeError(`Unexpected message: ${x}`);
}

function takeNIterations(
	generator: IterableIterator<string>,
	maxIterations: number
): string[] {
	const iterations = [];

	let iteration = generator.next();
	while (!iteration.done && iterations.length < maxIterations) {
		iterations.push(iteration.value);
		iteration = generator.next();
	}

	return iterations;
}

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = (self as unknown) as Worker;

function* processRequest(
	message: MessageEvent
): IterableIterator<DemoWorkerResponse> {
	const messageData: DemoWorkerRequest = message.data;

	if (isExpandRequest(messageData)) {
		const { numResults, pattern } = messageData;

		const patternOptimized = optimize(toRegExp(pattern));
		yield new OptimizeResult(patternOptimized.toString());

		const { count, getIterator } = expand(pattern);
		yield new CountResult(count);

		const expansions = takeNIterations(getIterator(), numResults);
		return yield new ExpandResult(expansions);
	}

	return assertNeverRequest(messageData);
}

ctx.onmessage = (message: MessageEvent) => {
	for (const response of processRequest(message)) {
		ctx.postMessage(response);
	}
};
