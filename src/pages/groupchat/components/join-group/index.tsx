import { getChannelDetail, getPaymentTypesService, joinGroupService, loopUpdatePaymentStatus } from '@/api'
import { Button, JknIcon } from '@/components'
import QrCode from 'react-qr-code'
import type { GroupData } from '../../group-channel'
import ChatAvatar from '../chat-avatar'

import { cn } from '@/utils/style'
import { useEffect, useRef, useState } from 'react'

import { Checkbox } from '@/components'
import FullScreenLoading from '@/components/loading'
import { useToast } from '@/hooks'
import { useQuery } from '@tanstack/react-query'
import WKSDK from 'wukongimjssdk'
import { setExpireGroupInCache } from '../../chat-utils'
import { createPortal } from "react-dom"
import { GroupTag } from "../create-and-join-group/group-channel-card"
import Decimal from "decimal.js"

const getDiscountByYearCompareMonth = (product: Awaited<ReturnType<typeof getChannelDetail>>['products']) => {
  const monthPrice = product.find(item => item.unit === '月')?.price
  const yearPrice = product.find(item => item.unit === '年')?.price

  if (monthPrice && yearPrice) {
    return (Number(monthPrice) * 12 - Number(yearPrice))
  }

  return 0
}

export const JoinGroup = (props: {
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
    queryFn: () => getChannelDetail(data.account),
    queryKey: [getChannelDetail.key]
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
  console.log(selectedProdSn)

  useEffect(() => {
    if (groupDetailData && Array.isArray(groupDetailData.products) && groupDetailData.products.length > 0) {
      setSelectedProdSn(groupDetailData.products[0].product_sn)
    }
  }, [groupDetailData])

  return (
    <div className="join-group-panel">
      <div
        className="back-btn text-sm text-tertiary cursor-pointer"
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
        <JknIcon.Svg name="arrow-down" className="rotate-90" size={12} />
      </div>
      {(isFetching === true || isFetchingPayMethods === true) && <FullScreenLoading fullScreen={false} />}
      <div className="join-group-content text-sm">
        <div className="flex items-center justify-center mb-1">
          <div className="flex flex-col justify-center items-center">
            <ChatAvatar
              data={{
                avatar: data.avatar,
                name: data.name,
                uid: data.account
              }}
              className="w-[64px] h-[64px]"
            />
            <div className="mt-2.5 text-center">
              <div className="text-xl font-bold text-white mb-2">{data.name || ''}</div>
              <GroupTag tags={data.tags} total={data.total_user} />
            </div>
          </div>
        </div>
        <div className="text-center text-tertiary">{groupDetailData?.brief || ''}</div>
        <div
          className={cn('prod-list flex justify-center space-x-8')}
        >
          {Array.isArray(groupDetailData?.products) &&
            groupDetailData.products.length > 0 &&
            groupDetailData.products.map(prod => {
              return (
                <div
                  key={prod.product_sn}
                  className={cn('prod-item', selectedProdSn === prod.product_sn && 'selected')}
                  onClick={() => {
                    console.log(12321)
                    setSelectedProdSn(prod.product_sn)
                  }}
                  onKeyDown={() => { }}
                >
                  <div className="prod-name text-center text-xl mb-2">{groupDetailData?.name}</div>

                  <div className="text-center mt-8">
                    <span className="prod-price ">$</span>
                    <span className="prod-price ">
                      {(Number(prod.price)).toFixed(2)}
                    </span>
                    <span className="prod-unit ">/{prod.unit}</span>
                  </div>

                  {
                    prod.unit === '年' ? (
                      <>
                        <div className="text-center mt-3 text-sm text-tertiary"
                          style={{
                            textDecoration: getDiscountByYearCompareMonth(groupDetailData.products) > 0 ? 'line-through' : 'none'
                          }}
                        >
                          <span>$</span>
                          <span>{Decimal.create(prod.price).plus(getDiscountByYearCompareMonth(groupDetailData.products)).toFixed(2)}</span>
                          <span>/{prod.unit}</span>
                        </div>

                        <div className="mt-4 text-center inline-block mx-auto text-[#6A4C18] rounded-3xl px-3 py-1"
                          style={{
                            background: 'linear-gradient(83.9deg, #FADFB0 9.32%, #FECA90 52.73%, #EC9B51 103.69%)'
                          }}
                        >
                          <span>
                            折合${Decimal.create(prod.price).div(12).toFixed(2)}/月
                          </span>
                        </div>
                      </>
                    ) : null
                  }
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
          <div className="flex justify-center items-center mt-4 mb-6">
            <Button
              loading={joinIng}
              onClick={handleJoinGroup}
              className="w-[200px] h-[52px] leading-[52px] rounded-3xl text-lg text-[#6A4C18]"
              style={{ background: 'linear-gradient(83.9deg, #FADFB0 9.32%, #FECA90 52.73%, #EC9B51 103.69%)' }}
            >
              加入社群
            </Button>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .prod-list {
            margin: 16px auto 0 auto;
            flex-shrink: 0;
            width: 500px;
          }
          .prod-name {
            font-size: 20px;
          }
          .prod-price {
            font-size: 32px;
            font-weight: 500;
          }
          .prod-unit {
            font-size: 14px;
          }
          .prod-item {
            padding: 40px 8px;
            width: 200px;
            background-color: #0F0F0F;
            border-radius: 16px;
            box-sizing: border-box;
            box-shadow: 0px 0px 1px 0 #575757, 0px 0px 1px 0 #575757;
            border: 3px solid transparent;
            cursor: pointer;
            text-align: center;
          }
          .back-btn {
            position: absolute;
            height: 32px;
            line-height: 32px;
            padding: 0 10px;
            border: 1px solid hsl(var(--accent));
            left: 16px;
            top: 16px;
            border-radius: 4px;
          }
          .prod-item.selected {
            color: #E7C88D;
            border-color: currentColor;
            box-shadow: none;
            background-color: #26231B;
          }
          .join-group-panel {
            height: 100%;
            position: fixed;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            box-sizing: border-box;
            overflow-y: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999999;
          }
          .join-group-content {
            {/* height: 100%;
            border-radius: 12px;
            box-sizing: border-box;
            padding: 30px 60px; */}
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