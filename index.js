#!/usr/bin/env node

const $ = require('cheerio');

const options = parseArgs(process.argv.slice(2));

let buffers = [];
process.stdin.on('data', b => buffers.push(b));
process.stdin.on('end', () => {
	const html = Buffer.concat(buffers).toString();
	parseHtml(html, options);
});

function parseHtml(html, { stringifier, selector }) {
	const els = $(html).find(selector);
	for (const el of els.toArray())
		console.log(stringifier(el));
}

function parseArgs(args) {
	if (args.length < 1) dieWithUsage();
	const selector = args.pop();
	let stringifier = el => $(el).text();
	while (args.length) {
		switch (args.shift()) {
			case '-a':
			case '--attr':
			case '--attribute':
				const attr = args.shift();
				stringifier = el => $(el).attr(attr);
				break;
			case '-t':
			case '--tag':
				stringifier = el => el.tagName;
				break;
			default:
				dieWithUsage();
		}
	}
	return { stringifier, selector };
}

function dieWithUsage() {
	console.error(`
Usage:
  curl [URL] | dollar-sign [OPTIONS] [SELECTOR]

Examples:
  curl http://example.com | dollar-sign ".main li"
  dollar-sign -t ".main li" < index.html
  cat index.html | dollar-sign -a data-value ".main li"

Allowed options:

  -a ATTR             Instead of the inner text,
  --attr ATTR         return the value of the attribute ATTR.
  --attribute ATTR

  -t                  Instead of the inner text,
  --tag               return the HTML tag.
`);
	process.exit(1);
}
