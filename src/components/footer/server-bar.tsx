import { useServers } from "@/store"
import JknIcon from "../jkn/jkn-icon"
import { Popover, PopoverAnchor, PopoverContent } from "../ui/popover"
import { useImmer } from "use-immer"
import { useBoolean } from "ahooks"
import { wsManager } from "@/utils/ws"
import { CheckIcon } from "lucide-react"

export const ServerBar = () => {
  const { servers, lastServer } = useServers()
  const [open, { setTrue, setFalse }] = useBoolean()
  const [serverTest, setServerTest] = useImmer<{ name: string, ttl: number | undefined }[]>([])
  

  const _onOpenChange = (_open: boolean) => {
    if (_open) {
      testAllServers()
      setTrue()
    } else {
      setFalse()
    }
  }

  const testAllServers = () => {
    setServerTest(servers.map(server => ({ name: server.name, ttl: undefined })))
    for (const server of servers) {
      wsManager.test(server.ws).then(r => {
        setServerTest(draft => {
          const index = draft.findIndex(item => item.name === server.name)
          if (index !== -1) {
            draft[index].ttl = r
          }
        })
      })

    }
  }

  return (
    <Popover open={open} onOpenChange={_onOpenChange}>
      <PopoverAnchor className="flex">
        <JknIcon name="ic_connected" onClick={() => _onOpenChange(true)} />
      </PopoverAnchor>
      <PopoverContent align="end" side="top" className="w-[200px] px-4 box-border py-2">
        {
          servers.map((server) => (
            <div key={server.name} className="flex items-center gap-2 text-xs">
              {
                lastServer.name === server.name && (
                  <CheckIcon className="h-4 w-4 text-primary" />
                )
              }
              <div>{server.name}</div>
              <div className="ml-auto">
                {
                  serverTest.find(item => item.name === server.name)?.ttl ?? '--'
                }ms
              </div>
            </div>
          ))
        }
      </PopoverContent>
    </Popover>
  )
}

