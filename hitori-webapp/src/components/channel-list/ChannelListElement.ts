import { ChannelElement } from "./ChannelElement";

export type Channel = {
	name: string;
};

export class ChannelListElement extends HTMLElement {
	listElem: HTMLUListElement;
	channels: ChannelElement[];
	selected: number;

	onSelect: ((i: number) => void)[];

	public constructor() {
		super();

		customElements.define("x-channel", ChannelElement);

		this.listElem = this.safeQuerySelector("#channels");
		this.channels = [];
		this.selected = 0;
		this.onSelect = [];
	}

	public addChannels(channels: Channel[]) {
		const dummy: ChannelElement = this.listElem.removeChild(
			this.listElem.children[0],
		) as ChannelElement;

		for (const [i, c] of channels.entries()) {
			const channel = dummy.cloneNode(true) as ChannelElement;
			channel.init(this, i, c.name);
			this.listElem.appendChild(channel);
			this.channels.push(channel);
		}
		this.selected = Number.parseInt(
			localStorage.getItem("hitori-selected") || "0",
		);
		this.triggerSelect(this.selected);
	}

	public triggerSelect(selected: number) {
		this.channels[this.selected].deselect();
		this.channels[selected].select();
		this.selected = selected;
		localStorage.setItem("hitori-selected", String(selected));

		for (const e of this.onSelect) {
			e(selected);
		}
	}

	public clearOnSelect() {
		this.onSelect = [];
	}

	public addOnSelect(onselect: (i: number) => void) {
		this.onSelect.push(onselect);
	}
}

customElements.define("x-channel-list", ChannelListElement);
