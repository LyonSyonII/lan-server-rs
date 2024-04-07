import type { ChannelListElement, Channel } from "../components/channel-list/ChannelListElement";
import { MessageListElement, type Message } from "../components/message-list/MessageListElement";
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
  await messageList.setMessages(database.messages[0]);
  
  channelList.clearOnSelect();
  channelList.addOnSelect((i) => {
    messageList.setMessages(database.messages[i])
 });
}

export class IndexElement extends HTMLElement {
  public constructor() {
    super();
  }
  
  public async connectedCallback() {
    
    this.refreshState();
    return;
    const websocket = new WebSocket("ws://192.168.1.47:5555/ws");
/*     websocket.addEventListener("open", () => {
      websocket.send("connected");
    }); */
    websocket.addEventListener("message", (ev) => {
      console.log({ev});
    });
    this.refreshState();
  }
  
  public async refreshState() {
    type Database = {
      messages: Message[][];
      channels: Channel[];
    };
    const database: Database = await fetch(DbUrl).then(r => r.json());
    
    const channelList: ChannelListElement = document.body.querySelector("x-channel-list")!;
    channelList.addChannels(database.channels);
    
    const messageList: MessageListElement = document.body.querySelector("x-message-list")!;
    await messageList.setMessages(database.messages[0]);
    
    channelList.clearOnSelect();
    channelList.addOnSelect((i) => {
      messageList.setMessages(database.messages[i])
   });
  }
}