// @ts-ignore Ignore lack of default export.  This is handled by worker-loader.
import DemoWorker from './demo-worker';
import {
	DemoWorkerResponse,
	ExpandRequest,
	isCountResult,
	isExpandResult,
} from './demo-worker-messages';

const worker: Worker = new DemoWorker();

function getElement<T extends Element>(selector: string) {
	return document.querySelector(selector) as T;
}

const $body = getElement<HTMLBodyElement>('body');
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
const $outputCount = getElement<HTMLSpanElement>('.js-output-count');
const $totalCount = getElement<HTMLSpanElement>('.js-total-count');
const $submit = getElement<HTMLButtonElement>('.js-generate');

function displayError(errorMessage: string) {
	$inputErrorMessage.textContent = errorMessage.trim();
	$inputErrorContainer.hidden = false;
}

function hideError() {
	$inputErrorContainer.hidden = true;
}

function showWaitingState() {
	$body.classList.add('is-waiting');
	$output.innerHTML = '';
	$submit.disabled = true;
	$outputCount.innerText = '...';
	$totalCount.innerText = '...';
}

function hideWaitingState() {
	$body.classList.remove('is-waiting');
	$submit.disabled = false;
}

function generateStrings(pattern: string) {
	hideError();
	showWaitingState();

	const numResults = Number($numResults.value);
	const workerRequest = new ExpandRequest(numResults, pattern);

	worker.postMessage(workerRequest);
}

function displayStrings(strings: string[]) {
	const delimiter = $delimiter.options[$delimiter.selectedIndex].value;
	$output.classList.toggle('wrap-output', delimiter !== '\n');
	$output.innerHTML = strings
		.map(string => `<span>${string}</span>`)
		.join(delimiter);
	$outputCount.innerText = strings.length.toLocaleString();
}

worker.onmessage = (message: MessageEvent) => {
	function assertNeverResponse(x: never): never {
		throw new TypeError(`Unexpected message: ${x}`);
	}

	const messageData: DemoWorkerResponse = message.data;

	if (isExpandResult(messageData)) {
		hideWaitingState();
		displayStrings(messageData.expansions);
	} else if (isCountResult(messageData)) {
		const { totalNum } = messageData;
		const isCompact = totalNum < 1e30 || totalNum === Infinity;
		$totalCount.innerText = isCompact
			? totalNum.toLocaleString()
			: totalNum.toExponential();
	} else {
		assertNeverResponse(messageData);
	}
};

worker.onerror = (error: ErrorEvent) => {
	hideWaitingState();
	displayError(error.message);
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
