import type { ChannelListElement, Channel } from "../components/channel-list/ChannelListElement";
import { MessageListElement, type Message } from "../components/message-list/MessageListElement";
import type { MessageInputElement } from "./message-list/MessageInputElement";
import DbUrl from "/DB.json?url"

export async function refreshState() {
  type Database = {
    messages: Message[][];
    channels: Channel[];
  };
  const database: Database = await fetch(DbUrl).then(r => r.json());
  
  const channelList: ChannelListElement = document.body.querySelector("x-channel-list")!;
  channelList.addChannels(database.channels);
  
  const messageList: MessageListElement = document.body.querySelector("x-message-list")!;
  
  channelList.clearOnSelect();
  channelList.addOnSelect((i) => {
    messageList.setMessages(database.messages[i])
  });

  const messageInput: MessageInputElement = document.body.querySelector("x-message-input")!;
  messageInput.addOnSubmit(async (text) => {
    const i = channelList.selected;
    const message: Message = {
        date: (new Date()).toISOString(),
        text
    };
    database.messages[i].push(message);
    await messageList.addMessage(message);
  })
  
  await messageList.setMessages(database.messages[channelList.selected]);
}