import dieWithUsage from "./die";
import { PageOptions, SubPage, PageChildren, ElementValue } from "./types";

// TODO: if a node has follows and doesn't specify a 'value' prop, assume '-a href' rather than '--text'

// TODO: you should be allowed several attributes per selector so you can associate the link text and the url

export default function parseArgs(args: string[]): PageOptions {
	// console.log(args);
	if (args.length < 1) dieWithUsage();
	try {
		const root: PageOptions = {
			url: args[0].includes('://') ? args.shift()! : null,
			children: {}
		};
		// const nodes: { [id: string]: PageChildren } = { root: root.children };
		const usedNames = new Set<string>(["root"]);
		function getNode(id: string): PageOptions | SubPage;
		function getNode(id: string, parent: PageOptions | SubPage): PageOptions | SubPage | null;
		function getNode(id: string, parent: PageOptions | SubPage = root) {
			if (id == "root") return parent;
			if (parent.children && id in parent.children) return parent.children[id];
			if ("follow" in parent && parent.follow && id in parent.follow) return parent.follow[id];
			for (const i in parent.children) {
				const x = getNode(id, parent.children[i]);
				if (x) return x;
			}
			if ("follow" in parent && parent.follow) for (const i in parent.follow) {
				const x = getNode(id, parent.follow[i]);
				if (x) return x;
			}
			if (parent == root) throw new Error(`Node ${id} not found`);
			return null;
		}
		let currentNode: Partial<SubPage> & { values: ElementValue[] } = { values: [] };
		let currentName: string | null | undefined = null;
		let currentParent: PageOptions | SubPage | null = null;
		let currentFollow: SubPage | null = null;
		let doneAnything = false;
		function saveCurrentNode() {
			if (!currentNode.selector) throw new Error("No selector");
			// if (!currentNode.values) currentNode.values = [{ type: 'text' }];
			if (!currentName) currentName = currentNode.selector!;
			// nodes[currentName!] = currentNode;
			usedNames.add(currentName);
			if (currentParent) {
				if (!currentParent!.children) currentParent!.children = {};
				currentParent!.children[currentName] = currentNode as SubPage;
			} else if (currentFollow) {
				if (!currentFollow!.follow) currentFollow!.follow = {};
				currentFollow!.follow[currentName] = currentNode as SubPage;
			} else root.children[currentName] = currentNode as SubPage;
		}
		function nextNode() {
			saveCurrentNode();
			currentNode = { values: [] };
			currentParent = null;
			currentFollow = null;
			currentName = null;
			doneAnything = false;
		}
		while (args.length) {
			const arg = args.shift();
			// console.log(JSON.stringify({ currentNode, currentName, currentParent, doneAnything, arg }, null, 2));
			switch (arg) {
				case '-v':
				case '--verbose':
					root.verbose = true;
					break;
				case '-d':
				case '--dry-run':
					root.dryRun = true;
					break;
				case '-P':
				case '--pretty':
					root.pretty = true;
					break;
				case '-n':
				case '--name':
					if (currentName) nextNode();
					currentName = args.shift();
					if (!currentName) throw new Error("No name");
					if (usedNames.has(currentName!)) throw new Error("Duplicate name");
					usedNames.add(currentName!);
					doneAnything = true;
					break;
				case '-t':
				case '--text':
					currentNode.values.push({ type: 'text' });
					doneAnything = true;
					break;
				case '-T':
				case '--tag':
					currentNode.values.push({ type: 'tag' });
					doneAnything = true;
					break;
				case '-a':
				case '--attr':
				case '--attribute':
					const attr = args.shift();
					if (!attr) throw new Error("No attribute");
					currentNode.values.push({ type: 'attr', attr });
					doneAnything = true;
					break;
				case '-p':
				case '--parent': {
					if (currentParent || currentFollow) nextNode();
					const id = args.shift()!;
					if (!id) throw new Error("No parent");
					currentParent = getNode(id!);
					doneAnything = true;
					break;
				}
				case '-f':
				case '--follow': {
					if (currentParent || currentFollow) nextNode();
					const id = args.shift()!;
					if (!id) throw new Error("No follow");
					currentFollow = getNode(id!) as SubPage;
					doneAnything = true;
					break;
				}
				case '--':
				case '--next':
					if (!doneAnything) throw new Error("Redundant next");
					nextNode();
					break;
				default:
					if (currentNode.selector) nextNode();
					doneAnything = true;
					currentNode.selector = arg;
			}
			if (!args.length && doneAnything) saveCurrentNode();
		}
		// function *allNodes(node?: SubPage): Generator<SubPage> {
		// 	if (!node) {
		// 		for (const id in root.children) yield *allNodes(root.children[id]);
		// 		return;
		// 	}
		// 	yield node;
		// 	if (node.children) for (const id in node.children)
		// 		yield *allNodes(node.children[id]);
		// 	if (node.follow) for (const id in node.follow)
		// 		yield *allNodes(node.follow[id]);
		// }
		// for (const node of allNodes()) {
		// 	if (empty(node.children) && empty(node.follow) && !node.values.length)
		// 		node.values.push({ type: "text" });
		// }
		return root;
	} catch (e) {
		dieWithUsage(e as Error);
		throw e;
	}
}

function empty(val: Object | undefined | null) {
	return !val || Object.values(val).length === 0;
}
