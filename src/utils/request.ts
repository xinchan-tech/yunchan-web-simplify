import { useConfig, useToken, useUser } from "@/store"
import { Modal } from "antd"
import axios from "axios"

const request = axios.create()
console.log(import.meta.env)
request.defaults.baseURL = import.meta.env.PUBLIC_BASE_API_URL

request.interceptors.request.use(config => {
  const token = useToken.getState().token
  const language = useConfig.getState().language

  config.headers.set('Authorization', token)
  config.headers.set('Accept-Language', language)
  
  return config
})

let modalIns: ReturnType<typeof Modal.error> | null = null

request.interceptors.response.use(response => {
  if(response.data.status === 0){
    throw new Error(response.data.msg)
  }

  if(response.data.status === 401){
    if(!modalIns){
      modalIns = Modal.error({ 
        content: '登录已过期，请重新登录',
        afterClose: () => {
          modalIns = null
          useUser.getState().reset()
          useToken.getState().removeToken()
        }
      })
    }
    throw new Error(response.data.msg)
  }

  return response.data
}, (err) => {
  return Promise.reject(err)
})

export default request