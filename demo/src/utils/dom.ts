export function getElement<T extends Element>(selector: string): T {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return document.querySelector(selector)!;
}
