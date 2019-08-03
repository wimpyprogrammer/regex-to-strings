import { expandN } from '../src/pattern';

function getElement<T extends Element>(selector: string) {
	return document.querySelector(selector) as T;
}

const $form = getElement<HTMLFormElement>('.js-form');
const $input = getElement<HTMLTextAreaElement>('.js-pattern');
const $delimiter = getElement<HTMLSelectElement>('.js-delimiter');
const $numResults = getElement<HTMLInputElement>('.js-max-results');
const $output = getElement<HTMLTextAreaElement>('.js-output');
const $submit = getElement<HTMLButtonElement>('.js-generate');

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

function onClickGenerate() {
	try {
		if (!$form.reportValidity()) {
			return;
		}
	} catch (ex) {
		// Ignore browsers that don't support reportValidity()
	}

	const pattern = $input.value;
	const results = generateStrings(pattern);
	displayStrings(results);
}

$submit.addEventListener('click', onClickGenerate);

(() => {
	const exampleInput = String.raw`/^((https?|ftp|file):\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/`;
	$input.value = exampleInput;

	const results = generateStrings(exampleInput);
	displayStrings(results);
})();
