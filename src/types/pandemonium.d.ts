declare module 'pandemonium/shuffle' {
	type Shuffle = <T>(items: T[]) => T[];

	const shuffle: Shuffle;
	export default shuffle;
}
