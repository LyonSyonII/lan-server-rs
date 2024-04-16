import type Dashboard from "@uppy/dashboard";
import { downloadFile } from "../../utils";
import { MessageElement, type OnMessageEditCallback } from "./MessageElement";

export type Message = {
	date: string;
	text: string;
};

export class MessageListElement extends HTMLElement {
	dummy: MessageElement;
	messages: MessageElement[];
	onMessageEdit: OnMessageEditCallback[];
	selected: number;

	public constructor() {
		super();

		this.messages = [];
		this.onMessageEdit = [];
		this.selected = 0;
		this.dummy = this.removeChild(this.children[0]) as MessageElement;
		
		this.parentElement?.addEventListener("scroll", () => {
			const parent = this.parentElement;
			if (!parent) return;

			const top = -parent.scrollHeight + parent.clientHeight;
			if (parent.scrollTop <= top) {
				
			}
		})
	}

	async connectedCallback() {
		const wrapper =
			document.body.safeQuerySelector<HTMLDivElement>("x-message-list");

		const { Uppy } = await import("@uppy/core");
		const Dashboard = (await import("@uppy/dashboard")).default;
		const DropTarget = (await import("@uppy/drop-target")).default;

		const uppy = new Uppy().use(Dashboard, {
			trigger: "#button-upload",
			theme: "dark",
			closeModalOnClickOutside: true,
			singleFileFullScreen: true,
		});

		const dashboard = uppy.getPlugin<Dashboard>("Dashboard");
		if (!dashboard) throw new Error("[uppy] Dashboard plugin not found");

		uppy.use(DropTarget, {
			target: wrapper,
			onDragOver: () => {
				dashboard.openModal();
			},
		});

		uppy.on("complete", (result) => {
			console.log({ result });
			for (const f of result.successful) {
				downloadFile(f.data, f.name, f.meta.type);
			}
			dashboard.closeModal();
		});
	}

	public async setMessages(messages: Message[]) {
		this.innerHTML = "";

		const elements = await Promise.all(
			messages.map((m, i) => this.messageToElement(i, m)),
		);
		this.messages = elements;
		this.append(...elements);
	}

	async messageToElement(
		index: number,
		message: Message,
	): Promise<MessageElement> {
		const element = this.dummy.cloneNode(true) as MessageElement;
		await element.init(index, message, (text, date, index) => {
			for (const onEdit of this.onMessageEdit) {
				onEdit(text, date, index);
			}
		});
		return element;
	}

	public async addNewMessage(index: number, message: Message) {
		const element = await this.messageToElement(index, message);
		this.appendChild(element);
		this.messages.push(element);
	}

	public addOnMessageEdit(callback: OnMessageEditCallback) {
		this.onMessageEdit.push(callback);
	}
}

customElements.define("x-message-list", MessageListElement);
