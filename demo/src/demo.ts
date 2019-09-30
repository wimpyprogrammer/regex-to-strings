/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["worker"] }] */

import * as UrlStorage from './utils/url-storage';
import DemoFeedback from './components/demo-feedback';
import DemoForm from './components/demo-form';
import DemoOutput from './components/demo-output';
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

const $feedback = new DemoFeedback();
const $form = new DemoForm();
const $output = new DemoOutput();

function showWaitingState() {
	$feedback.disable();
	$form.disable();
	$output.showWaiting();
}

function hideWaitingState() {
	$form.enable();
	$output.hideWaiting();
}

function checkForBrowserCompatibility() {
	if (typeof Worker !== 'undefined') return;

	$feedback.disable();
	$form.displayError(
		'This page uses Web Workers, which your browser does not support.  Please try a different browser.'
	);
	$form.disable();
}

function generateStrings() {
	const { numResults, pattern } = $form.read();
	const workerRequest = new ExpandRequest(numResults, pattern);

	worker.postMessage(workerRequest);
}

function onWorkerMessageReceived(message: MessageEvent) {
	function assertNeverResponse(x: never): never {
		throw new TypeError(`Unexpected message: ${x}`);
	}

	const messageData: DemoWorkerResponse = message.data;

	if (isExpandResult(messageData)) {
		hideWaitingState();
		$feedback.reset();
		const { delimiter } = $form.read();
		$output.display(messageData.expansions, delimiter);
	} else if (isCountResult(messageData)) {
		const { totalNum } = messageData;
		$output.setTotalCount(totalNum);
	} else if (isOptimizeResult(messageData)) {
		const { optimizedPattern } = messageData;
		$output.setOptimizedPattern(optimizedPattern);
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

$form.onSubmit = () => {
	// Store the form inputs in the URL
	const formData = $form.read();
	UrlStorage.write(formData);
	return false;
};

$form.onCancel = () => {
	worker.terminate();
	initializeNewWorker();
	hideWaitingState();
};

UrlStorage.onChange(newData => {
	$form.populate(newData);
	if (!$form.validate()) return;

	$form.hideError();
	showWaitingState();
	generateStrings();
});

checkForBrowserCompatibility();

initializeNewWorker();

(() => {
	// Populate the form with values from the URL or fallback values, then submit.
	const urlData = UrlStorage.read();
	const exampleInput = String.raw`/^((https?|ftp|file):\/\/)?([\d\-a-z]{1,5}\.){2,5}([a-z]{2,6})\/([\d\-._a-z]{1,10}\/){0,5}$/`;
	const initialData = {
		delimiter: urlData.delimiter || 'block',
		numResults: urlData.numResults || 100,
		pattern: urlData.pattern || exampleInput,
	};
	// Store initial data in the URL
	UrlStorage.write(initialData);
})();
