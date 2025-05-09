import { useToken } from '@/store'
import request from '@/utils/request'
import OSS from 'ali-oss'

class UploadUtil {
  public static shared = new UploadUtil()
  tokenRes: {
    bucket: string
    credentials: {
      accessKeyId: string
      accessKeySecret: string
      expiration: string
      securityToken: string
    }
    endpoint: string
  }
  clientUpload: (file: File, name: string) => Promise<any>
  store: any
  constructor(/* fileType = "image" */) {
    this.tokenRes = {
      bucket: '',
      credentials: {
        accessKeyId: '',
        accessKeySecret: '',
        expiration: '',
        securityToken: ''
      },
      endpoint: ''
    }
    this.clientUpload = async () => {}
    this.store = null
  }

  init() {
    //接口获取token信息(签名url)
    // this.getOssToken()

    const token = useToken.getState().token
    let unSubscribe: any
    if (!token) {
      unSubscribe = useToken.subscribe(state => {
        if (state.token) {
          this.getOssToken()
          unSubscribe?.()
        }
      })
    } else {
      this.getOssToken()
    }
  }

  getOssToken() {
    const token = useToken.getState().token
    if (token) {
      request.get('/upload/getOssToken').then(r => {
        this.tokenRes = r.data

        this.cos()
      })
    }
  }

  //腾讯云
  cos() {
    const wait = new Date(this.tokenRes.credentials.expiration).getTime() - new Date().getTime() - 60 * 100
    const cos = new OSS({
      // yourregion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
      region: 'oss-cn-shenzhen',
      // 访问凭证
      secure: true,
      accessKeyId: this.tokenRes.credentials.accessKeyId,
      accessKeySecret: this.tokenRes.credentials.accessKeySecret,
      // 填写Bucket名称。
      bucket: this.tokenRes.bucket,
      stsToken: this.tokenRes.credentials.securityToken,
      endpoint: this.tokenRes.endpoint,
      aclMode: 'public-read',
      refreshSTSToken: async () => {
        // 调用后端接口获取新的 STS Token
        const result = await request.get('/upload/getOssToken')
        this.tokenRes = result.data

        cos.options.stsToken = this.tokenRes.credentials?.securityToken
        return {
          accessKeyId: this.tokenRes.credentials?.accessKeyId,
          accessKeySecret: this.tokenRes.credentials?.accessKeySecret,
          stsToken: this.tokenRes.credentials?.securityToken,
          securityToken: this.tokenRes.credentials?.securityToken
        }
      },
      refreshSTSTokenInterval: wait
    })
    this.store = cos
    // 更改图片权限
    // cos.putBucketACL(this.tokenRes.bucket, 'public-read')
    try {
      this.clientUpload = (file: File, filename: string) => {
        return new Promise((resolve, reject) => {
          cos
            .put(`image/${filename}`, file)
            .then(res => {
              console.log('res', res)
              resolve(res)
            })
            .catch(er => {
              reject(er)
            })
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  // 上传
  async uploadImg(file: File, filename: string) {
    const res: { url: string } = await this.clientUpload(file, filename).catch(e => {
      console.error(e)
    })
    return {
      url: res.url
    }
  }
}

export default UploadUtil
