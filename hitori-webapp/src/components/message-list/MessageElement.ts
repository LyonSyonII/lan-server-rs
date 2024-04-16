import type { Message } from "./MessageListElement";

export async function parseMarkdown(text: string): Promise<string> {
	const { Marked } = await import("marked");
	const { markedHighlight } = await import("marked-highlight");
	const { codeToHtml } = await import("shiki");

	const marked = new Marked(
		markedHighlight({
			async: true,
			langPrefix: "hljs language-",
			highlight(code, lang) {
				return codeToHtml(code, {
					lang,
					themes: {
						dark: "andromeeda",
						light: "min-light",
					},
					defaultColor: "dark",
				});
			},
		}),
	);

	return marked.parse(text, { breaks: true });
}

export type OnMessageEditCallback = (
	text: string,
	date: Date,
	i: number,
) => void;

export class MessageElement extends HTMLElement {
	dateElem: HTMLParagraphElement;
	textElem: HTMLDivElement;

	index: number;
	date: Date;
	text: string;

	onEdit: OnMessageEditCallback[];

	public constructor() {
		super();

		this.index = Number.NaN;
		this.date = new Date();
		this.text = "UNDEFINED";
		this.onEdit = [];

		this.dateElem = this.safeQuerySelector("p");
		this.textElem = this.safeQuerySelector("div");

		this.textElem.addEventListener("dblclick", () => {
			this.textElem.style.setProperty("--msg-height", String(this.textElem.clientHeight));
			this.textElem.innerText = this.text;

			this.textElem.contentEditable = "true";
			this.textElem.focus();
		});
		this.textElem.addEventListener("blur", async () => {
			this.textElem.removeAttribute("contenteditable");
		
			this.text = this.textElem.innerText;
			this.textElem.innerHTML = await parseMarkdown(this.text);

			for (const onEdit of this.onEdit) {
				onEdit(this.text, this.date, this.index);
			}
		});
	}

	public async init(index: number, m: Message, onEdit?: OnMessageEditCallback) {
		this.index = index;
		this.text = m.text;
		this.date = new Date(m.date);
		this.dateElem.textContent = this.date.toLocaleString();
		this.textElem.innerHTML = await parseMarkdown(this.text || "");
		onEdit && this.onEdit.push(onEdit);
	}
}

customElements.define("x-message", MessageElement);
