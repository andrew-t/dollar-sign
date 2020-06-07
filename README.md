# `dollar-sign`

`dollar-sign` takes an input stream, parses it as HTML, then returns the inner text of any elements that match a supplied selector.

I built it because I was doing a crossword and thought an answer might be a four-letter country ending in 'I'. (It wasn't.) I'd found [a list of countries](curl https://www.britannica.com/topic/list-of-countries-1993160) but it wasn't sortable by length or last letter so it didn't help much.

With this tool, I can do this:

``` sh

curl https://www.britannica.com/topic/list-of-countries-1993160 \
	| dollar-sign ".topic-list li" \
	| egrep -i "^[a-z]{3}i$";

```

It reports the only two countries that match my criteria are Fiji and Mali.
