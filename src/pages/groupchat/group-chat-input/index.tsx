import { Resizable } from "re-resizable";
import React, {
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import {
  useGroupChatShortStore,
  useGroupChatStoreNew,
} from "@/store/group-chat-new";

import {
  MentionsInput,
  Mention as MentionComponent,
  SuggestionDataItem,
} from "react-mentions";
import WKSDK, {
  Channel,
  ChannelTypePerson,
  MessageImage,
  MessageText,
  Setting,
  Mention,
  Reply,
} from "wukongimjssdk";
import { JknIcon } from "@/components";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import i18n from "@emoji-mart/data/i18n/zh.json";
import { genBase64ToFile, genImgFileByUrl, MentionModel } from "../chat-utils";
import ReplyMessageView from "../components/reply-view";
import { useShallow } from "zustand/react/shallow";
import { useUser } from "@/store";
import { useToast } from "@/hooks";
import ChatWindow from "./chat-window";
import {
  InputBoxImage,
  InputBoxResult,
  InputBoxText,
  useInput,
} from "./useInput";
import { useClickAway } from "ahooks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

class MemberSuggestionDataItem implements SuggestionDataItem {
  id!: string | number;
  display!: string;
  icon!: string;
}

const GroupChatInput = forwardRef(
  (
    props: {
      onMsgSend: () => void;
    },
    ref
  ) => {
    const { bottomHeight, setBottomHeight, toChannel } = useGroupChatStoreNew();
    const lastBottomHeighti = useRef(185);

    const { onMsgSend } = props;
    const { user } = useUser();
    const { toast } = useToast();
    const mentionCache = useRef<any>({});
    // 文本内容
    const {
      // inputValue,
      // setInputValue,
      replyMessage,
      setReplyMessage,
      groupDetailData,
      subscribers,
      setMentions,
      mentions,
    } = useGroupChatShortStore(
      useShallow((state) => ({
        // inputValue: state.inputValue,
        // setInputValue: state.setInputValue,
        replyMessage: state.replyMessage,
        setReplyMessage: state.setReplyMessage,
        groupDetailData: state.groupDetailData,
        subscribers: state.subscribers,
        setMentions: state.setMentions,
        mentions: state.mentions,
      }))
    );

    const { insertImage } = useInput({ editorKey: "xc-chat-input" });
    const [openEmoji, setOpenEmoji] = useState(false);
    const emojiRefTrigger = useRef();

    useClickAway(() => {
      setOpenEmoji(false);
    }, emojiRefTrigger);

    const groupChatIsForbidden = useMemo(() => {
      let result = false;
      if (
        groupDetailData &&
        subscribers instanceof Array &&
        subscribers.length > 0
      ) {
        // 仅群主能发言
        const self = subscribers.find((item) => item.uid === user?.username);
        if (groupDetailData.chat_type === "2") {
          if (self?.orgData.type !== "2") {
            result = true;
          }
        } else if (groupDetailData.chat_type === "1") {
          if (self?.orgData.type == "0") {
            result = true;
          }
        }
      }
      return result;
    }, [groupDetailData, subscribers]);

    const suggestionsMember = useMemo(() => {
      let selectedItems = new Array<MemberSuggestionDataItem>();
      if (subscribers && subscribers.length > 0) {
        selectedItems = subscribers.map<MemberSuggestionDataItem>((member) => {
          const item = new MemberSuggestionDataItem();
          item.id = member.uid;
          const cahce = WKSDK.shared().channelManager.getChannelInfo(
            new Channel(member.uid, ChannelTypePerson)
          );
          if (cahce) {
            item.icon = cahce?.logo;
          }
          item.display = member.name;
          return item;
        });
        selectedItems.splice(0, 0, {
          icon: "all",
          id: -1,
          display: "所有人",
        });
      }
      return selectedItems;
    }, [subscribers]);

    // 最终的发送方法
    const finalSend = (content: any, index: number) => {
      const setting = Setting.fromUint8(0);
      if (index === 0 && content) {
        if (mentions.length > 0) {
          const mn = new Mention();
          mn.all = false;
          mn.uids = mentions.map((item) => item.uid);
          content.mention = mn;
        }

        if (replyMessage) {
          const reply = new Reply();
          reply.messageID = replyMessage.messageID;
          reply.messageSeq = replyMessage.messageSeq;
          reply.fromUID = replyMessage.fromUID;
          const channelInfo = WKSDK.shared().channelManager.getChannelInfo(
            new Channel(replyMessage.fromUID, ChannelTypePerson)
          );
          if (channelInfo) {
            reply.fromName = channelInfo.title;
          }
          reply.content = replyMessage.content;
          content.reply = reply;
          setReplyMessage(null);
        }
      }

      if (toChannel && content) {
        WKSDK.shared().chatManager.send(content, toChannel, setting);
        console.log(content, "send content");
        // setInputValue("");
        mentionCache.current = {};
        if (typeof onMsgSend === "function") {
          onMsgSend();
        }
      }
    };

    const sendOneMsg = (type: string, data: any, index: number) => {
      let content: MessageImage | MessageText;
      if (type === "text") {
        const temp = data as InputBoxText;

        let value = temp.msg;
        if (value?.trim() === "") {
          return;
        }

        let formatValue = formatMentionText(value);

        content = new MessageText(formatValue);

        finalSend(content, index);
      } else if (type === "img") {
        // const

        const temp = data as InputBoxImage;
        content = new MessageImage();
        if (temp.url) {
          // 上传文件进来
          if (temp.url.indexOf("data:image/png;base64") >= 0) {
            const blob = genBase64ToFile(temp.url);

            let file = new File([blob], "image.png", {
              type: "image/png",
            });
            content.width = temp.width || 60; // 图片宽度
            content.height = temp.height || 60; // 图片高度
            content.file = file;
            finalSend(content, index);
          } else {
            genImgFileByUrl(temp.url)
              .then((res) => {
                const blob = genBase64ToFile(res);
                let file = new File([blob], "image.png", {
                  type: "image/png",
                });
                content.width = temp.width || 60; // 图片宽度
                content.height = temp.height || 60; // 图片高度
                content.file = file;
                finalSend(content, index);
              })
              .catch(() => {
                // 复制自己前面的阿里云的就发不出去，跨域了，
                content.width = temp.width || 60; // 图片宽度
                content.height = temp.height || 60; // 图片高度
                content.remoteUrl = temp.url;
                finalSend(content, index);
              });
          }
        }
      }

      // 清空AT的人
    };

    const handleSend = (data: InputBoxResult) => {
      // let value = inputValue;
      if (!data) {
        return;
      }
      let msgQueue: Array<InputBoxText | InputBoxImage> = [];
      if (data.msgData && data.msgData.length > 0) {
        data.msgData.forEach((text) => {
          msgQueue.push(text);
        });
      }

      if (data.needUploadFile && data.needUploadFile.length > 0) {
        data.needUploadFile.forEach((file) => {
          msgQueue.push(file);
        });
      }

      // msgQueue.sort((a, b) => a.order - b.order);

      msgQueue.forEach((msg, index) => {
        sendOneMsg(msg.type, msg, index);
      });

      setMentions([]);
    };
    const onFileClick = (event: any) => {
      event.target.value = ""; // 防止选中一个文件取消后不能再选中同一个文件
    };
    const imgUploadRef = useRef<HTMLInputElement>();
    const onFileChange = () => {
      if (imgUploadRef.current) {
        let File = (imgUploadRef.current.files || [])[0];
        dealFile(File);
      }
    };

    const chooseFile = () => {
      if (groupChatIsForbidden === true) {
        toast({ description: "群组禁言中，无法操作" });
        return;
      }
      imgUploadRef.current && imgUploadRef.current.click();
    };

    const dealFile = (file: any) => {
      if (file.type && file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        insertImage(url, file);
      }
    };

    // 解析@
    const parseMention = (text: string) => {
      let mention: MentionModel = new MentionModel();
      if (mentionCache.current) {
        let mentions = Object.values(mentionCache.current);
        let all = false;
        if (mentions.length > 0) {
          let mentionUIDS = new Array();
          let mentionMatchResult = text.match(/@([^ ]+) /g);
          if (mentionMatchResult && mentionMatchResult.length > 0) {
            for (let i = 0; i < mentionMatchResult.length; i++) {
              let mentionStr = mentionMatchResult[i];
              let name = mentionStr.trim().replace("@", "");
              let member = mentionCache.current[name];
              if (member) {
                if (member.uid === -1) {
                  // -1表示@所有人
                  all = true;
                } else {
                  mentionUIDS.push(member.uid);
                }
              }
            }
          }
          if (all) {
            mention.all = true;
          } else {
            mention.uids = mentionUIDS;
          }
        }
        return mention;
      }
      return undefined;
    };

    const formatMentionText = (text: string) => {
      let newText = text;
      let mentionMatchResult = newText.match(/@([^ ]+) /g);
      if (mentionMatchResult && mentionMatchResult.length > 0) {
        for (let i = 0; i < mentionMatchResult.length; i++) {
          let mentionStr = mentionMatchResult[i];
          let name = mentionStr.replace("@[", "@").replace("]", "");
          newText = newText.replace(mentionStr, name);
        }
      }
      return newText;
    };

    // 聊天列表里点击右键回复时，这样添加
    const addMention = (uid: string, name: string) => {
      if (name) {
        mentionCache.current[`${name}`] = { uid: uid, name: name };
        // insertText(`@[${name}] `);
      }
    };

    useImperativeHandle(ref, () => {
      return {
        addMention,
      };
    });

    const inputRef = useRef<any>();

    return (
      <Resizable
        defaultSize={{ height: bottomHeight + "px" }}
        onResize={(e, direction, ref, delta) => {
          const res = delta.height + lastBottomHeighti.current;

          setBottomHeight(res);
        }}
        onResizeStop={() => {
          lastBottomHeighti.current = bottomHeight;
        }}
        enable={{
          top: true,
        }}
        maxHeight={400}
      >
        <div
          style={{ height: bottomHeight + "px" }}
          className="chat-msg-inputer relative"
        >
          {(replyMessage || (mentions && mentions.length > 0)) && (
            <ReplyMessageView
              message={replyMessage || undefined}
              onClose={() => {
                setMentions([]);
                setReplyMessage(null);
              }}
            ></ReplyMessageView>
          )}
          <div className="h-[40px] flex items-center">
            {groupChatIsForbidden === true ? (
              <span>
                <JknIcon
                  name="smile"
                  onClick={() => {
                    toast({ description: "群组禁言中，无法操作" });
                  }}
                  className="ml-2"
                />
              </span>
            ) : (
              <Popover open={openEmoji}>
                <PopoverTrigger asChild>
                  <span
                    ref={emojiRefTrigger}
                    onClick={() => {
                      setOpenEmoji(!openEmoji);
                    }}
                  >
                    <JknIcon
                      name="smile"
                      // onClick={setTrue}
                      className="ml-2"
                    />
                  </span>
                </PopoverTrigger>
                <PopoverContent side="bottom" className="w-[355px]">
                  <Picker
                    theme="dark"
                    previewPosition="none"
                    searchPosition="none"
                    data={data}
                    i18n={i18n}
                    onEmojiSelect={(emoji, event) => {
                      event.stopPropagation();
                      // const prevVal = inputValue;
                      if (inputRef.current) {
                        inputRef.current.addEmoji(emoji.native);
                      }

                      setOpenEmoji(false);
                      // setInputValue(msg);
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}

            <span onClick={chooseFile}>
              <input
                onClick={onFileClick}
                onChange={onFileChange}
                type="file"
                multiple={false}
                accept="image/*"
                ref={imgUploadRef}
                style={{ display: "none" }}
              />
              <JknIcon name="pick_image" className="ml-2 rounded-none" />
            </span>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <JknIcon name="screenshot" className="ml-2 rounded-none" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  windows 截图快捷键： PrScrn
                  <br/>
                  macos截图快捷键： Shift、Command 和 4
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div
            style={{
              height: "calc(100% - 40px)",
            }}
          >
            {groupChatIsForbidden === true ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                群组禁言中
              </div>
            ) : (
              // -----------
              <ChatWindow handleSend={handleSend} ref={inputRef} />

              // ---------
              // <textarea
              //   ref={inputRef}
              //   value={inputValue}
              //   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              //     setInputValue(e.target.value);
              //   }}
              //   placeholder={`按 Ctrl + Enter 换行，按 Enter 发送`}
              //   className="w-full text-white h-full bg-transparent resize-none border-0 outline-none"
              //   onKeyDown={(e) => {
              //     if (e.keyCode !== 13) {
              //       //非回车
              //       return;
              //     }
              //     if (e.keyCode === 13 && e.ctrlKey) {
              //       // ctrl+Enter不处理
              //       if (inputRef.current) {
              //         const position = inputRef.current.selectionStart;
              //         const newValue =
              //           inputValue.substring(0, position) +
              //           "\n" +
              //           inputValue.substring(position);
              //         setInputValue(newValue);
              //       }
              //       return;
              //     }
              //     e.preventDefault();
              //     handleSend();
              //   }}
              // ></textarea>

              // --------------
              // <MentionsInput
              //   placeholder={`按 Ctrl + Enter 换行，按 Enter 发送`}
              //   className="messageinput-input"
              //   allowSuggestionsAboveCursor={true}
              //   value={inputValue}
              //   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              //     setInputValue(e.target.value);
              //   }}
              //   ref={inputRef}
              //   onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              //     if (e.charCode !== 13) {
              //       //非回车
              //       return;
              //     }
              //     if (e.charCode === 13 && e.ctrlKey) {
              //       // ctrl+Enter不处理
              //       if (inputRef.current) {
              //         const position =
              //           inputRef.current.inputElement.selectionStart;
              //         const newValue =
              //           inputValue.substring(0, position) +
              //           "\n" +
              //           inputValue.substring(position);
              //         setInputValue(newValue);
              //       }
              //       return;
              //     }
              //     e.preventDefault();
              //     handleSend();
              //   }}
              // >
              //   <MentionComponent
              //     trigger={new RegExp(`(@([^'\\s'@]*))$`)}
              //     markup="@[__display__]"
              //     data={suggestionsMember}
              //     displayTransform={(id: string, display: string) =>
              //       `@${display}`
              //     }
              //     appendSpaceOnAdd={true}
              //     onAdd={(id: string, display: string) => {
              //       mentionCache.current[display] = { uid: id, name: display };
              //     }}
              //     renderSuggestion={(
              //       suggestion,
              //       search,
              //       highlightedDisplay,
              //       index,
              //       focused
              //     ) => {
              //       const item = suggestion as MemberSuggestionDataItem;
              //       return (
              //         <div
              //           className={cn(
              //             "messageinput-member flex items-center",
              //             focused ? "messageinput-selected" : null
              //           )}
              //         >
              //           <div className="messageinput-iconbox">
              //             <ChatAvatar
              //               size="sm"
              //               data={{
              //                 uid: String(item.id),
              //                 avatar: item.icon,
              //                 name: item.display,
              //               }}
              //             ></ChatAvatar>
              //           </div>
              //           <div className="ml-2">
              //             <strong>{highlightedDisplay}</strong>
              //           </div>
              //         </div>
              //       );
              //     }}
              //   ></MentionComponent>
              // </MentionsInput>
            )}
          </div>
        </div>
        <style jsx>
          {`
            .chat-msg-inputer {
              border-top: 1px solid rgb(50, 50, 50);
            }
            .fake-border {
              height: 1px;
              background-color: rgb(50, 50, 50);
            }
            .fake-border:hover {
              height: 3px;
              background-color: rgb(84, 88, 168);
            }
            .messageinput-member {
              height: 48px;
              padding: 0 12px;
              color: #fff;
              min-width: 220px;
            }
            .messageinput-member:hover {
              background-color: rgb(57, 116, 197);
            }
            .messageinput-member.messageinput-selected {
              background-color: rgb(57, 116, 197);
            }
          `}
        </style>
        <style>
          {`
            .messageinput-input {
                height: 100%;
                width: 100%;
                border: none;
                color: #333;
                font-size: 14px;
                overflow-y: scroll;
                display: inline-block;
                -webkit-user-modify: read-write-plaintext-only;
                outline: none;
            }
            .messageinput-input__control {
                background-color: rgb(43,45,49);
                   height: 100%;
            }

            .messageinput-input textarea {
              color: #fff;
              outline: none;
              border: none;
            }
           
            .messageinput-input__suggestions {
                background-color: rgb(55,57,63) !important;
                max-height: 200px;
                overflow-y: auto;
                border-radius: 5px;
            }
        `}
        </style>
      </Resizable>
    );
  }
);

export default GroupChatInput;
