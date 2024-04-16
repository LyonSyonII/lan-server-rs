import DbUrl from "/DB.json?url";
import {
	type Channel,
	ChannelListElement,
} from "./channel-list/ChannelListElement";
import { MessageInputElement } from "./message-list/MessageInputElement";
import {
	type Message,
	MessageListElement,
} from "./message-list/MessageListElement";

import.meta.glob("../auto-import/*", { eager: true });

type Database = {
	messages: Message[][];
	channels: Channel[];
};
const database: Database = await fetch(DbUrl).then((r) => r.json());
const serverIP = await Promise.any(
	Array.from({ length: 252 }, async (_, i) => {
		const ip = `http://192.168.1.${i + 2}:5555`;
		try {
			const status = await fetch(ip, { mode: "cors" }).then((r) => r.status);
			return (status === 200 && Promise.resolve(ip)) || Promise.reject();
		} catch {
			return Promise.reject();
		}
	}),
);
alert(`Connected to ${serverIP}`)

/* await (async () => {
	const { faker } = await import("@faker-js/faker");
	const date = new Date().toISOString();
	const text = faker.lorem.lines(3);
	const messages: Message[] = await Promise.all(
		[...Array(100000)].map(async () => ({ date, text })),
	);
	database.messages[2].push(...messages);
})(); */

export async function refreshState() {
	const channelList: ChannelListElement =
		document.body.safeQuerySelector("x-channel-list");
	channelList.addChannels(database.channels);

	const messageList: MessageListElement =
		document.body.safeQuerySelector("x-message-list");

	channelList.clearOnSelect();
	channelList.addOnSelect((i) => {
		messageList.setMessages(database.messages[i]);
	});

	const messageInput: MessageInputElement =
		document.body.safeQuerySelector("x-message-input");

	messageInput.addOnSubmit(async (text) => {
		const i = channelList.selected;
		const message: Message = {
			date: new Date().toISOString(),
			text,
		};
		database.messages[i].push(message);
		await messageList.addNewMessage(database.messages.length - 1, message);
		// TODO: Save to permanent Database
	});

	messageList.addOnMessageEdit((text, date, index) => {
		console.log({ text, date, message: index });
		const channel = channelList.selected;
		database.messages[channel][index] = {
			text,
			date: date.toISOString(),
		};
		// TODO: Save to permanent Database
	});

	await messageList.setMessages(database.messages[channelList.selected]);
}
