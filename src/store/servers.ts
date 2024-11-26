import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type Server = {
  host: string
  name: string
  ws: string
}

const defaultServers: Server = { name: 'Conn_us1', host: 'http://localhost:3000/api', ws: 'ws://localhost:3000/ws' }

interface ServersStore {
  servers: Server[]
  lastServer: Server
  getLastServer: () => Server
  setLastServer: (name: string) => void
  setServers: (service: Server[]) => void
}

export const useServers = create<ServersStore>()(
  persist(
    (set, get) => ({
      servers: [defaultServers],
      lastServer: defaultServers,
      getLastServer: () => get().lastServer ?? defaultServers,
      setLastServer: name => {
        const servers = get().servers
        const lastServer = servers.find(s => s.name === name) ?? defaultServers
        set(() => ({ lastServer }))
      },
      setServers: servers => set(() => ({ servers: [...servers] }))
    }),
    { name: 'servers', storage: createJSONStorage(() => localStorage) }
  )
)
