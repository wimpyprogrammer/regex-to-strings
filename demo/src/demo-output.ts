/* eslint-disable lines-between-class-members */

import { colorizeRegex } from './utils/colorize-regex';
import { getElement } from './utils/dom';

export default class DemoOutput {
	protected $expansions: HTMLPreElement;
	protected $displayCount: HTMLSpanElement;
	protected $totalCount: HTMLSpanElement;
	protected $optimized: HTMLDivElement;
	protected $optimizedContainer: HTMLDivElement;

	public constructor() {
		this.$expansions = getElement('.js-output');
		this.$displayCount = getElement('.js-output-count');
		this.$totalCount = getElement('.js-total-count');
		this.$optimized = getElement('.js-output-optimized');
		this.$optimizedContainer = getElement('.js-output-optimized-container');
	}

	public display(expansions: string[], delimiter: string) {
		this.$expansions.classList.toggle('wrap-output', delimiter !== '\n');
		this.$expansions.innerHTML = expansions
			.map(string => `<span>${string}</span>`)
			.join(delimiter);
		this.$displayCount.innerText = expansions.length.toLocaleString();
	}

	public hideWaiting() {
		this.$expansions.classList.remove('is-waiting');
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
		this.$expansions.innerHTML = '';
		this.$expansions.classList.add('is-waiting');
		this.$optimizedContainer.hidden = true;
		this.$displayCount.innerText = '...';
		this.$totalCount.innerText = '...';
	}
}
