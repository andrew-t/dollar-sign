// config

export interface PageOptions {
	url: string | null;
	verbose?: boolean;
	dryRun?: boolean;
	pretty?: boolean;
	children: PageChildren;
}

export interface PageChildren {
	[id: string]: SubPage;
}

export interface SubPage {
	selector: string;
	follow?: PageChildren | null;
	values: ElementValue[];
	children?: PageChildren | null;
}

export type ElementValue = {
	type: "text" | "html" | "tag";
	attr?: undefined | null;
} | {
	type: "attr";
	attr: string;
};

export interface MatchingPage {
	url: string | null,
	children: MatchChildren;
}

export interface MatchingElement {
	values: string[];
	children: MatchChildren | null;
	follow: MatchingPage | null;
}

export interface MatchChildren {
	[id: string]: Array<MatchingElement | string>;
}
