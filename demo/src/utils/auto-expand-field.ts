/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["field"] }] */

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @see https://gist.github.com/fr-ser/ded7690b245223094cd876069456ed6c
 */
function debounce<F extends Function>(func: F, wait: number): F {
	let timeoutID: number;

	return (function debounced(this: any, ...args: any[]) {
		clearTimeout(timeoutID);
		const context = this;

		timeoutID = window.setTimeout(() => func.apply(context, args), wait);
	} as any) as F;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Grow or shrink a <textarea> field's height to fit its contents.
 * From https://codepen.io/vsync/pen/frudD.
 * @param field The <textarea> field to resize
 */
export function autoExpandTextarea(field: HTMLTextAreaElement) {
	field.classList.add('automaticHeight');

	const fieldStyles = window.getComputedStyle(field);
	const lineHeightStyle = fieldStyles.getPropertyValue('line-height');
	const pixelsPerRow = parseInt(lineHeightStyle, 10);

	const minVisibleRows = field.rows;

	const savedValue = field.value;
	field.value = '';
	const baseScrollHeight = field.scrollHeight;
	field.value = savedValue;

	function recalculateHeight() {
		field.rows = minVisibleRows;
		const currentHeightPixels = field.scrollHeight - baseScrollHeight;
		const rows = Math.ceil(currentHeightPixels / pixelsPerRow);
		field.rows = minVisibleRows + rows;
	}

	field.addEventListener('input', recalculateHeight, false);
	window.addEventListener('resize', debounce(recalculateHeight, 100), false);
}
