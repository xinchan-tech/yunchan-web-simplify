import {
  getLiveOpnions,
  opinionItem,
  opinionsRequestParam,
  sendLiveOpinions,
  sendOpinionRequestPrams,
} from "@/api";
import FullScreenLoading from "@/components/loading";
import { useThrottleFn } from "ahooks";
import { useEffect, useRef, useState } from "react";
import { animateScroll, scroller } from "react-scroll";
import { useUser } from "@/store";
import { Button, Input, JknIcon } from "@/components";
import { useToast } from "@/hooks";
import ChatWindow from "../group-chat-input/chat-window";
import UploadUtil from "../Service/uploadUtil";
import { InputBoxImage, InputBoxResult } from "../group-chat-input/useInput";
import { uid } from "radash";
import { wsManager } from "@/utils/ws";

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);

  // 配置纽约时区
  const options = {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long",
  };

  // 提取中文格式的日期部件
  const [month, day, weekday, hh, mm] = new Intl.DateTimeFormat(
    "zh-CN",
    options
  )
    .formatToParts(date)
    .reduce((acc, part) => {
      switch (part.type) {
        case "month":
          acc[0] = part.value;
          break;
        case "day":
          acc[1] = part.value;
          break;
        case "weekday":
          acc[2] = part.value;
          break;
        case "hour":
          acc[3] = part.value.padStart(2, "0");
          break;
        case "minute":
          acc[4] = part.value.padStart(2, "0");
          break;
      }
      return acc;
    }, []);

  return `${month}-${day} ${weekday} ${hh}:${mm}`;
}

