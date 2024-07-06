import dieWithUsage from "./die";
import { PageOptions, SubPage, PageChildren } from "./types";

// TODO: if a node has follows and doesn't specify a 'value' prop, assume '-a href' rather than '--text'

// TODO: you should be allowed several attributes per selector so you can associate the link text and the url

export default function parseArgs(args: string[]): PageOptions {
	// console.log(args);
	if (args.length < 1) dieWithUsage();
	try {
		const root: PageOptions = {
			html: null,
			url: args[0].includes('://') ? args.shift()! : "stdio",
			children: {}
		};
		// const nodes: { [id: string]: PageChildren } = { root: root.children };
		const usedNames = new Set<string>(["root"]);
		function getNode(id: string): PageChildren;
		function getNode(id: string, parent: PageChildren): PageChildren | null;
		function getNode(id: string, parent = root.children) {
			if (id == "root") return parent;
			if (id in parent) {
				const next = parent[id];
				if (!next.follow) next.follow = {};
				return next.follow;
			}
			if (parent == root.children) throw new Error(`Node ${id} not found`);
			for (const i in parent) {
				const next = parent[i].follow;
				if (!next) continue;
				const x = getNode(id, next)?.follow;
				if (x) return x;
			}
			return null;
		}
		let currentNode: Partial<SubPage> = {};
		let currentName: string | null | undefined = null;
		let currentParent: PageChildren | null = null;
		let doneAnything = false;
		function saveCurrentNode() {
			if (!currentNode.selector) throw new Error("No selector");
			if (!currentNode.value) currentNode.value = { type: 'text' };
			if (!currentName) currentName = currentNode.selector!;
			// nodes[currentName!] = currentNode;
			usedNames.add(currentName);
			if (currentParent) {
				if (!currentParent) currentParent = {};
				currentParent[currentName] = currentNode as SubPage;
			} else root.children[currentName] = currentNode as SubPage;
		}
		while (args.length) {
			const arg = args.shift();
			// console.log(JSON.stringify({ currentNode, currentName, currentParent, doneAnything, arg }, null, 2));
			switch (arg) {
				case '-n':
				case '--name':
					if (currentName) throw new Error("Two names");
					currentName = args.shift();
					if (!currentName) throw new Error("No name");
					// if (nodes[currentName]) dieWithUsage();
					if (usedNames.has(currentName!)) throw new Error("Duplicate name");
					usedNames.add(currentName!);
					// nodes[currentName] = currentNode;
					doneAnything = true;
					break;
				case '-x':
				case '--text':
					if (currentNode.value) throw new Error("Duplicate text");
					currentNode.value = { type: 'text' };
					doneAnything = true;
					break;
				case '-t':
				case '--tag':
					if (currentNode.value) throw new Error("Duplicate tag");
					currentNode.value = { type: 'tag' };
					doneAnything = true;
					break;
				case '-a':
				case '--attr':
				case '--attribute':
					if (currentNode.value) throw new Error("Duplicate attribute");
					currentNode.value = { type: 'attr', attr: args.shift()! };
					if (!currentNode.value!.attr) throw new Error("No attribute");
					doneAnything = true;
					break;
				case '-p':
				case '--parent':
					if (currentParent) throw new Error("Duplicate parent");
					// currentParent = nodes[args.shift()];
					const id = args.shift()!;
					if (!id) throw new Error("No parent");
					currentParent = getNode(id!);
					doneAnything = true;
					break;
				case '--':
				case '--next':
					if (!doneAnything) throw new Error("Redundant next");
					saveCurrentNode();
					currentNode = {};
					currentParent = null;
					currentName = null;
					doneAnything = false;
					break;
				default:
					if (currentNode.selector) throw new Error("Duplicate selector");
					doneAnything = true;
					currentNode.selector = arg;
			}
			if (!args.length && doneAnything) saveCurrentNode();
		}
		return root;
	} catch (e) {
		dieWithUsage(e as Error);
		throw e;
	}
}
