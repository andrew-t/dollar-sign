#!/usr/bin/env node

const cheerio = require('cheerio');

if (process.argv.length != 3) {
	console.error('Usage:');
	console.error('  curl [URL] | dollar-sign [SELECTOR]');
	console.error('  curl http://example.com | dollar-sign ".main li"');
	process.exit(1);
}
const selector = process.argv[2];

let buffers = [];
process.stdin.on('data', b => buffers.push(b));
process.stdin.on('end', () => {
	const html = Buffer.concat(buffers).toString(),
		$ = cheerio(html),
		els = $.find(selector);
	for (const el of els.toArray())
		console.log(cheerio(el).text());
});