const OPINION_ID_PREFIX = "opinion-";
const TextImgLive = () => {
  const [opinions, setOpinions] = useState<opinionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const jumpOpioionId = useRef<string | null>(null);
  const pulldowning = useRef(false);
  const pulldownFinished = useRef(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const [keyWord, setKeyWord] = useState("");

  const pageNumber = useRef(1);
  const pullBeforeData = () => {
    if (pulldowning.current || pulldownFinished.current) {
      return;
    }

    const params = generateParams();
    params.page = String(pageNumber.current + 1);
    if (keyWord) {
      params.keyword = keyWord;
    }
    fetchOpinions(params, { pullBeforeMode: true }).then(() => {
      pageNumber.current++;
    });
  };
  const generateParams = () => {
    let params: opinionsRequestParam = {
      type: "1",
      page: String(pageNumber.current),
      limit: "15",
    };

    // todo 一些角色判断，是不是老师

    return params;
  };

  const pullLatest = async () => {
    let params: opinionsRequestParam = {
      type: "1",
      page: "1",
      limit: "15",
    };
    try {
      const res = await getLiveOpnions(params);
      if (res.items.length > 0) {
        // 去重，只把老数据里不包含的opinion加进去
        const newPart = res.items
          .filter((item) => {
            return (
              opinions.findIndex((old) => {
                return item.id === old.id;
              }) < 0
            );
          })
          .reverse();

        const newOpinions = newPart.concat(opinions);
        jumpOpioionId.current = "";

        setOpinions(newOpinions);
      }
    } catch (err) {}
  };

  const fetchOpinions = async (
    params: opinionsRequestParam,
    options?: {
      pullBeforeMode?: boolean;
      reset?: boolean;
    }
  ) => {
    setLoading(true);
    pulldowning.current = true;
    try {
      const res = await getLiveOpnions(params);
      pulldowning.current = false;
      setLoading(false);
      if (res.items.length > 0) {
        const newPart = res.items.reverse();

        if (options?.reset === true) {
          jumpOpioionId.current = null;
          pageNumber.current = 1;
          setOpinions(newPart);
        } else {
          const newOpinions = newPart.concat(opinions);
          if (options?.pullBeforeMode === true) {
            jumpOpioionId.current = OPINION_ID_PREFIX + opinions[0].id;
          }

          setOpinions(newOpinions);
        }
      }
      if (res.last === pageNumber.current - 1 || res.last === 1) {
        pulldownFinished.current = true;
      }
    } catch (error) {
      setLoading(false);
      pulldowning.current = false;
    }
  };

  useEffect(() => {
    const initParams = generateParams();
    // const close = wsManager.on("opinions", (data) => {
    //   console.log(data);
    //   pullLatest();
    // });
    fetchOpinions(initParams, { reset: true }).finally(() => {
      pulldowning.current = false;
    });
    // return close;
    const channel = new BroadcastChannel("chat-channel");
    channel.onmessage = (event) => {
      if (event.data.type === "opinions") {
        pullLatest();
      }
    };
  }, []);

  // 消息列表滚动到底部
  const scrollBottom = () => {
    animateScroll.scrollToBottom({
      containerId: "scroll-content-opinion",
      duration: 0,
    });
  };

  const scrollDomRef = useRef<HTMLDivElement>(null);
  const handleScroll = useThrottleFn(
    (e: any) => {
      const targetScrollTop = e?.target?.scrollTop;
      if (targetScrollTop <= 30) {
        // 下拉
        pullBeforeData();
      }
    },
    { wait: 200 }
  );

  useEffect(() => {
    if (opinions instanceof Array && opinions.length > 0) {
      if (jumpOpioionId.current) {
        const targetID = jumpOpioionId.current;
        const target = document.getElementById(targetID);
        if (target) {
          scroller.scrollTo(targetID, {
            containerId: "scroll-content-opinion",
            duration: 0,
          });
          jumpOpioionId.current = null;
        }
      } else {
        scrollBottom();
      }
    }
  }, [opinions]);
  const imgUploadRef = useRef<HTMLInputElement>();
  const onFileClick = (event: any) => {
    event.target.value = ""; // 防止选中一个文件取消后不能再选中同一个文件
  };

  const onFileChange = () => {
    if (imgUploadRef.current) {
      let File = (imgUploadRef.current.files || [])[0];
      dealFile(File);
    }
  };
  const inputRef = useRef<any>();

  const handleSend = (data: InputBoxResult) => {
    if (!data) {
      return;
    }
    let content = "";
    let UploadQueue: Array<InputBoxImage> = [];
    if (data.msgData && data.msgData.length > 0) {
      data.msgData.forEach((text) => {
        content += text.msg;
      });
    }

    if (data.needUploadFile && data.needUploadFile.length > 0) {
      data.needUploadFile.forEach((file) => {
        UploadQueue.push(file);
      });
    }

    const promises = [];

    UploadQueue.forEach((data) => {
      promises.push(uploadImg(data));
    });

    if (promises.length > 0) {
      setSending(true);
      Promise.all(promises)
        .then((result) => {
          console.log(result);
          const sendParams: sendOpinionRequestPrams = {
            content,
            type: 1,
            urls: [],
          };
          if (result instanceof Array && result.length > 0) {
            result.forEach((item: { url: string }) => {
              sendParams.urls && sendParams.urls.push(item.url);
            });
          }
          return sendLiveOpinions(sendParams);
        })
        .then((res) => {})
        .finally(() => {
          setSending(false);
        });
    } else {
      setSending(true);
      const sendParams: sendOpinionRequestPrams = {
        content,
        type: 1,
        urls: [],
      };
      sendLiveOpinions(sendParams).finally(() => {
        setSending(false);
      });
    }
  };

  const uploadImg = (data: InputBoxImage) => {
    if (data) {
      let fileName = uid(32);
      if (data.file.type) {
        const fileType = data.file.type.split("/")[1];
        fileName = `${fileName}.${fileType}`;
      }
      return UploadUtil.shared.uploadImg(data.file, fileName);
    }
  };

  const dealFile = (file: any) => {
    if (file.type && file.type.startsWith("image/")) {
      const sizeAllow = file.size / 1024 / 1024 <= 5;
      if (!sizeAllow) {
        toast({ description: "图片限制最大5M" });
        return;
      }

      const url = URL.createObjectURL(file);
      if (inputRef.current) {
        inputRef.current.insertImage(url, file);
      }
    } else {
      toast({ description: "暂不支持发送此类文件" });
    }
  };

  return (
    <div className="text-img-live-box">
      {loading && <FullScreenLoading fullScreen={false} />}
      {user?.user_type === "2" && (
        <div className="pl-20 pr-20 mb-2">
          <Input
            className={"h-[24px] placeholder:text-tertiary"}
            placeholder="搜索记录"
            size="sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const params = generateParams();
                params.keyword = e.currentTarget.value;
                setKeyWord(e.currentTarget.value);
                fetchOpinions(params, { reset: true });
              }
            }}
          />
        </div>
      )}
      <div
        ref={scrollDomRef}
        style={{
          height: user?.user_type === "2" ? "calc(100% - 210px)" : "100%",
        }}
        className="scroll-content-opinion"
        onScroll={handleScroll.run}
        id="scroll-content-opinion"
      >
        {opinions.map((item) => {
          return (
            <div
              key={item.id}
              className="opinion-item mb-10"
              id={OPINION_ID_PREFIX + item.id}
            >
              <div className="avatar-info flex items-center mb-3">
                <div className="avatar-img mr-2">评</div>
                <div className="mr-2 teacher-name">{item.user.username}</div>
                <div className="opinion-time text-sm text-gray-600">
                  美东时间
                  {formatTimestamp(Number(item.create_time) * 1000)}
                </div>
              </div>
              <div className="opinion-content ml-10">
                {item.content}

                {item.urls instanceof Array && item.urls.length > 0 && (
                  <div className="flex mt-2">
                    {item.urls.map((url, index) => {
                      return (
                        <img
                          className="mr-3 max-w-[160px] max-h-[160px]"
                          src={url}
                          key={url + index}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {user?.user_type === "2" && (
        <div className="h-[180px] topgap">
          <div className="flex h-[32px] items-center ">
            <span
              onClick={() => {
                imgUploadRef.current && imgUploadRef.current.click();
              }}
            >
              <input
                onClick={onFileClick}
                onChange={onFileChange}
                type="file"
                multiple={false}
                accept="image/*"
                ref={imgUploadRef}
                style={{ display: "none" }}
              />
              <JknIcon name="pick_image" className="rounded-none" />
            </span>
          </div>

          <div className="flex">
            <div className="inputer">
              {/* <textarea
                value={opinionText}
                onChange={(e) => {
                  setOpinionText(e.target.value);
                }}
                placeholder="输入文字或拖入图片"
              ></textarea> */}
              <ChatWindow
                style={{
                  resize: "none",
                  width: "100%",
                  height: "100px",
                  backgroundColor: "rgb(20, 21, 25)",
                  boxSizing: "border-box",
                  padding: "10px",
                  color: "#fff",
                }}
                ref={inputRef}
                handleSend={handleSend}
              />
            </div>
            <Button
              className="big-button w-[80px] h-[100px] flex items-center justify-center"
              loading={sending}
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.dealSend();
                }
              }}
            >
              发送
            </Button>
          </div>
        </div>
      )}
      <style jsx>{`
         {
          .topgap {
            border-top: 1px solid #333;
          }
          .scroll-content-opinion {
            overflow-y: auto;
            padding: 0 12px;
            height: 100%;
            overflow-y: auto;

            ::-webkit-scrollbar {
              display: block;
              width: 6px;
            }

            ::-webkit-scrollbar-thumb {
              background-color: rgb(88, 88, 88);
            }
            scrollbar-thumb {
              background-color: rgb(88, 88, 88);
            }
          }
          .avatar-info {
            .teacher-name {
              color: rgb(250, 0, 128);
              font-size: 18px;
            }
          }
          .text-img-live-box {
            height: 100%;
            padding: 10px 20px;
            box-sizing: border-box;
            flex: 1;
            position: relative;
            background-color: rgb(38, 40, 43);
          }
          .opinion-item {
            .avatar-img {
              width: 32px;
              height: 32px;
              border-radius: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: rgb(0, 194, 82);
              font-weight: bold;
              font-size: 16px;
              font-style: italic;
            }
            .opinion-content {
              position: relative;
              color: #222;
              padding: 12px;
              background-color: rgb(0, 180, 76);
              white-space: pre-wrap;
              display: inline-block;
              border-radius: 4px;
            }
            .opinion-content::before {
              content: "";
              width: 12px;
              height: 12px;
              transform: rotate(45deg);
              background-color: rgb(0, 180, 76);
              position: absolute;
              top: 10px;
              left: -6px;
              display: inline-block;
            }
          }
          .inputer {
            flex: 1;
            margin-right: 20px;
          }
          .big-button {
            background-color: rgb(56, 97, 246);
            border-radius: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default TextImgLive;
