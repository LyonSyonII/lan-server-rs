import { MessageElement } from "./MessageElement";
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import DropTarget from "@uppy/drop-target";
import { downloadFile } from "../../utils";

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
    
    const wrapper = document.querySelector("x-message-list")! as HTMLDivElement;
  
    const uppy = new Uppy()
      .use(Dashboard, { 
        trigger: "#button-upload",
        theme: "dark",
        closeModalOnClickOutside: true,
        singleFileFullScreen: true,
      })
    const dashboard = uppy.getPlugin<Dashboard>("Dashboard")!;
    uppy.use(DropTarget, { 
      target: wrapper,
      onDragOver: () => {
        dashboard.openModal();
      },
    });
    
    uppy.on("complete", (result) => {
      console.log({result});
      for (const f of result.successful) {
        downloadFile(f.data, f.name, f.meta.type);
      }
      dashboard.closeModal();
    });
  }
  
  public async setMessages(messages: Message[]) {
    this.innerHTML = "";

    for (const m of messages) {
      this.addMessage(m);
    }
  }

  public async addMessage(message: Message) {
    const element = this.dummy.cloneNode(true) as MessageElement;
    await element.init(message);
    this.appendChild(element)
    this.messages.push(element);
  }
}