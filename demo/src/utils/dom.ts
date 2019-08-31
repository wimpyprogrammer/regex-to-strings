export function getElement<T extends Element>(selector: string) {
	return document.querySelector(selector) as T;
}
