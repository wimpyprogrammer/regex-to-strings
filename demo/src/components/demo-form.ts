/* eslint-disable lines-between-class-members */

import { autoExpandTextarea } from '../utils/auto-expand-field';
import { getElement } from '../utils/dom';
import Dropdown from './dropdown';

import './demo-form.scss';

export interface StoredInput {
	delimiter?: string;
	numResults?: number;
	pattern?: string;
}

export type FormInput = Required<StoredInput>;

export default class DemoForm {
	protected $form: HTMLFormElement;

	protected $delimiter: Dropdown;
	protected $numResults: HTMLInputElement;
	protected $pattern: HTMLTextAreaElement;

	protected $submit: HTMLButtonElement;
	protected $cancel: HTMLButtonElement;

	protected $errorContainer: HTMLDivElement;
	protected $errorMessage: HTMLPreElement;

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public onSubmit: () => void = () => {};
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public onCancel: () => void = () => {};

	private onInputKeydown(event: KeyboardEvent): boolean {
		if (event.key !== 'Enter' || event.shiftKey) return true;
		this.onSubmit();
		event.preventDefault();
		return false;
	}

	public constructor() {
		this.$form = getElement('.js-form');
		this.$delimiter = new Dropdown('.js-delimiter');
		this.$numResults = getElement('.js-max-results');
		this.$pattern = getElement('.js-pattern');
		this.$submit = getElement('.js-generate');
		this.$cancel = getElement('.js-cancel');
		this.$errorContainer = getElement('.js-pattern-error-container');
		this.$errorMessage = getElement('.js-pattern-error-message');

		this.onInputKeydown = this.onInputKeydown.bind(this);

		this.$numResults.addEventListener('keydown', this.onInputKeydown);

		autoExpandTextarea(this.$pattern);
		this.$pattern.addEventListener('keydown', this.onInputKeydown);

		this.$submit.addEventListener('click', () => this.onSubmit());
		this.$cancel.addEventListener('click', () => this.onCancel());
	}

	public disable(): void {
		this.$submit.disabled = true;
		this.$cancel.disabled = false;
	}

	public displayError(errorMessage: string): void {
		this.$errorMessage.textContent = errorMessage.trim();
		this.$errorContainer.hidden = false;
	}

	public enable(): void {
		this.$submit.disabled = false;
		this.$cancel.disabled = true;
	}

	public hideError(): void {
		this.$errorContainer.hidden = true;
	}

	public populate(newData: StoredInput): void {
		const { delimiter, numResults, pattern } = newData;

		if (pattern !== undefined) {
			this.$pattern.value = pattern;
			this.$pattern.dispatchEvent(new Event('input'));
		}
		if (delimiter !== undefined) this.$delimiter.setValue(delimiter);
		if (numResults !== undefined)
			this.$numResults.value = numResults.toString();
	}

	public read(): FormInput {
		return {
			delimiter: this.$delimiter.getSelectedValue(),
			numResults: Number(this.$numResults.value),
			pattern: this.$pattern.value,
		};
	}

	public validate(): boolean {
		try {
			return this.$form.reportValidity();
		} catch (ex) {
			// Ignore browsers that don't support reportValidity()
			return true;
		}
	}
}
