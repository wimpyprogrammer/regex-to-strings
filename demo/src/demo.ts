/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["worker"] }] */

import { autoExpandTextarea } from './auto-expand-field';
import { colorizeRegex } from './colorize-regex';
// @ts-ignore Ignore lack of default export.  This is handled by worker-loader.
import DemoWorker from './demo-worker';
import {
	isOptimizeResult,
	DemoWorkerResponse,
	ExpandRequest,
	isCountResult,
	isExpandResult,
} from './demo-worker-messages';

import '../styles/demo.scss';

let worker: Worker;

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
const $outputOptimized = getElement<HTMLDivElement>('.js-output-optimized');
const $outputOptimizedContainer = getElement<HTMLDivElement>(
	'.js-output-optimized-container'
);
const $submit = getElement<HTMLButtonElement>('.js-generate');
const $cancel = getElement<HTMLButtonElement>('.js-cancel');

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
	$outputOptimizedContainer.hidden = true;
	$submit.disabled = true;
	$cancel.disabled = false;
	$outputCount.innerText = '...';
	$totalCount.innerText = '...';
}

function hideWaitingState() {
	$body.classList.remove('is-waiting');
	$submit.disabled = false;
	$cancel.disabled = true;
}

function checkForBrowserCompatibility() {
	if (window.Worker) return;

	displayError(
		'This page uses Web Workers, which your browser does not support.  Please try a different browser.'
	);
	$submit.disabled = true;
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

function onWorkerMessageReceived(message: MessageEvent) {
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
	} else if (isOptimizeResult(messageData)) {
		const { optimizedPattern } = messageData;
		$outputOptimized.textContent = optimizedPattern;
		colorizeRegex($outputOptimized);
		$outputOptimizedContainer.hidden = false;
	} else {
		assertNeverResponse(messageData);
	}
}

function onWorkerError(error: ErrorEvent) {
	hideWaitingState();
	displayError(error.message);
}

function initializeNewWorker() {
	worker = new DemoWorker();
	worker.onmessage = onWorkerMessageReceived;
	worker.onerror = onWorkerError;
}

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

function onClickCancel() {
	worker.terminate();
	initializeNewWorker();
	hideWaitingState();
}

$cancel.addEventListener('click', onClickCancel);

checkForBrowserCompatibility();

initializeNewWorker();

autoExpandTextarea($input);

(() => {
	const exampleInput = String.raw`/^((https?|ftp|file):\/\/)?([0-9a-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/`;
	$input.value = exampleInput;

	generateStrings(exampleInput);
})();
