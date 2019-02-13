import { expandNode } from '../pattern';
import { Node } from '../typings/regexp-tree';

export function* expandGroup(node: Node.Group): IterableIterator<string> {
	yield* expandNode(node.expression);
}
