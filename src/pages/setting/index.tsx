import { Button, JknIcon, Label, RadioGroup, RadioGroupItem, ScrollArea, Textarea } from '@/components'
import { useToast } from '@/hooks'
import { useConfig } from '@/store'
import { cn } from '@/utils/style'
import { useState, type PropsWithChildren } from 'react'

const SettingPage = () => {
  const config = useConfig()
  // 功能建议
  const [suggestion, setSuggestion] = useState('')

  const onScrollTo = (label: string) => {
    const element = document.querySelector(`[data-label="${label}"]`)
    element?.scrollIntoView({ behavior: 'smooth' })
  }
  const { toast } = useToast()
  const onSend = () => {
    if (!import.meta.env.DEV) {
      if (suggestion === 'mode:test') {
        config.setDebug(true)
      } else if (suggestion === 'mode:release') {
        config.setDebug(false)
      } else {
        toast({
          description: '感谢您的建议!'
        })
      }
    }else{
      toast({
        description: '感谢您的建议!'
      })
    }

    setSuggestion('')
  }

  return (
    <div className="h-full bg-muted text-sm">
      <div className="mx-auto h-full w-[800px] relative">
        <div className="absolute border border-solid border-border translate-x-[-100%] -ml-10 top-10">
          <div className="py-4 px-8 cursor-pointer" onClick={() => onScrollTo('系统设置')} onKeyDown={() => {}}>
            {' '}
            系统设置
          </div>
          <div className="py-4 px-8 cursor-pointer" onClick={() => onScrollTo('功能建议')} onKeyDown={() => {}}>
            {' '}
            功能建议
          </div>
          <div className="py-4 px-8 cursor-pointer" onClick={() => onScrollTo('合作联系')} onKeyDown={() => {}}>
            {' '}
            合作联系
          </div>
          <div className="py-4 px-8 cursor-pointer" onClick={() => onScrollTo('版本信息')} onKeyDown={() => {}}>
            {' '}
            版本信息
          </div>
        </div>
        <ScrollArea className="h-full">
          <div
            data-label="系统设置"
            className="mt-12 text-lg border-0 border-b border-solid border-dialog-border mb-8 pb-2"
          >
            系统设置
          </div>
          <div className="space-y-12">
            <SettingItem label="系统语言">
              <RadioGroup
                className="flex space-x-8"
                value={config.language}
                onValueChange={value => config.setLanguage(value as typeof config.language)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zh_CN" id="language-cn" />
                  <Label htmlFor="language-cn">简体中文</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="language-en" />
                  <Label htmlFor="language-en">English</Label>
                </div>
              </RadioGroup>
            </SettingItem>

            <SettingItem label="涨跌颜色">
              <div className="flex space-x-8">
                <div
                  className={cn(
                    'py-3 px-6 border border-solid border-dialog-border rounded-sm cursor-pointer',
                    config.setting.upOrDownColor === 'upGreenAndDownRed' && 'border-primary'
                  )}
                  onClick={() => config.setSetting({ upOrDownColor: 'upGreenAndDownRed' })}
                  onKeyDown={() => {}}
                >
                  <div className="flex items-center mb-1">
                    绿涨&emsp;
                    <JknIcon name="color_green_up" />
                  </div>
                  <div className="flex items-center">
                    红跌&emsp;
                    <JknIcon name="color_red_down" />
                  </div>
                </div>
                <div
                  className={cn(
                    'py-3 px-6 border border-solid border-dialog-border rounded-sm cursor-pointer',
                    config.setting.upOrDownColor === 'upRedAndDownGreen' && 'border-primary'
                  )}
                  onClick={() => config.setSetting({ upOrDownColor: 'upRedAndDownGreen' })}
                  onKeyDown={() => {}}
                >
                  <div className="flex items-center">
                    红涨&emsp;
                    <JknIcon name="color_red_up" />
                  </div>
                  <div className="flex items-center mb-1">
                    绿跌&emsp;
                    <JknIcon name="color_green_down" />
                  </div>
                </div>
              </div>
            </SettingItem>

            <SettingItem label="操作设置">
              <RadioGroup
                value={config.setting.operation}
                onValueChange={value => config.setSetting({ operation: value as typeof config.setting.operation })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mouseForKLine" id="mouseForKLine" />
                  <Label htmlFor="mouseForKLine">鼠标滚轮缩放K线, 键盘上下切换股票</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="keyboardForKLine" id="keyboardForKLine" />
                  <Label htmlFor="keyboardForKLine">鼠标滚轮切换股票, 键盘上下缩放K线</Label>
                </div>
              </RadioGroup>
            </SettingItem>

            <SettingItem label="缩放设置">
              <RadioGroup
                className="flex space-x-8"
                value={config.setting.scale}
                onValueChange={value => config.setSetting({ scale: value as typeof config.setting.scale })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mouseUpToEnlarge" id="mouseUpToEnlarge" />
                  <Label htmlFor="mouseUpToEnlarge">滚轮向上放大K线</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mouseDownToEnlarge" id="mouseDownToEnlarge" />
                  <Label htmlFor="mouseDownToEnlarge">滚轮向下放大K线</Label>
                </div>
              </RadioGroup>
            </SettingItem>

            <SettingItem label="价格闪烁">
              <RadioGroup
                className="flex space-x-8"
                value={config.setting.priceBlink}
                onValueChange={value => config.setSetting({ priceBlink: value as typeof config.setting.priceBlink })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="priceBlink-enable" />
                  <Label htmlFor="priceBlink-enable">开启闪烁</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="priceBlink-disabled" />
                  <Label htmlFor="priceBlink-disabled">关闭闪烁</Label>
                </div>
              </RadioGroup>
            </SettingItem>

            <SettingItem label="报警提示">
              <RadioGroup
                className="flex space-x-8"
                value={config.setting.alarmTips}
                onValueChange={value => config.setSetting({ alarmTips: value as typeof config.setting.alarmTips })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="alarmTips-enable" />
                  <Label htmlFor="alarmTips-enable">开启声音</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="alarmTips-disabled" />
                  <Label htmlFor="alarmTips-disabled">关闭声音</Label>
                </div>
              </RadioGroup>
            </SettingItem>

            <SettingItem label="报警显示">
              <RadioGroup
                className="flex space-x-8"
                value={config.setting.alarmShow}
                onValueChange={value => config.setSetting({ alarmShow: value as typeof config.setting.alarmShow })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="alarmShow-enable" />
                  <Label htmlFor="alarmShow-enable">K线中显示</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="alarmShow-disabled" />
                  <Label htmlFor="alarmShow-disabled">不显示</Label>
                </div>
              </RadioGroup>
            </SettingItem>

            <SettingItem label="缺口设置">
              <RadioGroup
                className="flex space-x-8"
                value={config.setting.gapShow}
                onValueChange={value => config.setSetting({ gapShow: value as typeof config.setting.gapShow })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="gapShow-enabled" />
                  <Label htmlFor="gapShow-enabled">显示缺口</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="gapShow-disabled" />
                  <Label htmlFor="gapShow-disabled">不显示</Label>
                </div>
              </RadioGroup>
            </SettingItem>
          </div>

          <div
            data-label="功能建议"
            className="mt-12 text-lg border-0 border-b border-solid border-dialog-border mb-8 pb-2"
          >
            功能建议
          </div>
          <div className="pr-4">
            <Textarea
              value={suggestion}
              onChange={v => setSuggestion(v.target.value)}
              className="box-border"
              rows={8}
              placeholder="请输入建议"
            />
            <div className="mt-2 text-right">
              <Button onClick={() => onSend()}>发送</Button>
            </div>
          </div>

          <div
            data-label="合作联系"
            className="mt-12 text-lg border-0 border-b border-solid border-dialog-border mb-8 pb-2"
          >
            合作联系：<span className="text-sm">chinajkn@gmail.com</span>
          </div>

          <div
            data-label="版本信息"
            className="mt-12 text-lg border-0 border-b border-solid border-dialog-border mb-4 pb-2"
          >
            版本信息
          </div>
          <div className="flex flex-col space-y-2 items-start mb-8">
            <div>
              当前版本：<span className="text-sm">{__RELEASE_VERSION__}</span>
            </div>
            <div>
              构建信息：<span className="text-sm text-tertiary">{__RELEASE_TAG__}</span>
            </div>
            {config.debug ? (
              <div className="cursor-pointer" onClick={() => config.setDebug(false)} onKeyDown={() => {}}>
                【test env】 x-test: true
              </div>
            ) : null}
          </div>
          <SettingItem label="更多平台支持">
            <div className="flex items-center space-x-12 text-[#565656]">
              <div
                className="cursor-pointer flex flex-col items-center space-y-2"
                onClick={() => open('https://www.mgjkn.com/download')}
                onKeyDown={() => {}}
              >
                <JknIcon name="ic_windows" className="w-12 h-12 rounded-none" />
                <span>Windows</span>
              </div>
              <div
                className="cursor-pointer flex flex-col items-center space-y-2"
                onClick={() => open('https://www.mgjkn.com/download')}
                onKeyDown={() => {}}
              >
                <JknIcon name="ic_macos" className="w-12 h-12 rounded-none" />
                <span>MacOS</span>
              </div>
              <div
                className="cursor-pointer flex flex-col items-center space-y-2"
                onClick={() => open('https://www.mgjkn.com/download')}
                onKeyDown={() => {}}
              >
                <JknIcon name="ic_ios" className="w-12 h-12 rounded-none" />
                <span>iOS</span>
              </div>
              <div
                className="cursor-pointer flex flex-col items-center space-y-2"
                onClick={() => open('https://www.mgjkn.com/download')}
                onKeyDown={() => {}}
              >
                <JknIcon name="ic_android" className="w-12 h-12 rounded-none" />
                <span>Android</span>
              </div>
            </div>
          </SettingItem>
        </ScrollArea>
      </div>
    </div>
  )
}

interface SettingItemProps {
  label: string
}

const SettingItem = ({ label, children }: PropsWithChildren<SettingItemProps>) => {
  return (
    <div className="w-full flex items-center">
      <div className="mr-12">{label}: </div>
      <div>{children}</div>
    </div>
  )
}

export default SettingPage
