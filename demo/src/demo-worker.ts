import {
	DemoWorkerRequest,
	DemoWorkerResponse,
	ExpandNResult,
	ExpandNError,
	isExpandNRequest,
} from './demo-worker-messages';
import { expandN } from '../../src/pattern';

function assertNeverRequest(x: never): never {
	throw new TypeError(`Unexpected message: ${x}`);
}

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = (self as unknown) as Worker;

function processRequest(message: MessageEvent): DemoWorkerResponse {
	const messageData: DemoWorkerRequest = message.data;

	if (isExpandNRequest(messageData)) {
		try {
			const { numResults, pattern } = messageData;
			const expansions = expandN(pattern, numResults);
			return new ExpandNResult(expansions);
		} catch (e) {
			console.error(e); // eslint-disable-line no-console
			return new ExpandNError(e.message);
		}
	}

	return assertNeverRequest(messageData);
}

ctx.onmessage = (message: MessageEvent) => {
	const response = processRequest(message);
	ctx.postMessage(response);
};
