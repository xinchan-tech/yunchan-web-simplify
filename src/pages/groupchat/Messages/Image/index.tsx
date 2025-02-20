import { useState } from 'react'
import { type MessageImage, MediaMessageContent, MessageContentType, type Message } from 'wukongimjssdk'
import MsgCard from '../../components/msg-card'
import { RevokeText } from '../text'
import Viewer from 'react-viewer'

export class ImageContent extends MediaMessageContent {
  width!: number
  height!: number
  url!: string
  imgData?: string
  constructor(file?: File, imgData?: string, width?: number, height?: number) {
    super()
    this.file = file
    this.imgData = imgData
    this.width = width || 0
    this.height = height || 0
  }
  decodeJSON(content: any) {
    this.width = content['width'] || 0
    this.height = content['height'] || 0
    this.url = content['url'] || ''
    this.remoteUrl = this.url
  }
  encodeJSON() {
    return {
      width: this.width || 0,
      height: this.height || 0,
      url: this.remoteUrl || ''
    }
  }
  get contentType() {
    return MessageContentType.image
  }
  get conversationDigest() {
    return '[图片]'
  }
}

const imageScale = (orgWidth: number, orgHeight: number, maxWidth = 250, maxHeight = 250) => {
  let actSize = { width: orgWidth, height: orgHeight }
  if (orgWidth > orgHeight) {
    //横图
    if (orgWidth > maxWidth) {
      // 横图超过最大宽度
      let rate = maxWidth / orgWidth // 缩放比例
      actSize.width = maxWidth
      actSize.height = orgHeight * rate
    }
  } else if (orgWidth < orgHeight) {
    //竖图
    if (orgHeight > maxHeight) {
      let rate = maxHeight / orgHeight // 缩放比例
      actSize.width = orgWidth * rate
      actSize.height = maxHeight
    }
  } else if (orgWidth === orgHeight) {
    if (orgWidth > maxWidth) {
      let rate = maxWidth / orgWidth // 缩放比例
      actSize.width = maxWidth
      actSize.height = orgHeight * rate
    }
  }
  return actSize
}

const getImageSrc = (content: MessageImage) => {
  return content.remoteUrl
}

const ImageCell = (props: { message: Message }) => {
  const { message } = props
  const [showPreview, setShowPreview] = useState(false)

  const getImageElement = () => {
    const content = message.content as MessageImage
    let scaleSize = imageScale(content.width, content.height)
    const imageURL = getImageSrc(content)
    return (
      <MsgCard data={message}>
        <img
          alt=""
          src={imageURL}
          className="msgcard-img"
          style={{
            borderRadius: '5px',
            width: scaleSize.width,
            height: scaleSize.height
          }}
          onClick={() => {
            setShowPreview(true)
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              // Enter or Space key
              setShowPreview(true)
            }
          }}
        />
        {showPreview && (
          <Viewer
            noImgDetails={true}
            visible
            downloadable={true}
            rotatable={false}
            changeable={false}
            showTotal={false}
            onClose={() => {
              setShowPreview(false)
            }}
            customToolbar={defaultConfigs => {
              return defaultConfigs.filter(conf => {
                return ![3, 4, 5, 6, 7, 9, 10].includes(conf.actionType as number)
              })
            }}
            images={[{ src: imageURL, alt: '', downloadUrl: imageURL }]}
          />
        )}
      </MsgCard>
    )
  }

  return (
    <>{message?.remoteExtra?.revoke === true ? <RevokeText data={message?.remoteExtra?.extra} /> : getImageElement()}</>
  )
}

export default ImageCell
