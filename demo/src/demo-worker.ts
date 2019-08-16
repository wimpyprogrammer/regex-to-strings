import {
	CountResult,
	DemoWorkerRequest,
	DemoWorkerResponse,
	ExpandNResult,
	ExpandNError,
	isExpandNRequest,
} from './demo-worker-messages';
import { expand } from '../../src/pattern';

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

	if (isExpandNRequest(messageData)) {
		try {
			const { numResults, pattern } = messageData;
			const { count, getIterator } = expand(pattern);
			yield new CountResult(count);

			const expansions = takeNIterations(getIterator(), numResults);
			return yield new ExpandNResult(expansions);
		} catch (e) {
			console.error(e); // eslint-disable-line no-console
			return yield new ExpandNError(e.message);
		}
	}

	return assertNeverRequest(messageData);
}

ctx.onmessage = (message: MessageEvent) => {
	for (const response of processRequest(message)) {
		ctx.postMessage(response);
	}
};
