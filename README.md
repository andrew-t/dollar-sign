# `dollar-sign`

## Installation

This is intended to be used as a command-line tool, so would usually be installed globally:

```sh
npm install -g @andrewtaylor/dollar-sign
```

## Usage and aims

`dollar-sign` takes an input stream, parses it as HTML, then returns the inner text of any elements that match a supplied selector.

I built it because I was doing [a crossword](https://www.theguardian.com/crosswords/prize/28153) and the clue "Mark fighter for country (4)" came up. The answer presumably was something that means 'mark', followed by a fighter, which makes a four-letter country, and since I already had 12 across, I knew it ended in "I". I'd found [a list of countries](https://www.britannica.com/topic/list-of-countries-1993160) but it wasn't sortable by length or last letter so it didn't help much.

With this tool, I can do this:

``` sh
curl -s https://www.britannica.com/topic/list-of-countries-1993160 \
	| dollar-sign ".topic-list li" \
	| egrep -i "^[a-z]{3}i$";
```

It reports the only four-letter countries ending in I are Fiji and Mali. "M" means "Mark" and "ALI" is a fighter, so that was the answer.

I expect this tool has other uses.

## Options

If it isn't the inner text you want, you can pick out attributes:

```sh
curl -s http://example.com \
	| dollar-sign -a class "li > a"
```

Or you can pick out the tag name:

```sh
curl -s http://example.com \
	| dollar-sign -t ".some-class"
```
