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
  client: any
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
    this.client = {}
    this.store = null
  }

  init() {
    const token = useToken.getState().token
    if (token) {
      this.getOssToken()
      return
    }

    useToken.subscribe(s => {
      if (s.token) {
        this.getOssToken()
      }
    })
  }

  getOssToken() {
    request.get('/upload/getOssToken').then(r => {
      this.tokenRes = r.data

      this.cos()
    })
  }

  //腾讯云
  cos() {
    // OSS配置正常是tokenRes返回，但是这里写死数据
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
      aclMode: 'public-read'
    })
    this.store = cos
    // 更改图片权限
    // cos.putBucketACL(this.tokenRes.bucket, 'public-read')
    try {
      this.client.upload = (file, filename: string) => {
        return new Promise((resolve, reject) => {
          console.log(file)
          //cos上传函数
          cos.put('image/' + filename, file).then(res => {
            console.log('res', res)
            resolve(res)
          })
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  // 上传
  async uploadImg(file, filename: string) {
    try {
      const res = await this.client.upload(file, filename).catch(e => console.error(e))
      return {
        url: res.url
      }
    } catch (error) {
      throw new Error(error)
    }
  }
}

export default UploadUtil
