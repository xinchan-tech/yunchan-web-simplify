import { useState } from "react";
import {
  MessageImage,
  MediaMessageContent,
  MessageContentType,
  Message,
} from "wukongimjssdk";
import MsgCard from "../../components/msg-card";
import { getRevokeText } from "../text";

export class ImageContent extends MediaMessageContent {
  width!: number;
  height!: number;
  url!: string;
  imgData?: string;
  constructor(file?: File, imgData?: string, width?: number, height?: number) {
    super();
    this.file = file;
    this.imgData = imgData;
    this.width = width || 0;
    this.height = height || 0;
  }
  decodeJSON(content: any) {
    this.width = content["width"] || 0;
    this.height = content["height"] || 0;
    this.url = content["url"] || "";
    this.remoteUrl = this.url;
  }
  encodeJSON() {
    return {
      width: this.width || 0,
      height: this.height || 0,
      url: this.remoteUrl || "",
    };
  }
  get contentType() {
    return MessageContentType.image;
  }
  get conversationDigest() {
    return "[图片]";
  }
}

const imageScale = (
  orgWidth: number,
  orgHeight: number,
  maxWidth = 250,
  maxHeight = 250
) => {
  let actSize = { width: orgWidth, height: orgHeight };
  if (orgWidth > orgHeight) {
    //横图
    if (orgWidth > maxWidth) {
      // 横图超过最大宽度
      let rate = maxWidth / orgWidth; // 缩放比例
      actSize.width = maxWidth;
      actSize.height = orgHeight * rate;
    }
  } else if (orgWidth < orgHeight) {
    //竖图
    if (orgHeight > maxHeight) {
      let rate = maxHeight / orgHeight; // 缩放比例
      actSize.width = orgWidth * rate;
      actSize.height = maxHeight;
    }
  } else if (orgWidth === orgHeight) {
    if (orgWidth > maxWidth) {
      let rate = maxWidth / orgWidth; // 缩放比例
      actSize.width = maxWidth;
      actSize.height = orgHeight * rate;
    }
  }
  return actSize;
};

const getImageSrc = (content: MessageImage) => {
  return content.remoteUrl;
};

const ImageCell = (props: { message: Message }) => {
  const { message } = props;
  const [showPreview, setShowPreview] = useState(false);

  const content = message.content as MessageImage;

  const getImageElement = () => {
    const content = message.content as MessageImage;
    let scaleSize = imageScale(content.width, content.height);
    return (
      <MsgCard data={message}>
        <img
          alt=""
          src={getImageSrc(content)}
          style={{
            borderRadius: "5px",
            width: scaleSize.width,
            height: scaleSize.height,
          }}
        />
      </MsgCard>
    );
  };

  return (
    <>
      {message.content.revoke === true
        ? getRevokeText(message.content.revoker)
        : getImageElement()}
    </>
  );
};

export default ImageCell;
