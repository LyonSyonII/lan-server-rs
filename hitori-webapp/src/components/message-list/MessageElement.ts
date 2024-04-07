import { marked } from "marked";
import type { Message } from "./MessageListElement";

export class MessageElement extends HTMLElement {
  dateElem: HTMLParagraphElement;
  textElem: HTMLDivElement;

  date: Date;
  text: string;

  public constructor() {
    super();
    
    this.date = new Date();
    this.text = "UNDEFINED";
    this.dateElem = this.querySelector("p")!;
    this.textElem = this.querySelector("div")!;
  }

  public async init(m: Message) {
    this.date = new Date(m.date);
    this.dateElem.textContent = this.date.toLocaleString();
    this.textElem.innerHTML = await marked(m.text || "");
  }
}