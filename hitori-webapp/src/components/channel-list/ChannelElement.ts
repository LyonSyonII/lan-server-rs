import { ChannelListElement } from "./ChannelListElement";

export class ChannelElement extends HTMLElement {
  parentList: ChannelListElement;
  index: number;
  name: string;
  nameSpan: HTMLSpanElement;
  selected: boolean;
  
  public constructor() {
    super();
    this.index = 0;
    this.name = "UNDEFINED";
    this.selected = false;
    this.nameSpan = this.querySelector("span#name")!;
    this.parentList = this.parentElement as ChannelListElement;

    this.addEventListener("click", () => {
      this.parentList.triggerSelect(this.index);
    });
  }

  public init(parent: ChannelListElement, index: number, name: string) {
    this.index = index;
    this.parentList = parent;
    this.setName(name);
    this.style.display = "block";
  }

  public setName(name: string) {
    this.nameSpan.textContent = name;
  }
  
  public select() {
    this.toggleAttribute("selected", true);
  }
  public deselect() {
    this.toggleAttribute("selected", false);
  }
}