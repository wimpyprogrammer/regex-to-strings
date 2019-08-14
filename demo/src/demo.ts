// @ts-ignore Ignore lack of default export.  This is handled by worker-loader.
import DemoWorker from './demo-worker';

import {
	DemoWorkerResponse,
	ExpandNRequest,
	isExpandNError,
	isExpandNResult,
	WorkerErrorMessage,
} from './demo-worker-messages';

const worker: Worker = new DemoWorker();

function getElement<T extends Element>(selector: string) {
	return document.querySelector(selector) as T;
}

const $form = getElement<HTMLFormElement>('.js-form');
const $input = getElement<HTMLTextAreaElement>('.js-pattern');
const $inputErrorContainer = getElement<HTMLDivElement>(
	'.js-pattern-error-container'
);
const $inputErrorMessage = getElement<HTMLPreElement>(
	'.js-pattern-error-message'
);
const $delimiter = getElement<HTMLSelectElement>('.js-delimiter');
const $numResults = getElement<HTMLInputElement>('.js-max-results');
const $output = getElement<HTMLPreElement>('.js-output');
const $submit = getElement<HTMLButtonElement>('.js-generate');

function displayError(error: WorkerErrorMessage) {
	$inputErrorMessage.textContent = error.errorMessage.trim();
	$inputErrorContainer.hidden = false;
}

function hideError() {
	$inputErrorContainer.hidden = true;
}

function generateStrings(pattern: string) {
	$submit.disabled = true;
	hideError();

	const numResults = Number($numResults.value);
	const workerRequest = new ExpandNRequest(numResults, pattern);

	worker.postMessage(workerRequest);
}

function displayStrings(strings: string[]) {
	const delimiter = $delimiter.options[$delimiter.selectedIndex].value;
	$output.classList.toggle('wrap-output', delimiter !== '\n');
	$output.innerHTML = strings
		.map(string => `<span>${string}</span>`)
		.join(delimiter);
}

worker.onmessage = (message: MessageEvent) => {
	function assertNeverResponse(x: never): never {
		throw new TypeError(`Unexpected message: ${x}`);
	}

	$submit.disabled = false;

	const messageData: DemoWorkerResponse = message.data;

	if (isExpandNResult(messageData)) {
		displayStrings(messageData.expansions);
	} else if (isExpandNError(messageData)) {
		displayError(messageData);
	} else {
		assertNeverResponse(messageData);
	}
};

function onClickGenerate() {
	try {
		if (!$form.reportValidity()) {
			return;
		}
	} catch (ex) {
		// Ignore browsers that don't support reportValidity()
	}

	const pattern = $input.value;
	generateStrings(pattern);
}

$submit.addEventListener('click', onClickGenerate);

(() => {
	const exampleInput = String.raw`/^((https?|ftp|file):\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/`;
	$input.value = exampleInput;

	generateStrings(exampleInput);
})();
