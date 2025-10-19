export function getElement<T extends Element>(selector: string): T {
	return document.querySelector(selector)!;
}
