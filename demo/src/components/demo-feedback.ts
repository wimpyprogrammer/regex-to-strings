/* eslint-disable lines-between-class-members */

import { getElement } from '../utils/dom';

import './demo-feedback.scss';

export default class DemoFeedback {
	protected $container: HTMLDivElement;
	protected $positive: HTMLButtonElement;
	protected $negative: HTMLButtonElement;
	protected $thanks: HTMLDivElement;

	protected onFeedbackReceived(): void {
		this.$container.hidden = true;
		this.$thanks.hidden = false;
	}

	public constructor() {
		this.$container = getElement('.js-feedback');
		this.$positive = getElement('.js-feedback-positive');
		this.$negative = getElement('.js-feedback-negative');
		this.$thanks = getElement('.js-feedback-thanks');

		this.onFeedbackReceived = this.onFeedbackReceived.bind(this);
		this.$positive.addEventListener('click', this.onFeedbackReceived);
		this.$negative.addEventListener('click', this.onFeedbackReceived);
	}

	public disable(): void {
		this.$container.hidden = true;
		this.$thanks.hidden = true;
	}

	public reset(): void {
		this.$container.hidden = false;
		this.$thanks.hidden = true;
	}
}
