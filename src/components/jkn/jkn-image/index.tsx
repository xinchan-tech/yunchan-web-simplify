import { nanoid } from 'nanoid'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import Viewer from 'react-viewer'

export const JknImage = {
  preview: (src: string) => {
    let rootEl = document.getElementById('image-preview-wrapper')

    if (!rootEl) {
      const el = document.createElement('div')
      el.id = 'image-preview-wrapper'
      document.body.appendChild(el)
      rootEl = el
    }

    const container = document.createElement('div')
    rootEl.appendChild(container)
    container.id = `image-preview-${nanoid(8)}`

    const root = createRoot(container)

    const destroy = () => {
      // root.unmount()
    }

    root.render(<ImagePreview src={src} afterClose={destroy} />)
  }
}

const ImagePreview = ({ src, afterClose }: { src: string; afterClose: () => void }) => {
  const [visible, setVisible] = useState(true)

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => {
      afterClose()
    }, 300)
  }

  return <Viewer visible={visible} onClose={handleClose} images={[{ src: src, alt: '' }]} />
}

export { JknImageUploader } from './uploader'