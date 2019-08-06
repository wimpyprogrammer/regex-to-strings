import { expandN } from '../../src/pattern';

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
const $output = getElement<HTMLTextAreaElement>('.js-output');
const $submit = getElement<HTMLButtonElement>('.js-generate');

function displayError(error: Error) {
	$inputErrorMessage.textContent = error.message.trim();
	$inputErrorContainer.hidden = false;
}

function hideError() {
	$inputErrorContainer.hidden = true;
}

function generateStrings(pattern: string): string[] {
	const numResults = Number($numResults.value);
	const results = expandN(pattern, numResults);
	return results;
}

let clearSuccessIndicatorHandle: number;
function displayStrings(strings: string[]) {
	const delimiter = $delimiter.options[$delimiter.selectedIndex].value;
	$output.value = strings.join(delimiter);

	// Temporarily style the output box as valid
	$form.classList.add('is-valid');

	clearTimeout(clearSuccessIndicatorHandle);
	clearSuccessIndicatorHandle = setTimeout(
		() => $output.classList.remove('is-valid'),
		1000
	);
}

function generateAndDisplayStrings(pattern: string): void {
	let results: string[] = [];

	try {
		results = generateStrings(pattern);
		hideError();
	} catch (e) {
		displayError(e);
		throw e;
	}

	displayStrings(results);
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
	generateAndDisplayStrings(pattern);
}

$submit.addEventListener('click', onClickGenerate);

(() => {
	const exampleInput = String.raw`/^((https?|ftp|file):\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/`;
	$input.value = exampleInput;

	generateAndDisplayStrings(exampleInput);
})();
