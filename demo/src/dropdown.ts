import { getElement } from './dom-utils';

export default class Dropdown {
	protected readonly $el: HTMLSelectElement;

	public constructor(selector: string) {
		this.$el = getElement(selector);
	}

	public getValue() {
		const { selectedIndex } = this.$el;
		return this.$el.options[selectedIndex].value;
	}
}
