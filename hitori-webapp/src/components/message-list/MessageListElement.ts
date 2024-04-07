import { MessageElement } from "./MessageElement";

export type Message = {
  date: string
  text: string,
};

export class MessageListElement extends HTMLElement {
  dummy: MessageElement;
  messages: MessageElement[];
  selected: number;
  
  public constructor() {
    super();
    
    this.messages = [];
    this.selected = 0;
    this.dummy = this.removeChild(this.children[0]) as MessageElement;
  }
  
  public async setMessages(messages: Message[]) {
    this.innerHTML = "";

    for (const m of messages) {
      const message = this.dummy.cloneNode(true) as MessageElement;
      await message.init(m);
      this.appendChild(message);
      this.messages.push(message);
    }
  }
}