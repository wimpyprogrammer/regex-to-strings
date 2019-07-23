declare module 'pandemonium/shuffle' {
	type Shuffle = <T>(items: T[]) => T[];

	const shuffle: Shuffle;
	export default shuffle;
}

declare module 'pandemonium/weighted-random-index' {
	type WeightedRandomIndex = (weights: number[]) => number;

	const weightedRandomIndex: WeightedRandomIndex;
	export default weightedRandomIndex;
}
