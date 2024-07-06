#!/usr/bin/env node

import $, { Element } from 'cheerio';
import parseArgs from "./args";
import { Result, PageOptions, SubPage, ElementValue } from "./types";

const options = parseArgs(process.argv.slice(2));

// console.log(JSON.stringify(options, null, 2));

class Page {
	html: string | null;
	url: string | null;
	children: { [id: string]: SubPage };

	constructor({ html, url, children }: PageOptions) {
		this.html = html ?? null;
		this.url = url ?? null;
		this.children = children;
	}
	
	async getHtml(): Promise<string> {
		if (this.html) return this.html;
		if (this.url == "stdio") return await new Promise((resolve, reject) => {
			let buffers: Buffer[] = [];
			process.stdin.on('data', b => buffers.push(b));
			process.stdin.on('error', reject);
			process.stdin.on('end', () => resolve(Buffer.concat(buffers).toString()));
		});
		if (!this.url) throw new Error("Page has no URL");
		console.log("Fetching URL", this.url);
		const res = await fetch(this.url);
		return await res.text();
	}

	async fetch(): Promise<Result> {
		const html = $(await this.getHtml());
		const output: Result = { url: this.url, values: {} };
		for (const id in this.children) {
			const { selector, value: valuePosition, follow } = this.children[id];
			const values: Array<Result | string | null> = [];
			output.values[id] = values;
			for (const el of html.find(selector).toArray()) {
				const value = getText(el, valuePosition);
				if (!value) values.push(null);
				else if (!follow) values.push(value);
				else values.push(await new Page({
					url: this.relativeUrl(value),
					children: follow
				}).fetch());
			}
		}
		return output;
	}

	relativeUrl(url: string): string {
		url = url.replace(/#.*$/, '');
		if (!url) throw new Error("#urls not supported");
		if (url.includes('://')) return url;
		if (!this.url) throw new Error("Parent must have URL");
		const p = new URL(this.url);
		if (url.startsWith('//')) return p.protocol + url;
		if (url.startsWith('/')) return p.origin + url;
		return p.origin + p.pathname.replace(/\/[^/]*$/, '/') + url;
	}
}

function getText(el: Element, step: ElementValue): string {
	switch (step.type) {
		case undefined: case 'text': return $(el).text();
		case 'attr': return $(el).attr(step.attr) ?? "";
		case 'tag': return el.tagName;
	}
}

new Page(options).fetch()
	.then(json => console.log(JSON.stringify(json, null, 2)))
	.catch(console.error);
