import RegexColorizer from 'RegexColorizer';

import '../styles/colorize-regex.scss';

export function colorizeRegex($el: HTMLElement) {
	$el.classList.add('regex');
	RegexColorizer.colorizeAll($el.className);
}
