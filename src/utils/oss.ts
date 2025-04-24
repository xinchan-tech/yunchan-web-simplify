import { getAliOssToken } from '@/api'
import OSS from 'ali-oss'
import to from 'await-to-js'
import dayjs from 'dayjs'

type OssConfig = {
  credentials: {
    accessKeyId?: string
    accessKeySecret?: string
    expiration?: string
    securityToken?: string
  }
  bucket?: string
  endpoint?: string
}

const ossConfig: OssConfig = {
  credentials: {
    accessKeyId: undefined,
    accessKeySecret: undefined,
    expiration: undefined,
    securityToken: undefined
  }
}

let ossClient: OSS | null = null

const getOssClient = async () => {
  if (ossClient) {
    const expiration = ossConfig.credentials.expiration!
    if (dayjs(expiration).isAfter(dayjs())) {
      return ossClient
    }
  }

  const [err, r] = await to(getAliOssToken())

  if (err) {
    throw err
  }

  Object.assign(ossConfig, r)

  ossClient = new OSS({
    accessKeyId: ossConfig.credentials.accessKeyId!,
    accessKeySecret: ossConfig.credentials.accessKeySecret!,
    stsToken: ossConfig.credentials.securityToken!,
    bucket: ossConfig.bucket!,
    endpoint: ossConfig.endpoint!,
    region: 'oss-cn-shenzhen'
  })

  return ossClient
}

export const uploadUtils = {
  upload: async (file: File, filename: string) => {
    const client = await getOssClient()

    const res = await client.put(filename, file)
    
    return res
  }
}
