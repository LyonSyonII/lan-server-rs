import type { Message } from "./MessageListElement";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

export async function parseMarkdown(text: string): Promise<string> {
  const marked = new Marked(
    markedHighlight({
      langPrefix: "hljs language-",
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      }
    })
  )
  
  return marked.parse(text, { breaks: true });
}

export type OnMessageEditCallback = (text: string, date: Date, i: number) => void;

export class MessageElement extends HTMLElement {
  dateElem: HTMLParagraphElement;
  textElem: HTMLDivElement;
  
  index: number;
  date: Date;
  text: string;
  
  onEdit: (OnMessageEditCallback)[]

  public constructor() {
    super();
    
    this.index = NaN;
    this.date = new Date();
    this.text = "UNDEFINED";
    this.dateElem = this.querySelector("p")!;
    this.textElem = this.querySelector("div")!;
    this.onEdit = [];

    this.textElem.addEventListener("dblclick", () => {
      this.textElem.innerText = this.text;
      this.textElem.style.fontFamily = "monospace";

      this.textElem.contentEditable = "true";
      this.textElem.focus();
    });
    this.textElem.addEventListener("blur", async () => {
      this.textElem.contentEditable = "false";

      this.textElem.style.fontFamily = "";
      this.text = this.textElem.innerText;
      this.textElem.innerHTML = await parseMarkdown(this.text);

      for (const onEdit of this.onEdit) {
        onEdit(this.text, this.date, this.index);
      }
    })
  }
  
  public async init(index: number, m: Message, onEdit?: OnMessageEditCallback) {
    this.index = index;
    this.text = m.text;
    this.date = new Date(m.date);
    this.dateElem.textContent = this.date.toLocaleString();
    this.textElem.innerHTML = await parseMarkdown(this.text || "");
    onEdit && this.onEdit.push(onEdit);
  }
}

customElements.define("x-message", MessageElement);