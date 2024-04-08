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
        console.log({lang, language});
        return hljs.highlight(code, { language }).value;
      }
    })
  )
  
  return marked.parse(text, { breaks: true });
}

export class MessageElement extends HTMLElement {
  dateElem: HTMLParagraphElement;
  textElem: HTMLDivElement;
  
  date: Date;
  text: string;

  onEdit: ((this: MessageElement) => void)[]

  public constructor() {
    super();
    
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
      this.textElem.innerHTML = await parseMarkdown(this.textElem.innerText);
    })
  }

  public async init(m: Message, onEdit?: (this: MessageElement) => void) {
    this.text = m.text;
    this.date = new Date(m.date);
    this.dateElem.textContent = this.date.toLocaleString();
    this.textElem.innerHTML = await parseMarkdown(this.text || "");
    onEdit && this.onEdit.push(onEdit);
  }
}