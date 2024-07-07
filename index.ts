#!/usr/bin/env node

import $, { AnyNode, Cheerio, Element } from 'cheerio';
import parseArgs from "./args";
import { MatchingPage, ElementValue, MatchChildren, PageChildren } from "./types";

const options = parseArgs(process.argv.slice(2));

if (options.verbose || options.dryRun) console.error(JSON.stringify(options, null, 2));

if (!options.dryRun) getStartPage(options.url)
	.then(html => getChildren(options.children, html, options.url))
	.then(json => console.log(options.pretty
		? JSON.stringify(json, null, 2)
		: JSON.stringify(json)))
	.catch(console.error);


function getText(el: Element, step: ElementValue): string {
	switch (step.type) {
		case undefined: case 'text': return $(el).text();
		case 'attr': return $(el).attr(step.attr) ?? "";
		case 'tag': return el.tagName;
		case 'html': return $(el).html() ?? "";
	}
}

async function getStartPage(url: string | null) {
	if (url) return await getPage(url);
	const html = await new Promise<string>((resolve, reject) => {
		let buffers: Buffer[] = [];
		process.stdin.on('data', b => buffers.push(b));
		process.stdin.on('error', reject);
		process.stdin.on('end', () => resolve(Buffer.concat(buffers).toString()));
	});
	return $(html);
}

async function asyncMapObj<In, Out>(
	obj: Record<string, In>,
	callback: (val: In, id: string) => Out | Promise<Out>
): Promise<Record<string, Out>> {
	const output: Record<string, Out> = {};
	for (const id in obj) output[id] = await callback(obj[id], id);
	return output;
}

async function asyncMap<In, Out>(arr: In[], callback: (val: In, i: number) => Out | Promise<Out>) {
	const output: Out[] = [];
	for (let i = 0; i < arr.length; ++i) output[i] = await callback(arr[i], i);
	return output;
}

async function getChildren(children: PageChildren, html: Cheerio<AnyNode>, url: string | null): Promise<MatchChildren> {
	if (options.verbose) console.error(children);
	return await asyncMapObj(children,
		({ selector, values, children: grandChildren, follow }) =>
			asyncMap(html.find(selector).toArray(), 
				async el => ({
				values: values.map(val => getText(el, val)),
				children: grandChildren
					? await getChildren(grandChildren, $(el), url)
					: null,
				follow: follow
					? await getFollow(follow, $(el).attr("href"), url)
					: null,
			})));
}

async function getFollow(
	follow: PageChildren,
	relPath: string | undefined,
	baseUrl: string | null
): Promise<MatchingPage | null> {
	if (!relPath) return null;
	const url = relativeUrl(relPath, baseUrl);
	return {
		url,
		children: await getChildren(follow, await getPage(url), url)
	};
}

function relativeUrl(url: string, baseUrl: string | null): string {
	url = url.replace(/#.*$/, '');
	if (!url) throw new Error("#urls not supported");
	if (url.includes('://')) return url;
	if (!baseUrl) throw new Error("Relative path with no base URL");
	const p = new URL(baseUrl);
	if (url.startsWith('//')) return p.protocol + url;
	if (url.startsWith('/')) return p.origin + url;
	return p.origin + p.pathname.replace(/\/[^/]*$/, '/') + url;
}

async function getPage(url: string) {
	if (options.verbose) console.error("Fetching URL", url);
	try {
		const res = await fetch(url);
		return $(await res.text());
	} catch(e) {
		console.error("Error while fetching", url);
		throw e;
	}
}
