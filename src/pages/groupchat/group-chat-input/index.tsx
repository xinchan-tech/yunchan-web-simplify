import { Resizable } from "re-resizable";
import React, {
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
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
  Subscriber,
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
import { cn } from "@/utils/style";
import ChatAvatar from "../components/chat-avatar";
import { MentionModel } from "../chat-utils";
import ReplyMessageView from "../components/reply-view";

class MemberSuggestionDataItem implements SuggestionDataItem {
  id!: string | number;
  display!: string;
  icon!: string;
}

const GroupChatInput = forwardRef(
  (
    props: {
      onMsgSend: () => void;
      subscribers: Subscriber[];
    },
    ref
  ) => {
    const { bottomHeight, setBottomHeight, toChannel } = useGroupChatStoreNew();
    const lastBottomHeighti = useRef(185);

    const { onMsgSend, subscribers } = props;
    const mentionCache = useRef<any>({});
    // 文本内容
    const { inputValue, setInputValue , replyMessage , setReplyMessage} = useGroupChatShortStore();

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

    const handleSend = () => {
      let value = inputValue;
      if (value?.trim() === "") {
        return;
      }

      let formatValue = formatMentionText(value);
      let mention = parseMention(formatValue);

      const setting = Setting.fromUint8(0);
      const content = new MessageText(formatValue);

      if (mention) {
        const mn = new Mention();
        mn.all = mention.all;
        mn.uids = mention.uids;
        content.mention = mn;
      }

      if (replyMessage) {
        const reply = new Reply()
        reply.messageID =replyMessage.messageID
        reply.messageSeq = replyMessage.messageSeq
        reply.fromUID = replyMessage.fromUID
        const channelInfo = WKSDK.shared().channelManager.getChannelInfo(new Channel(replyMessage.fromUID, ChannelTypePerson))
        if (channelInfo) {
            reply.fromName = channelInfo.title
        }
        reply.content =replyMessage.content
        content.reply = reply
        setReplyMessage(null)
    }

      if (toChannel) {
        WKSDK.shared().chatManager.send(content, toChannel, setting);
        console.log(content, "send content");
        setInputValue("");
        mentionCache.current = {};
        if (typeof onMsgSend === "function") {
          onMsgSend();
        }
      }
    };
    const onFileClick = (event: any) => {
      event.target.value = ""; // 防止选中一个文件取消后不能再选中同一个文件
    };
    const onFileChange = () => {
      if (imgUploadRef.current) {
        let File = (imgUploadRef.current.files || [])[0];
        dealFile(File);
      }
    };
    const imgUploadRef = useRef<HTMLInputElement>();
    const chooseFile = () => {
      imgUploadRef.current && imgUploadRef.current.click();
    };

    const previewUrl = useRef<any>("");

    const dealFile = (file: any) => {
      if (file.type && file.type.startsWith("image/")) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function (e: any) {
          file.current = file;
          previewUrl.current = reader.result;
          const msgContent = new MessageImage();
          const img = new Image();
          img.src = previewUrl.current;

          img.onload = () => {
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;
            msgContent.url = previewUrl.current; // 图片的下载地址
            msgContent.width = width; // 图片宽度
            msgContent.height = height; // 图片高度
            if (toChannel) {
              WKSDK.shared().chatManager.send(msgContent, toChannel);

              if (typeof onMsgSend === "function") {
                onMsgSend();
              }
            }
          };

          msgContent.file = file;
        };
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

    const insertText = (text: string) => {
      let newText = inputValue + text;
      setInputValue(newText);
    };
    // 聊天列表里点击右键回复时，这样添加
    const addMention = (uid: string, name: string) => {
      if (name) {
        mentionCache.current[`${name}`] = { uid: uid, name: name };
        insertText(`@[${name}] `);
      }
    };

    useImperativeHandle(ref, () => {
      return {
        addMention,
      };
    });

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
          {
            replyMessage && <ReplyMessageView message={replyMessage} onClose={() => {}}></ReplyMessageView>
          }
          <div className="h-[40px] flex items-center">
            <Popover>
              <PopoverTrigger asChild>
                <span>
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
                  onEmojiSelect={(emoji, event) => {
                    event.stopPropagation();
                    const prevVal = inputValue;
                    const msg = `${prevVal}${emoji.native}`;

                    setInputValue(msg);
                  }}
                />
              </PopoverContent>
            </Popover>
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
              <JknIcon name="pick_image" className="ml-2" />
            </span>
          </div>
          <div
            style={{
              height: "calc(100% - 40px)",
            }}
          >
            {/* <Textarea
            style={{
              boxSizing: 'border-box',
              width: '90%'
            }}
            ref={messageRef}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
          /> */}
            <MentionsInput
              placeholder={`按 Ctrl + Enter 换行，按 Enter 发送`}
              className="messageinput-input"
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setInputValue(e.target.value);
              }}
              onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.charCode !== 13) {
                  //非回车
                  return;
                }
                if (e.charCode === 13 && e.ctrlKey) {
                  // ctrl+Enter不处理
                  return;
                }
                e.preventDefault();
                handleSend();
              }}
            >
              <MentionComponent
                trigger={new RegExp(`(@([^'\\s'@]*))$`)}
                markup="@[__display__]"
                data={suggestionsMember}
                displayTransform={(id: string, display: string) =>
                  `@${display}`
                }
                appendSpaceOnAdd={true}
                onAdd={(id: string, display: string) => {
                  mentionCache.current[display] = { uid: id, name: display };
                }}
                renderSuggestion={(
                  suggestion,
                  search,
                  highlightedDisplay,
                  index,
                  focused
                ) => {
                  const item = suggestion as MemberSuggestionDataItem;
                  return (
                    <div
                      className={cn(
                        "messageinput-member flex items-center",
                        focused ? "messageinput-selected" : null
                      )}
                    >
                      <div className="messageinput-iconbox">
                        <ChatAvatar
                          size="sm"
                          data={{
                            uid: String(item.id),
                            avatar: item.icon,
                            name: item.display,
                          }}
                        ></ChatAvatar>
                      </div>
                      <div className="ml-2">
                        <strong>{highlightedDisplay}</strong>
                      </div>
                    </div>
                  );
                }}
              ></MentionComponent>
            </MentionsInput>
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
