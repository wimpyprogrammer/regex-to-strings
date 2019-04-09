import randomShuffle from 'shuffle-array';

export default function sort<T>(items: T[]) {
	return randomShuffle([...items]);
}
