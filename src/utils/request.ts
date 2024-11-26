import { useConfig, useServers, useToken, useUser } from "@/store"
import axios from "axios"

const request = axios.create()
request.defaults.baseURL = import.meta.env.PUBLIC_BASE_API_URL

request.interceptors.request.use(config => {
  const token = useToken.getState().token
  const language = useConfig.getState().language
  config.baseURL = useServers.getState().lastServer.host
  config.headers.set('Authorization', token)
  config.headers.set('Accept-Language', language)
  config.headers.set('os', 'windows')
  
  return config
})

// let modalIns: ReturnType<typeof Modal.error> | null = null

request.interceptors.response.use(response => {
  if(response.data.status === 401){
    // console.log(modalIns)
    // if(!modalIns){
    //   modalIns = Modal.error({ 
    //     content: '登录已过期，请重新登录',
    //     afterClose: () => {
    //       modalIns = null
    //       useUser.getState().reset()
    //       useToken.getState().removeToken()
    //     }
    //   })
    // }
    // throw new Error(response.data.msg)
  }

  if(response.data.status !== 1){
    throw new Error(response.data.msg)
  }


  return response.data
}, (err) => {
  return Promise.reject(err)
})

export default request