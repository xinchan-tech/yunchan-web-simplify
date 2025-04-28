import { useConfig, useToken } from '@/store'
import axios from 'axios'
import { sysConfig } from './config'
import { appEvent } from './event'
import { JknAlert } from "@/components"

const request = axios.create()
request.defaults.baseURL = sysConfig.PUBLIC_BASE_API_URL

request.interceptors.request.use(config => {
  const token = useToken.getState().token
  const language = useConfig.getState().language
  config.headers.set('Authorization', token)
  config.headers.set('Accept-Language', language)
  config.headers.set('os', 'windows')

  return config
})

// let modalIns: ReturnType<typeof Modal.error> | null = null

request.interceptors.response.use(
  response => {
    if (response.data.status === 401) {
      appEvent.emit('logout')
    }

    if (response.data.status !== 1) {
      throw new Error(response.data.msg)
    }

    return response.data
  },
  err => {
    return Promise.reject(err)
  }
)

export default request
