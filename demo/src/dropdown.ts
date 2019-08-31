import { getElement } from './dom-utils';

/**
 * Wrapper for HTMLSelectElement to streamline interactions.
 */
export default class Dropdown {
	/**
	 * The dropdown element.
	 */
	protected readonly $el: HTMLSelectElement;

	public constructor(selector: string) {
		this.$el = getElement(selector);
	}

	/**
	 * Get the dropdown option for a given value.
	 * @param val The option value to find
	 * @returns The option for val, or undefined if no option has the given value
	 */
	protected getOption(val: string): HTMLOptionElement | undefined {
		for (let i = 0; i < this.$el.options.length; i++) {
			const option = this.$el.options[i];
			if (option.value === val) {
				return option;
			}
		}

		return undefined;
	}

	/**
	 * Get the value of the currently selected option
	 */
	public getSelectedValue(): string {
		const { selectedIndex } = this.$el;
		return this.$el.options[selectedIndex].value;
	}

	/**
	 * Set which option is currently selected.  If no option has the given value,
	 * the selected option remains unchanged.
	 * @param newVal The value of the option to set
	 */
	public setValue(newVal: string) {
		const newOption = this.getOption(newVal);
		if (newOption !== undefined) {
			this.$el.selectedIndex = newOption.index;
		}
	}
}
