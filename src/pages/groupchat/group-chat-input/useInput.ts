import domtoimage from 'dom-to-image'
import { useRef } from 'react'
function isNil(value: any) {
  return value == null
}
type ExportMsg =
  | string
  | {
      id?: string
      type?: 'aov'
      url?: string
      width?: number
      height?: number
    }
export type InputBoxText = {
  msg: string
  order: number
  type: 'text'
}
export type InputBoxImage = {
  type: 'aov' | 'img' | 'file'
  file: File
  order: number
  url?: string
  width?: number
  height?: number
}
export type InputBoxResult =
  | {
      msgData: InputBoxText[]
      needUploadFile: InputBoxImage[]
    }
  | undefined

export const useInput = ({ editorKey }: { editorKey: string }) => {
  // 图片的Map
  const imgMap = useRef({} as { [key: string]: File })
  // 文件的Map
  const fileImageMap = useRef({} as { [key: string]: File })
  // 消息msg
  const inputMsgData = useRef<ExportMsg[]>([])
  // 保证光标在最后
  const keepCursorEnd = (isReturn: boolean) => {
    const curEditor = document.getElementById(editorKey)
    if (window.getSelection && curEditor) {
      curEditor.focus()
      const sel = window.getSelection() // 创建range
      if (sel) {
        sel.selectAllChildren(curEditor) // range 选择obj下所有子内容
        sel.collapseToEnd() // 光标移至最后
      }
      if (isReturn) return sel
    }
  }
  // 删除@内容之前的原始文本
  const removeOverrageContent = (editor: HTMLElement, atStr: string, atNode: HTMLElement) => {
    const childLen = editor.childNodes.length || 0
    for (let i = 0; i < childLen; i++) {
      const curEle = editor.childNodes[i]
      if (curEle && curEle.nodeName !== '#text') {
        const curOuterHTML = curEle.outerHTML
        if (curOuterHTML === atNode) {
          // 当前节点是最新插入的@节点
          const preEle = editor.childNodes[i - 1]
          if (preEle && preEle.nodeName === '#text') {
            // @节点插入位置之前的文本节点就是需要替换内容的节点
            const preEleText = preEle.textContent
            const re = new RegExp(`(.*)@${atStr}`)
            preEle.textContent = preEleText.replace(re, '$1')
          }
        }
      }
    }
  }

  // 插入内容
  const insertContent = (html: string | HTMLElement, atStr?: string) => {
    let sel, range
    const curEditor = document.getElementById(editorKey)
    if (window.getSelection && curEditor) {
      sel = window.getSelection()
      if (sel && sel.rangeCount) range = sel.getRangeAt(0)
      if (!range) {
        // 如果div没有光标，则在div内容末尾插入
        range = keepCursorEnd(true)?.getRangeAt(0)
      } else {
        const contentRange = document.createRange()
        contentRange.selectNode(curEditor)
        // 对比range，检查光标是否在输入范围内
        const compareStart = range?.compareBoundaryPoints(Range.START_TO_START, contentRange)
        const compareEnd = range?.compareBoundaryPoints(Range.END_TO_END, contentRange)
        const compare = compareStart !== -1 && compareEnd !== 1
        if (!compare) range = keepCursorEnd(true)?.getRangeAt(0)
      }
      const inputRange = range as Range
      const inputSel = sel as Selection
      const input = inputRange.createContextualFragment(html)
      const lastNode = input.lastChild // 记录插入input之后的最后节点位置
      inputRange.insertNode(input)
      if (lastNode) {
        // 如果有最后的节点
        range = inputRange.cloneRange()
        range.setStartAfter(lastNode)
        range.collapse(true)
        inputSel.removeAllRanges()
        inputSel.addRange(range)
      }
      !isNil(atStr) && removeOverrageContent(curEditor, atStr, html)
    }
  }
  // 插入文件格式
  const insertFile = (img: string, file: File, isAov = false) => {
    const fileElement = document.createElement('div') as any
    // 生成随机数
    const random = Math.floor(Math.random() * 0xffffff).toString()
    fileElement.id = random
    fileElement.setAttribute(
      'style',
      'display:flex;flex-direction:column;width:72px;height:100px;align-items:center;justify-content:end;'
    )
    fileElement.innerHTML = `
          <img src=${img} style="width: 46px;height: 52px;margin-bottom:6px"/>
          <div style="font-size:12px;width:72px;color:#7795C2;word-break:keep-all;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; text-align:center">
           ${file.name}
          </div>
        `
    const appDom = document.querySelector('#app') as any
    appDom.appendChild(fileElement)
    const cacheFile = file
    domtoimage
      .toSvg(document.getElementById(random) as any, {})
      .then((dataUrl: string) => {
        const imgElement = document.createElement('img') as any
        imgElement.src = dataUrl
        imgElement.width = 72
        imgElement.height = 100
        imgElement.style.margin = '0 5px'
        imgElement.id = random
        if (isAov) {
          imgElement.setAttribute('type', 'aov')
        }
        fileImageMap.current[random] = cacheFile
        insertContent(imgElement.outerHTML)
        appDom.removeChild(fileElement)
      })
      .catch(() => {
        console.log('文件转化失败')
      })
  }
  // 判断是否是纯文本
  function isPlainText(text: string) {
    // 匹配包含html标签的正则表达式
    const htmlPattern = /<\s*[^>]*>/gi
    return !htmlPattern.test(text)
  }
  // 插入图片格式
  const insertImage = (url: string, file: File) => {
    const img = new Image()
    // 在这里插入图片
    const imgSrc = url
    const imgElement = document.createElement('img') as any
    imgElement.src = imgSrc

    const reader = new FileReader()
    reader.onload = (event: any) => {
      img.onload = () => {
        // 计算一个合适的图片展示效果
        let originWidth = img.width
        let originHeight = img.height
        const orginScale = originWidth / originHeight
        imgElement.width = null
        imgElement.height = null
        while (originWidth > 200) {
          originWidth = originWidth - 30
          originHeight = originWidth / orginScale
        }
        while (originHeight > 200) {
          originHeight = originHeight - 30
          originWidth = originHeight * orginScale
        }
        imgElement.width = originWidth
        imgElement.height = originHeight
        imgElement.style.margin = '0 5px'
        imgMap.current[imgSrc] = file
        insertContent(imgElement.outerHTML)
      }

      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }
  // 循环子节点
  const loopChildren = (children: any) => {
    // 去除span标签以及无效的文本节点
    const filterSpanChildren = Array.prototype.slice
      .call(children)
      .filter(
        (item: any) =>
          item.tagName !== 'SPAN' && Boolean(item) && !(item.nodeType === Node.TEXT_NODE && item.textContent === '')
      )
    for (let i = 0; i < filterSpanChildren.length; i++) {
      // 当前节点
      const node = filterSpanChildren[i]
      // 如果是文本节点
      if (node.nodeType === Node.TEXT_NODE) {
        // 获取文本内容
        const textContent = node.textContent
        // 如果是多个节点，且不是第一个，那么需要拼接
        if (filterSpanChildren && filterSpanChildren.length > 1 && i > 0) {
          // 如果前一个节点是a标签，这里我只有@功能是a标签，那么将这段文本和上面一段@的文本拼接,因为@内容也是需要和普通的文本一起展示的
          if (
            filterSpanChildren[i - 1].nodeType === Node.TEXT_NODE ||
            (filterSpanChildren[i - 1].nodeType === Node.ELEMENT_NODE && filterSpanChildren[i - 1].tagName === 'A')
          ) {
            inputMsgData.current[inputMsgData.current.length - 1] += ' ' + textContent
          } else {
            // 多个节点且为第一个
            inputMsgData.current.push(textContent)
          }
        } else {
          // 只有一个文本节点，直接添加
          inputMsgData.current.push(textContent)
        }
      }
      // 图片节点
      else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IMG') {
        const imgSrc = node.getAttribute('src')
        const imgId = node.getAttribute('id')
        const imgType = node.getAttribute('type')
        if (imgType === 'aov') {
          inputMsgData.current.push({
            id: imgId,
            type: 'aov'
          })
        }
        // 说明是普通文件
        else if (imgId) {
          inputMsgData.current.push({ id: imgId })
        } else {
          // 处理图片节点...
          inputMsgData.current.push({
            url: imgSrc,
            height: node.naturalHeight || node.height,
            width: node.naturalWidth || node.width
          })
        }
      }
      // 换行节点
      else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
        inputMsgData.current.push('\n')
      }
      // 如果是a标签
      else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
        if (filterSpanChildren && filterSpanChildren.length > 1 && i > 0) {
          // 如果上一个节点是@或者文本节点，那么拼上去，不需要添加了
          if (
            filterSpanChildren[i - 1].nodeType === Node.TEXT_NODE ||
            (filterSpanChildren[i - 1].nodeType === Node.ELEMENT_NODE && filterSpanChildren[i - 1].tagName === 'A')
          ) {
            inputMsgData.current[inputMsgData.current.length - 1] += ' ' + `@${node.getAttribute('nickName')}`
          } else {
            inputMsgData.current.push(`@${node.getAttribute('nickName')}`)
          }
        } else {
          inputMsgData.current.push(`@${node.getAttribute('nickName')}`)
        }
      } else if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'DIV' || node.tagName === 'P')) {
        const divContent = node.innerHTML
        // 处理div节点...
        if (isPlainText(divContent)) {
          inputMsgData.current.push('\n')
          inputMsgData.current.push(divContent)
        } else {
          loopChildren(node.childNodes)
        }
      }
    }
  }
  // 导出内容
  const exportMsgData: () => InputBoxResult = () => {
    inputMsgData.current = []

    const curEditor = document.getElementById(editorKey)
    const children = curEditor?.childNodes
    if (!children) {
      return
    }
    loopChildren(children)
    const filterData = inputMsgData.current.filter(item => {
      return item !== '\n' && Boolean(item)
    })
    const newData: ExportMsg[] = []
    filterData.forEach((item, index) => {
      if (index === 0) {
        newData.push(item)
      } else {
        if (typeof item === 'string' && typeof filterData[index - 1] === 'string') {
          newData[newData.length - 1] = newData[newData.length - 1] + '\n' + item
        } else {
          newData.push(item)
        }
      }
    })
    const msgData: InputBoxText[] = []
    const needUploadFile: InputBoxImage[] = []
    newData.forEach((item, index) => {
      if (typeof item === 'string') {
        msgData.push({
          msg: item,
          order: index,
          type: 'text'
        })
      } else {
        // 说明是图片
        if (item.url) {
          needUploadFile.push({
            type: 'img',
            file: imgMap.current[item.url],
            order: index,
            url: item.url,
            width: item.width,
            height: item.height
          })
        } else if (item.id) {
          const fileType = item.type ? 'aov' : 'file'
          needUploadFile.push({
            type: fileType,
            file: fileImageMap.current[item.id],
            order: index
          })
        }
      }
    })
    return {
      msgData,
      needUploadFile
    }
  }
  return {
    insertContent,
    insertImage,
    insertFile,
    exportMsgData
  }
}
