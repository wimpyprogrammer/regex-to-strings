/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["field"] }] */

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
	window.addEventListener('resize', recalculateHeight, false);
}
