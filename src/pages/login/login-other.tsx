import { getWxLoginStatus } from '@/api'
import { JknIcon, useModal } from '@/components'
import { useToken } from '@/store'
import { appEvent } from '@/utils/event'
import { useMount, useUnmount } from 'ahooks'
import { uid } from 'radash'
import { useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import { router } from '@/router'

interface ThirdLoginFormProps {
  onLogin: (data: any) => void
}

type GoogleLoginResult = {
  clientId: string
  client_id: string
  credential: string
  select_by: string
}

type AppleLoginResult = {
  authorization: {
    code: string
    id_token: string
    state: string
  }
}

export const AppleLogin = (props: ThirdLoginFormProps) => {
  useMount(() => {
    window.AppleID.auth.init({
      clientId: 'com.jkn.app.web',
      redirectURI: import.meta.env.PUBLIC_BASE_APPLE_REDIRECT_URI,
      scope: 'email',
      state: 'https://www.mgjkn.com/main',
      nonce: 'xxx',
      usePopup: true
    })
  })

  const onClick = () => {
    window.AppleID.auth.signIn().then((r: AppleLoginResult) => {
      props.onLogin(r.authorization.code)
    })
  }

  return (
    <div className="apple-login cursor-pointer" onClick={onClick} onKeyUp={() => {}}>
      <JknIcon name="apple-2" className="size-8" />
    </div>
  )
}

export const WeChatLogin = () => {
  const modal = useModal({
    content: <WxLoginForm />,
    title: '',
    closeIcon: true,
    footer: null,
    className: 'w-[379px] bg-muted !rounded-[14px]'
  })

  return (
    <>
      <div className="wechat-login w-8 h-8 cursor-pointer" onClick={modal.modal.open} onKeyUp={() => {}}>
        <JknIcon name="wechat-2" className="size-8" />
      </div>
      {modal.context}
    </>
  )
}

export const GoogleLogin = (props: ThirdLoginFormProps) => {
  const onLoginRef = useRef(props.onLogin)

  useEffect(() => {
    onLoginRef.current = props.onLogin

    return () => {
      onLoginRef.current = () => {}
    }
  }, [props.onLogin])

  useMount(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: '1084914910896-skncl8a34m47fe8toeak808pvrdn18vr.apps.googleusercontent.com',
        context: 'signin',
        ux_mode: 'popup',
        callback: (res: GoogleLoginResult) => {
          onLoginRef.current(res.credential)
        }
      })

      window.google.accounts.id.renderButton(document.getElementById('google-login-2'), {
        theme: 'outline',
        type: 'icon',
        size: 'medium',
        text: 'filled_black',
        shape: 'circle'
      })
    }
  })

  const checkGoogleScript = () => {
    if (!window.google) {
      appEvent.emit('toast', { message: '无法连接到Google' })
    }
  }
  return (
    <div className="google-login cursor-pointer relative overflow-hidden size-8">
      <div id="google-login-2" className="w-full h-full" onClick={checkGoogleScript} onKeyDown={() => {}} />
      <div className="bg-background w-full h-full absolute top-0 left-0 pointer-events-none">
        <JknIcon name="google-2" className="size-full" />
      </div>
    </div>
  )
}

const WxLoginForm = () => {
  const canvas = useRef<HTMLCanvasElement>(null)
  const timer = useRef<number>()

  useMount(() => {
    const size = 160
    const sid = uid(10)
    const url = `https://usnode2.mgjkn.com/login/wx?s_id=${sid}&inv_code=${''}&newsrv=1`

    QRCode.toCanvas(canvas.current, url, {
      errorCorrectionLevel: 'Q',
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      margin: 2
    })

    // 中间绘制logo
    const ctx = canvas.current?.getContext('2d')

    // const img = new Image()

    // img.src = WechatLoginIcon

    // img.onload = () => {
    //   // 白底
    //   ctx?.arc(size / 2, size / 2, 20, 0, Math.PI * 2)
    //   ctx!.fillStyle = '#ffffff'
    //   ctx?.fill()
    //   ctx?.drawImage(img, (size - 40) / 2, (size - 40) / 2, 40, 40)
    // }

    timer.current = window.setInterval(() => {
      getWxLoginStatus(sid).then(res => {
        if (res.code) {
          useToken.getState().setToken(res.code)
          window.clearInterval(timer.current)
          router.navigate('/')
        }
      })
    }, 4000)
  })

  useUnmount(() => {
    window.clearInterval(timer.current)
  })

  return (
    <div className="h-[351px] flex flex-col items-center justify-center">
      <canvas id="wx-qrcode" className="w-[160px] h-[160px] rounded-[14px]" ref={canvas} />
      <div className="mt-5">请用微信扫码登录</div>
    </div>
  )
}
