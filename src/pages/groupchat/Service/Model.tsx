import { type Message, type MessageText, MessageContentType } from 'wukongimjssdk'

export enum PartType {
  text = 0, // 普通文本
  emoji = 1, // emoji
  mention = 2, // @
  link = 3 // 链接
}

export class Part {
  type!: PartType // 文本内容： text:普通文本 emoji: emoji文本 mention：@文本
  text!: string
  data?: any

  constructor(type: PartType, text: string, data?: any) {
    this.type = type
    this.text = text
    this.data = data
  }
}
export class MessageWrap {
  public message: Message
  private _parts!: Array<Part>
  public get content() {
    return this.message.content
  }
  constructor(message: Message) {
    this.message = message
    // this.order = message.messageSeq * OrderFactor
  }

  public get parts(): Array<Part> {
    if (!this._parts) {
      this._parts = this.parseMention()
      // this._parts = this.parseEmoji(this._parts);
      this._parts = this.parseLinks(this._parts)
    }
    return this._parts
  }

  // 解析@
  private parseMention(): Array<Part> {
    if (this.content.contentType !== MessageContentType.text) {
      return new Array<Part>()
    }
    const textContent = this.content as MessageText
    let text = textContent.text || ''
    const mention = this.content.mention
    if (!mention?.uids || mention.uids.length <= 0) {
      return [new Part(PartType.text, text)]
    }
    const parts = new Array<Part>()
    let i = 0
    while (text.length > 0) {
      //   const mentionMatchResult = text.match(/@([\w\u4e00-\u9fa5])+/m);
      const mentionMatchResult = text.match(/@([\S])+/m)
      let index = mentionMatchResult?.index
      if (index === undefined) {
        index = -1
      }
      if (!mentionMatchResult || index === -1) {
        parts.push(new Part(PartType.text, text))
        break
      }
      if (index > 0) {
        parts.push(new Part(PartType.text, text.substring(0, index)))
      }
      let data = {}
      if (i < mention.uids.length) {
        data = { uid: mention.uids[i] }
      }

      parts.push(new Part(PartType.mention, text.substr(index, mentionMatchResult[0].length), data))
      text = text.substring(index + mentionMatchResult[0].length)

      i++
    }
    return parts
  }
  // 解析emoji
  // parseEmoji(parts: Array<Part>): Array<Part> {
  //     if (!parts || parts.length <= 0) {
  //         return parts;
  //     }
  //     let len = parts.length;
  //     let newParts = new Array<Part>();
  //     for (let index = 0; index < len; index++) {
  //         const part = parts[index];
  //         if (part.type === PartType.text) {
  //             let text = part.text;
  //             while (text.length > 0) {
  //                 const matchResult = text.match(DefaultEmojiService.shared.emojiRegExp())
  //                 if (!matchResult) {
  //                     newParts.push(new Part(PartType.text, text))
  //                     break
  //                 }
  //                 let index = matchResult?.index
  //                 if (index === undefined) {
  //                     index = -1
  //                 }
  //                 if (index === -1) {
  //                     newParts.push(new Part(PartType.text, text))
  //                     break
  //                 }
  //                 if (index > 0) {
  //                     newParts.push(new Part(PartType.text, text.substring(0, index)));
  //                 }
  //                 newParts.push(new Part(PartType.emoji, text.substr(index, matchResult[0].length)));
  //                 text = text.substring(index + matchResult[0].length);
  //             }
  //         } else {
  //             newParts.push(part);
  //         }

  //     }
  //     return newParts;
  // }

  parseLinks(parts: Array<Part>): Array<Part> {
    if (!parts || parts.length <= 0) {
      return parts
    }
    const newParts = new Array<Part>()
    const len = parts.length
    for (let index = 0; index < len; index++) {
      const part = parts[index]
      if (part.type === PartType.text) {
        let text = part.text
        while (text.length > 0) {
          const matchResult = text.match(
            /((http|ftp|https):\/\/|www.)[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/
          )
          if (!matchResult) {
            newParts.push(new Part(PartType.text, text))
            break
          }
          let index = matchResult?.index
          if (index === undefined) {
            index = -1
          }
          if (index === -1) {
            newParts.push(new Part(PartType.text, text))
            break
          }
          if (index > 0) {
            newParts.push(new Part(PartType.text, text.substring(0, index)))
          }
          newParts.push(new Part(PartType.link, text.substr(index, matchResult[0].length)))
          text = text.substring(index + matchResult[0].length)
        }
      } else {
        newParts.push(part)
      }
    }
    return newParts
  }
}
