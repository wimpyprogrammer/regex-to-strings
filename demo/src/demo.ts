/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["worker"] }] */

import { autoExpandTextarea } from './utils/auto-expand-field';
import { colorizeRegex } from './utils/colorize-regex';
import { getElement } from './utils/dom';
import Dropdown from './utils/dropdown';
import * as UrlStorage from './utils/url-storage';
import {
	isOptimizeResult,
	DemoWorkerResponse,
	ExpandRequest,
	isCountResult,
	isExpandResult,
} from './worker/messages';
// @ts-ignore Ignore lack of default export.  This is handled by worker-loader.
import DemoWorker from './worker';

import './demo.scss';

let worker: Worker;

const $body = getElement<HTMLBodyElement>('body');
const $form = getElement<HTMLFormElement>('.js-form');
const $input = getElement<HTMLTextAreaElement>('.js-pattern');
const $inputErrorContainer = getElement<HTMLDivElement>(
	'.js-pattern-error-container'
);
const $inputErrorMessage = getElement<HTMLPreElement>(
	'.js-pattern-error-message'
);
const $delimiter = new Dropdown('.js-delimiter');
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
	if (typeof Worker !== 'undefined') return;

	displayError(
		'This page uses Web Workers, which your browser does not support.  Please try a different browser.'
	);
	$submit.disabled = true;
}

function generateStrings() {
	hideError();
	showWaitingState();

	const pattern = $input.value;
	const numResults = Number($numResults.value);
	const workerRequest = new ExpandRequest(numResults, pattern);

	worker.postMessage(workerRequest);
}

function populateForm(newData: UrlStorage.StoredInput) {
	const { delimiter, numResults, pattern } = newData;

	if (pattern !== undefined) $input.value = pattern;
	if (delimiter !== undefined) $delimiter.setValue(delimiter);
	if (numResults !== undefined) $numResults.value = numResults.toString();
}

function displayStrings(strings: string[]) {
	const delimiter = $delimiter.getSelectedValue();
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

function validateForm() {
	try {
		return $form.reportValidity();
	} catch (ex) {
		// Ignore browsers that don't support reportValidity()
		return true;
	}
}

function onClickGenerate() {
	// Store the form inputs in the URL
	const formData: UrlStorage.FormInput = {
		delimiter: $delimiter.getSelectedValue(),
		numResults: Number($numResults.value),
		pattern: $input.value,
	};
	UrlStorage.write(formData);
}

$submit.addEventListener('click', onClickGenerate);

function onClickCancel() {
	worker.terminate();
	initializeNewWorker();
	hideWaitingState();
}

$cancel.addEventListener('click', onClickCancel);

function onInputKeydown(event: KeyboardEvent): boolean {
	if (event.key !== 'Enter' || event.shiftKey) return true;
	$submit.click();
	event.preventDefault();
	return false;
}

$input.addEventListener('keydown', onInputKeydown);

UrlStorage.onChange(newData => {
	populateForm(newData);
	if (!validateForm()) return;
	generateStrings();
});

checkForBrowserCompatibility();

initializeNewWorker();

autoExpandTextarea($input);

(() => {
	// Populate the form with values from the URL or fallback values, then submit.
	const urlData = UrlStorage.read();
	const exampleInput = String.raw`/^((https?|ftp|file):\/\/)?([0-9a-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/`;
	const initialData = {
		delimiter: urlData.delimiter || '&#10;', // newline
		numResults: urlData.numResults || 100,
		pattern: urlData.pattern || exampleInput,
	};
	// Store initial data in the URL
	UrlStorage.write(initialData);
})();
