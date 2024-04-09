import type { ChannelElement } from "../components/channel-list/ChannelElement";
import type { ChannelListElement } from "../components/channel-list/ChannelListElement";
import type { MessageElement } from "../components/message-list/MessageElement";
import type { MessageInputElement } from "../components/message-list/MessageInputElement";
import type { MessageListElement } from "../components/message-list/MessageListElement";

declare global {
	interface HTMLElement {
		safeQuerySelector<K extends keyof HTMLElementTagNameMap>(
			selector: K,
			error?: string,
		): HTMLElementTagNameMap[K];
		safeQuerySelector<E extends Element = Element>(
			selector: string,
			error?: string,
		): E;
	}

	interface HTMLElementTagNameMap {
		"x-message": MessageElement;
		"x-message-list": MessageListElement;
		"x-message-input": MessageInputElement;
		"x-channel": ChannelElement;
		"x-channel-list": ChannelListElement;
	}
}

HTMLElement.prototype.safeQuerySelector = function <
	K extends keyof HTMLElementTagNameMap,
>(selector: K, error?: string): HTMLElementTagNameMap[K] {
	const selected = this.querySelector(selector);
	if (!selected) {
		throw new Error(error || `'${selector}' not found`);
	}
	return selected;
};
