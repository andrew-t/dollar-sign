export default function dieWithUsage(error?: Error) {
	if (error) console.error(error.stack);
	else console.error(`
Parses stdin as HTML and returns the inner text of elements matching a given CSS selector.

Usage:

  dollar-sign [URL] [OPTIONS] [SELECTOR]

Examples:

  curl http://example.com | dollar-sign ".main li"
  dollar-sign -t ".main li" < index.html
  cat index.html | dollar-sign -a data-value ".main li"
  dollar-sign http://example.com -l a -a data-value ".main li"

Allowed options:

  -a ATTR             Instead of the inner text,
  --attr ATTR         return the value of the attribute ATTR.
  --attribute ATTR

  -t                  Instead of the inner text,
  --tag               return the HTML tag.

  -l                  For each matching link found,
  --list              follow it and repeat the process
`);
	process.exit(1);
}
