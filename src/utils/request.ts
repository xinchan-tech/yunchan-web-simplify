import { useConfig, useToken } from '@/store'
import axios from 'axios'
import { appEvent } from './event'

const request = axios.create()
request.defaults.baseURL = import.meta.env.PUBLIC_BASE_API_URL

request.interceptors.request.use(config => {
  const token = useToken.getState().token
  const language = useConfig.getState().language
  const debug = useConfig.getState().debug
  config.headers.set('Authorization', token)
  config.headers.set('Accept-Language', language)
  config.headers.set('os', 'windows')

  if (debug) {
    config.headers.set('x-test', 'true')
  }
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
