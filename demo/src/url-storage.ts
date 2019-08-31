import * as History from 'history';

export interface StoredInput {
	delimiter?: string;
	numResults?: number;
	pattern?: string;
}

export type FormInput = Required<StoredInput>;

const history = History.createBrowserHistory({
	basename: window.location.pathname,
});

function cleanUrlInput(val: string | null): string | undefined;
function cleanUrlInput(val: number | null): number | undefined;
function cleanUrlInput(val: string | number | null) {
	if (val === null) return undefined;
	if (typeof val === 'string') return val;
	if (Number.isNaN(val)) return undefined;
	return val;
}

function parse(location: History.Location): StoredInput {
	const urlParser = new URLSearchParams(location.search);

	const numResults = parseInt(urlParser.get('numResults') as string, 10);

	return {
		delimiter: cleanUrlInput(urlParser.get('delimiter')),
		numResults: cleanUrlInput(numResults),
		pattern: cleanUrlInput(urlParser.get('pattern')),
	};
}

/**
 * Read data stored in the current URL, if any.
 * @returns Any data found in the current URL.  Missing fields are undefined.
 */
export const read = () => parse(history.location);

/**
 * Write data to the URL.
 * @param data The values to store in the URL
 */
export function write(data: FormInput) {
	const currentQuerystring = history.location.search.substring(1); // remove leading ? character

	const querystringBuilder = new URLSearchParams(currentQuerystring);
	querystringBuilder.set('delimiter', data.delimiter);
	querystringBuilder.set('numResults', data.numResults.toString());
	querystringBuilder.set('pattern', data.pattern);
	const newQuerystring = querystringBuilder.toString();

	// Avoid duplicate history entries, while still triggering change listeners
	const isNewUrl = newQuerystring !== currentQuerystring;
	const updateUrl = isNewUrl ? history.push : history.replace;
	updateUrl({ search: newQuerystring });
}

/**
 * Register a function to run whenever the URL changes
 * @param fn The function to run and receive the new data
 */
export function onChange(fn: (newData: StoredInput) => void) {
	return history.listen(location => {
		const newData = parse(location);
		fn(newData);
	});
}
