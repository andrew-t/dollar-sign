export interface PageChildren {
	[id: string]: SubPage;
}

export interface PageOptions {
	html?: string | null;
	url: string | null;
	children: PageChildren;
}

export type ElementValue = {
	type: "text" | "tag";
	attr?: undefined | null;
} | {
	type: "attr";
	attr: string;
};

export interface SubPage {
	selector: string;
	follow?: PageChildren | null;
	value: ElementValue;
}

export interface Result {
	url: string | null,
	values: { [id: string]: Array<Result | string | null> };
}
