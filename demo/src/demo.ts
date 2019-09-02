/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["worker"] }] */

import { colorizeRegex } from './utils/colorize-regex';
import { getElement } from './utils/dom';
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
import DemoForm from './demo-form';

import './demo.scss';

let worker: Worker;

const $body = getElement<HTMLBodyElement>('body');
const $form = new DemoForm();
const $output = getElement<HTMLPreElement>('.js-output');
const $outputCount = getElement<HTMLSpanElement>('.js-output-count');
const $totalCount = getElement<HTMLSpanElement>('.js-total-count');
const $outputOptimized = getElement<HTMLDivElement>('.js-output-optimized');
const $outputOptimizedContainer = getElement<HTMLDivElement>(
	'.js-output-optimized-container'
);
const $cancel = getElement<HTMLButtonElement>('.js-cancel');

function showWaitingState() {
	$form.disable();
	$body.classList.add('is-waiting');
	$output.innerHTML = '';
	$outputOptimizedContainer.hidden = true;
	$cancel.disabled = false;
	$outputCount.innerText = '...';
	$totalCount.innerText = '...';
}

function hideWaitingState() {
	$form.enable();
	$body.classList.remove('is-waiting');
	$cancel.disabled = true;
}

function checkForBrowserCompatibility() {
	if (typeof Worker !== 'undefined') return;

	$form.displayError(
		'This page uses Web Workers, which your browser does not support.  Please try a different browser.'
	);
	$form.disable();
}

function generateStrings() {
	$form.hideError();
	showWaitingState();

	const { numResults, pattern } = $form.read();
	const workerRequest = new ExpandRequest(numResults, pattern);

	worker.postMessage(workerRequest);
}

function displayStrings(strings: string[]) {
	const { delimiter } = $form.read();
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
	$form.displayError(error.message);
}

function initializeNewWorker() {
	worker = new DemoWorker();
	worker.onmessage = onWorkerMessageReceived;
	worker.onerror = onWorkerError;
}

function onFormSubmit() {
	// Store the form inputs in the URL
	const formData = $form.read();
	UrlStorage.write(formData);
	return false;
}

$form.onSubmit = onFormSubmit;

function onClickCancel() {
	worker.terminate();
	initializeNewWorker();
	hideWaitingState();
}

$cancel.addEventListener('click', onClickCancel);

UrlStorage.onChange(newData => {
	$form.populate(newData);
	if (!$form.validate()) return;
	generateStrings();
});

checkForBrowserCompatibility();

initializeNewWorker();

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
