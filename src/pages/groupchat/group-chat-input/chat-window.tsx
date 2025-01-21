import {
  ClipboardEvent,
  DragEvent,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { InputBoxResult, useInput } from "./useInput";
import { useToast } from "@/hooks";

const ChatWindow = forwardRef(
  (
    props: {
      handleSend: (msgListData: InputBoxResult) => void;
    },
    ref
  ) => {
    const [htmlValue, setHtmlValue] = useState("");
    const { insertImage, exportMsgData, insertContent } = useInput({
      editorKey: "xc-chat-input",
    });
    const {toast} = useToast()
    useImperativeHandle(ref, () => {
      return {
        addEmoji: (emoji: string) => {
          const tgt = document.getElementById("xc-chat-input");
          if (tgt) {
            setHtmlValue(tgt.innerHTML + emoji);
          }
        },
        insertImage
      };
    });

    // 插入文件
    const insertFile = (file: File) => {
  
      const URL = window.URL || window.webkitURL;
      const url = URL.createObjectURL(file);
      if (file.type.includes("image")) {
        const sizeAllow = file.size / 1024 / 1024 <= 5;
        if (!sizeAllow) {
          toast({ description: '图片限制最大5M'})
          return;
        }
        insertImage(url, file);
      } else {
        toast({ description: '暂不支持发送此类文件'})
      }
     
    };

    // 处理图片和文件在input框中的显示逻辑
    const handleFileAndImageInsert = (item: any) => {
      const file = item.getAsFile();
     
      insertFile(file);
    };

    const pasteItem = (e: ClipboardEvent<HTMLDivElement>) => {
      if (!(e.clipboardData && e.clipboardData.items)) {
        return;
      }
      return new Promise((resolve, reject) => {
        for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
          const item = e.clipboardData.items[i];
          if (item.kind === "string") {
            const type = item.type;
            item.getAsString((str: string) => {
              resolve({
                type,
                text: str,
              });
            });
          } else if (item.kind === "file") {
            handleFileAndImageInsert(item);
          } else {
            reject(new Error("不允许复制这种类型!"));
          }
        }
      });
    };

    const handlePaste = async (e: ClipboardEvent<HTMLDivElement>) => {
      const data = e.clipboardData.getData("Text");
      if (data) {
        document.execCommand("insertText", false, data);
        e.preventDefault();
      } else {
        for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
          const item = e.clipboardData.items[i];
          if (item.kind === "file") {
            handleFileAndImageInsert(item);
            e.preventDefault();
          }
        }
      }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const copyItems = e.dataTransfer.items;
      for (let i = 0; i < copyItems.length; i++) {
        // 字符串
        if (copyItems[i].kind === "string") {
          if (e.dataTransfer.effectAllowed === "copy") {
            copyItems[i].getAsString((str: string) => {
              insertContent(str);
            });
          }
        }
        // 文件
        if (copyItems[i].kind === "file") {
          handleFileAndImageInsert(copyItems[i]);
        }
      }
    };

    const dealSend = () => {
      const tgt = document.getElementById("xc-chat-input");
      if (tgt) {
        const msgListData = exportMsgData();
        console.log(exportMsgData(), "exportMsgData");

        typeof props.handleSend === "function" && props.handleSend(msgListData);
        tgt.innerHTML = "";
        setHtmlValue("");
      }
    };
    return (
      <>
        <div
          id="xc-chat-input"
          data-placeholder='按 Ctrl + Enter 换行，按 Enter 发送'
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.keyCode !== 13) {
              //非回车
              return;
            }
            if (e.keyCode === 13 && e.ctrlKey) {
              // ctrl+Enter不处理

              document.execCommand("insertText", false, "\n");

              return;
            }

            e.preventDefault();
            dealSend();
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={handleDrop}
          className="h-full w-full chat-window"
          dangerouslySetInnerHTML={{ __html: htmlValue }}
          contentEditable
          onPaste={handlePaste}
          onChange={(e) => {
            const tgt = document.getElementById("xc-chat-input");
            if (tgt) {
              setHtmlValue(tgt.innerHTML);
            }
          }}
        ></div>
        <style jsx>
          {`
            .chat-window {
              padding: 6px 10px;
              overflow-y: auto;
              img {
                max-width: 200px !important;
                max-height: 200px !important;
              }
            }
            .chat-window:empty:before {
              content: attr(data-placeholder);
              color: #bbb;
            }
            .chat-window:focus:before {
              content: none;
            }
          `}
        </style>
      </>
    );
  }
);

export default ChatWindow;
