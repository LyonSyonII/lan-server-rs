import { MessageElement, type OnMessageEditCallback } from "./MessageElement";
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
  onMessageEdit: OnMessageEditCallback[]
  selected: number;
  
  public constructor() {
    super();
    
    this.messages = [];
    this.onMessageEdit = [];
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

    for (const [i, m] of messages.entries()) {
      this.addMessage(i, m);
    }
  }

  public async addMessage(index: number, message: Message) {
    const element = this.dummy.cloneNode(true) as MessageElement;
    await element.init(index, message, (text, date, index) => {
      for (const onEdit of this.onMessageEdit) {
        onEdit(text, date, index)
      }
    });
    this.appendChild(element)
    this.messages.push(element);
  }
  
  public addOnMessageEdit(callback: OnMessageEditCallback) {
    this.onMessageEdit.push(callback)
  }
}