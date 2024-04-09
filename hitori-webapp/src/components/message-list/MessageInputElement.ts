export class MessageInputElement extends HTMLElement {
	defaultHeight: number;
	textarea: HTMLTextAreaElement;
	onSubmit: ((message: string) => void)[];

	public constructor() {
		super();
		this.onSubmit = [];

		this.safeQuerySelector<HTMLButtonElement>("#submit").addEventListener(
			"click",
			() => this.submit(),
		);

		this.textarea = this.safeQuerySelector("textarea");
		this.defaultHeight = this.textarea.clientHeight;

		this.textarea.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && e.ctrlKey) {
				e.preventDefault();
				this.submit();
			}
		});
		this.textarea.addEventListener("input", (e) => {
			const target = e.target as HTMLTextAreaElement;
			target.style.height = "1px";
			target.style.height = `${target.scrollHeight}px`;
		});
	}

	public submit() {
		this.textarea.style.height = "";

		const value = this.textarea.value;
		this.textarea.value = "";

		for (const onSubmit of this.onSubmit) {
			onSubmit(value);
		}
	}

	public addOnSubmit(callback: (message: string) => void) {
		this.onSubmit.push(callback);
	}
}

customElements.define("x-message-input", MessageInputElement);
