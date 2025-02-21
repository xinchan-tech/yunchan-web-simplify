import {
  getLiveOpnions,
  type opinionItem,
  type opinionsRequestParam,
  sendLiveOpinions,
  type sendOpinionRequestPrams
} from '@/api'

import { useEffect, useRef, useState } from 'react'

import { useUser } from '@/store'
import { Button, Input, JknIcon } from '@/components'
import { useToast } from '@/hooks'
import ChatWindow from '../group-chat-input/chat-window'
import UploadUtil from '../Service/uploadUtil'
import type { InputBoxImage, InputBoxResult } from '../group-chat-input/useInput'
import { uid } from 'radash'
import Viewer from 'react-viewer'
import { HighlightDollarWords } from '../Messages/text'
import MsgScrollLoader from '../components/msg-scroll-loader'

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp)

  // 配置纽约时区
  const options = {
    timeZone: 'America/New_York',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'long'
  }

  // 提取中文格式的日期部件
  const [month, day, weekday, hh, mm] = new Intl.DateTimeFormat('zh-CN', options)
    .formatToParts(date)
    .reduce((acc, part) => {
      switch (part.type) {
        case 'month':
          acc[0] = part.value
          break
        case 'day':
          acc[1] = part.value
          break
        case 'weekday':
          acc[2] = part.value
          break
        case 'hour':
          acc[3] = part.value.padStart(2, '0')
          break
        case 'minute':
          acc[4] = part.value.padStart(2, '0')
          break
      }
      return acc
    }, [])

  return `${month}-${day} ${weekday} ${hh}:${mm}`
}

const TextImgLive = () => {
  const { user } = useUser()

  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const pageNumber = useRef(1)
  const [fetchParams, setFetchParams] = useState<opinionsRequestParam>({})

  const generateParams = () => {
    let params: opinionsRequestParam = {
      type: '1',
      page: String(pageNumber.current),
      limit: '15'
    }

    // todo 一些角色判断，是不是老师

    return params
  }

  useEffect(() => {
    const initParams = generateParams()

    const channel = new BroadcastChannel('chat-channel')
    channel.onmessage = event => {
      if (event.data.type === 'opinions') {
        setFetchParams({ ...fetchParams })
      }
    }
    setFetchParams(initParams)
    return () => {
      channel.close()
    }
  }, [])

  const imgUploadRef = useRef<HTMLInputElement>()
  const onFileClick = (event: any) => {
    event.target.value = '' // 防止选中一个文件取消后不能再选中同一个文件
  }

  const onFileChange = () => {
    if (imgUploadRef.current) {
      let File = (imgUploadRef.current.files || [])[0]
      dealFile(File)
    }
  }
  const inputRef = useRef<any>()
  const [showPreview, setShowPreview] = useState(false)
  const [imageURL, setImageURL] = useState('')

  const handleSend = (data: InputBoxResult) => {
    if (!data) {
      return
    }
    let content = ''
    let UploadQueue: Array<InputBoxImage> = []
    if (data.msgData && data.msgData.length > 0) {
      data.msgData.forEach(text => {
        content += text.msg
      })
    }

    if (data.needUploadFile && data.needUploadFile.length > 0) {
      data.needUploadFile.forEach(file => {
        UploadQueue.push(file)
      })
    }

    const promises: Promise<{ url: string }>[] = []

    UploadQueue.forEach(data => {
      promises.push(uploadImg(data))
    })

    if (promises.length > 0) {
      setSending(true)
      Promise.all(promises)
        .then(result => {
          console.log(result)
          const sendParams: sendOpinionRequestPrams = {
            content,
            type: 1,
            urls: []
          }
          if (Array.isArray(result) && result.length > 0) {
            result.forEach((item: { url: string }) => {
              sendParams.urls?.push(item.url)
            })
          }
          return sendLiveOpinions(sendParams)
        })
        .then(res => {})
        .finally(() => {
          setSending(false)
        })
    } else {
      setSending(true)
      const sendParams: sendOpinionRequestPrams = {
        content,
        type: 1,
        urls: []
      }
      sendLiveOpinions(sendParams).finally(() => {
        setSending(false)
      })
    }
  }

  const uploadImg = (data: InputBoxImage) => {
    let fileName = uid(32)
    if (data.file.type) {
      const fileType = data.file.type.split('/')[1]
      fileName = `${fileName}.${fileType}`
    }
    return UploadUtil.shared.uploadImg(data.file, fileName)
  }

  const dealFile = (file: any) => {
    if (file.type?.startsWith('image/')) {
      const sizeAllow = file.size / 1024 / 1024 <= 5
      if (!sizeAllow) {
        toast({ description: '图片限制最大5M' })
        return
      }

      const url = URL.createObjectURL(file)
      if (inputRef.current) {
        inputRef.current.insertImage(url, file)
      }
    } else {
      toast({ description: '暂不支持发送此类文件' })
    }
  }

  return (
    <div className="text-img-live-box">
      {user?.user_type === '2' && (
        <div className="pl-20 pr-20 mb-2">
          <Input
            className={'h-[24px] placeholder:text-tertiary'}
            placeholder="搜索记录"
            size="sm"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const params = generateParams()
                params.keyword = e.currentTarget.value

                setFetchParams(params)
              }
            }}
          />
        </div>
      )}
      <MsgScrollLoader
        rowKey="id"
        rowKeyPerfix="opinion"
        id="scroll-content-opinion"
        reverse
        fetchParams={fetchParams}
        fetchData={getLiveOpnions}
        onPageChange={page => {
          const params = generateParams()
          params.page = String(page)
          return params
        }}
        renderItem={(item: opinionItem) => {
          return (
            <div key={`opinion${item.id}`} className="opinion-item mb-10" id={`opinion${item.id}`}>
              <div className="avatar-info flex items-center mb-3">
                <div className="avatar-img mr-2">评</div>
                <div className="mr-2 teacher-name">{item.user.username}</div>
                <div className="opinion-time text-sm text-gray-600">
                  美东时间
                  {formatTimestamp(Number(item.create_time) * 1000)}
                </div>
              </div>
              <div className="opinion-content ml-10">
                <HighlightDollarWords text={item.content} />

                {Array.isArray(item.urls) && item.urls.length > 0 && (
                  <div className="flex mt-2">
                    {item.urls.map((url, index) => {
                      return (
                        <img
                          alt=""
                          className="mr-3 max-w-[160px] max-h-[160px]"
                          src={url}
                          key={url}
                          onClick={() => {
                            setImageURL(url)
                            setShowPreview(true)
                          }}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              // Enter or Space key
                              setImageURL(url)
                              setShowPreview(true)
                            }
                          }}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        }}
      />

      {user?.user_type === '2' && (
        <div className="h-[180px] topgap">
          <div className="flex h-[32px] items-center ">
            <span
              onClick={() => {
                imgUploadRef.current?.click()
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  // Enter or Space key
                  imgUploadRef.current?.click()
                }
              }}
            >
              <input
                onClick={onFileClick}
                onChange={onFileChange}
                type="file"
                multiple={false}
                accept="image/*"
                ref={imgUploadRef}
                style={{ display: 'none' }}
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
                  resize: 'none',
                  width: '100%',
                  height: '100px',
                  backgroundColor: 'rgb(20, 21, 25)',
                  boxSizing: 'border-box',
                  padding: '10px',
                  color: '#fff'
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
                  inputRef.current.dealSend()
                }
              }}
            >
              发送
            </Button>
          </div>
        </div>
      )}
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
  )
}

export default TextImgLive
