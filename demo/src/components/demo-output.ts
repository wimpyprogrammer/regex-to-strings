/* eslint-disable lines-between-class-members */

import { escape } from 'lodash'; // eslint-disable-line import/no-extraneous-dependencies
import { colorizeRegex } from '../utils/colorize-regex';
import { getElement } from '../utils/dom';

import './demo-output.scss';

export default class DemoOutput {
	protected $container: HTMLDivElement;
	protected $expansions: HTMLPreElement;
	protected $displayCount: HTMLSpanElement;
	protected $totalCount: HTMLSpanElement;
	protected $optimized: HTMLDivElement;
	protected $optimizedContainer: HTMLDivElement;

	public constructor() {
		this.$container = getElement('.js-output-container');
		this.$expansions = getElement('.js-output');
		this.$displayCount = getElement('.js-output-count');
		this.$totalCount = getElement('.js-total-count');
		this.$optimized = getElement('.js-output-optimized');
		this.$optimizedContainer = getElement('.js-output-optimized-container');
	}

	public display(expansions: string[], delimiter: string) {
		const isBlockOutput = delimiter === 'block';
		const isWrappingDelimiter = ['\n', 'block'].includes(delimiter);

		this.$expansions.classList.toggle('plaintext-output', !isBlockOutput);
		this.$expansions.classList.toggle('wrap-output', !isWrappingDelimiter);

		if (isBlockOutput) {
			this.$expansions.innerHTML = expansions
				.map(string => `<div class="alert alert-light">${escape(string)}</div>`)
				.join('\n');
		} else {
			this.$expansions.innerHTML = expansions
				.map(string => `<span>${escape(string)}</span>`)
				.join(delimiter);
		}

		this.$displayCount.innerText = expansions.length.toLocaleString();
	}

	public hideWaiting() {
		this.$container.classList.remove('is-waiting');
	}

	public setOptimizedPattern(optimizedPattern: string) {
		this.$optimized.textContent = optimizedPattern;
		colorizeRegex(this.$optimized);
		this.$optimizedContainer.hidden = false;
	}

	public setTotalCount(totalCount: number) {
		const isCompact = totalCount < 1e30 || totalCount === Infinity;
		this.$totalCount.innerText = isCompact
			? totalCount.toLocaleString()
			: totalCount.toExponential();
	}

	public showWaiting() {
		this.$container.classList.add('is-waiting');
		this.$expansions.innerHTML = '';
		this.$optimizedContainer.hidden = true;
		this.$displayCount.innerText = '...';
		this.$totalCount.innerText = '...';
	}
}
