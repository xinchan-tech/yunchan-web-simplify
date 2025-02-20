import { getGroupDetailService, getPaymentTypesService, joinGroupService, loopUpdatePaymentStatus } from '@/api'
import type { GroupData } from '../../group-channel'
import ChatAvatar from '../chat-avatar'
import { Button } from '@/components'
import QrCode from 'react-qr-code'

import { cn } from '@/utils/style'
import { useEffect, useRef, useState } from 'react'

import WKSDK from 'wukongimjssdk'
import { useToast } from '@/hooks'
import FullScreenLoading from '@/components/loading'
import { Checkbox } from '@/components'
import { setExpireGroupInCache } from '../../chat-utils'
import { useQuery } from '@tanstack/react-query'

const JoinGroup = (props: {
  data: GroupData
  onSuccess: () => void
  onClose: () => void
  type?: string
}) => {
  const { data } = props
  const { toast } = useToast()

  const options = {
    queryFn: () => getPaymentTypesService(),
    queryKey: [getPaymentTypesService.key]
  }

  const options2 = {
    queryFn: () => getGroupDetailService(data.account),
    queryKey: [getGroupDetailService.key]
  }

  const { data: payMethods, isFetching: isFetchingPayMethods } = useQuery(options)
  const { data: groupDetailData, isFetching } = useQuery(options2)

  const [curPayMethod, setCurPayMethod] = useState('')
  const [wechatPaymentUrl, setWechatPaymentUrl] = useState('')

  const renderTags = () => {
    let tags: string[] = []
    if (data.tags) {
      tags = data.tags.split(/[,、]/)
    }

    return tags.map((tag, idx) => {
      if (!tag) {
        return null
      }
      return (
        <div key={`${tag}${idx}`} className="group-tag mr-2 h-5 leading-5 pl-[6px] pr-[6px] rounded-sm">
          {tag}
          <style jsx>{`
            .group-tag {
              background-color: rgb(40, 41, 46);
              color: rgb(165, 165, 165);
              font-size: 14px;
            }
          `}</style>
        </div>
      )
    })
  }

  const timerRef = useRef<number>()
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!curPayMethod && payMethods) {
      setCurPayMethod(payMethods[0].type)
    }
  }, [payMethods])

  const [joinIng, setJoinIng] = useState(false)

  const loopCheckStatus = (sn: string) => {
    timerRef.current = setInterval(() => {
      loopUpdatePaymentStatus(sn).then(res => {
        if (Number(res.pay_status) === 1) {
          clearInterval(timerRef.current)

          WKSDK.shared().config.provider.syncConversationsCallback()
          toast({ description: '加群成功' })
          setExpireGroupInCache(data.account, false)
          setJoinIng(false)
          typeof props.onSuccess === 'function' && props.onSuccess()
        }
      })
    }, 10000)
  }

  const handleJoinGroup = async () => {
    if (!curPayMethod) {
      toast({ description: '请选择支付方式' })
      return
    }
    if (data.account) {
      try {
        let resp

        setJoinIng(true)
        if (selectedProdSn) {
          resp = await joinGroupService(data.account, {
            product_sn: selectedProdSn,
            payment_type: curPayMethod
          })
          console.log(resp)
        }
        if (resp === true) {
          WKSDK.shared().config.provider.syncConversationsCallback()
          toast({ description: '加群成功' })
          setExpireGroupInCache(data.account, false)
          typeof props.onSuccess === 'function' && props.onSuccess()
          setJoinIng(false)
        } else if (resp.pay_sn && resp.config) {
          if (resp.config.url) {
            if (curPayMethod === 'wechat') {
              setWechatPaymentUrl(resp.config.url)
            } else {
              window.open(resp.config.url)
            }
            loopCheckStatus(resp.pay_sn)
          }
        }
      } catch (er) {
        console.error(er)
        toast({ description: er?.message || '加群失败' })
        setJoinIng(false)
      }
    }
  }

  const [selectedProdSn, setSelectedProdSn] = useState('')

  useEffect(() => {
    if (groupDetailData && Array.isArray(groupDetailData.products) && groupDetailData.products.length > 0) {
      setSelectedProdSn(groupDetailData.products[0].product_sn)
    }
  }, [groupDetailData])

  return (
    <div className="join-group-panel">
      <div
        className="back-btn text-sm text-gray-400 cursor-pointer"
        onClick={() => {
          typeof props.onClose === 'function' && props.onClose()
        }}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            // Enter or Space key
            typeof props.onClose === 'function' && props.onClose()
          }
        }}
      >
        返回
      </div>
      {(isFetching === true || isFetchingPayMethods === true) && <FullScreenLoading fullScreen={false} />}
      <div className="join-group-content">
        <div className="flex items-center justify-center mb-[20px]">
          <div className="flex justify-center items-center">
            <ChatAvatar
              data={{
                avatar: data.avatar,
                name: data.name,
                uid: data.account
              }}
              className="w-[80px] h-[80px]"
            />
            <div className="ml-[20px]">
              <div className="text-xl font-bold text-white mb-4">{data.name || ''}</div>
              <div className="flex">{renderTags()}</div>
            </div>
          </div>
        </div>
        <div className="group-info">{groupDetailData?.notice || ''}</div>
        <div
          className={cn(
            'prod-list flex',
            Array.isArray(groupDetailData?.products) && groupDetailData.products.length > 1
              ? 'justify-between'
              : 'justify-center'
          )}
        >
          {Array.isArray(groupDetailData?.products) &&
            groupDetailData.products.length > 0 &&
            groupDetailData.products.map(prod => {
              return (
                <div
                  key={prod.product_sn}
                  className={cn('prod-item', selectedProdSn === prod.product_sn && 'selected')}
                  onClick={() => {
                    setSelectedProdSn(prod.product_sn)
                  }}
                >
                  <div className="font-bold prod-name text-center mb-2">{groupDetailData?.name}</div>

                  <div className="text-center">
                    <span className="prod-price ">$</span>
                    <span className="prod-price ">
                      {prod.unit === '月'
                        ? (Number(prod.price) / 30).toFixed(2)
                        : (Number(prod.price) / 360).toFixed(2)}
                    </span>
                    <span className="prod-unit ">/天</span>
                  </div>

                  <div className="text-center mt-3 text-gray-400 text-sm">
                    <span>$</span>
                    <span>{prod.price}</span>
                    <span>/{prod.unit}</span>
                  </div>
                </div>
              )
            })}
        </div>
        <div className="mt-10">
          <div className="flex justify-center items-center">
            {payMethods?.map(item => {
              return (
                <div className="flex items-center mr-5" key={item.type}>
                  <Checkbox
                    checked={curPayMethod === item.type}
                    onCheckedChange={chk => {
                      if (chk === true) {
                        setCurPayMethod(item.type)
                      }
                    }}
                  />

                  <span className="ml-2">{item.name}</span>
                </div>
              )
            })}
          </div>
          {curPayMethod === 'wechat' && wechatPaymentUrl && (
            <div className="mt-2">
              <div className="flex justify-center h-[180px]">
                <QrCode value={wechatPaymentUrl} size={180} />
              </div>
              <div className="mt-2 text-center">请使用微信扫码完成支付</div>
            </div>
          )}
          <div className="flex justify-center items-center mt-2 mb-6">
            <Button
              loading={joinIng}
              onClick={handleJoinGroup}
              className="w-[200px] h-[52px] leading-[52px] rounded-md text-lg font-bold"
            >
              加入群聊
            </Button>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .prod-list {
            margin: 40px auto 0 auto;
            flex-shrink: 0;
            width: 500px;
          }
          .prod-name {
            font-size: 20px;
          }
          .prod-price {
            font-size: 30px;
          }
          .prod-unit {
            font-size: 14px;
          }
          .prod-item {
            padding-top: 20px;
            width: 200px;
            background-color: black;
            height: 150px;
            border-radius: 8px;
            box-sizing: border-box;
            border: 5px solid transparent;
          }
          .back-btn {
            position: absolute;
            height: 32px;
            line-height: 32px;
            padding: 0 10px;
            background-color: rgb(40, 40, 40);
            left: 16px;
            top: 16px;
            border-radius: 4px;
          }
          .prod-item.selected {
            border: 5px solid hsl(var(--primary));
          }
          .join-group-panel {
            height: 100%;
            box-sizing: border-box;
            overflow-y: auto;
          }
          .join-group-content {
            height: 100%;
            border-radius: 12px;
            box-sizing: border-box;
            padding: 30px 60px;
          }
          .group-info {
            height: 80px;
            border-radius: 12px;
            margin: 0 auto;
            padding: 20px;
            width: 500px;
            box-sizing: border-box;
            background-color: rgb(35, 35, 35);
          }
        `}
      </style>
    </div>
  )
}

export default JoinGroup
