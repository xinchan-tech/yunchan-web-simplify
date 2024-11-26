import { useServers } from "@/store"
import JknIcon from "../jkn/jkn-icon"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "../ui/popover"
import { useImmer } from "use-immer"
import { useBoolean } from "ahooks"
import { JknWebSocket } from "@/utils/ws"

export const ServerBar = () => {
  const { servers } = useServers()
  const [open, { setTrue, setFalse }] = useBoolean()
  const [serverTest, setServerTest] = useImmer<{ name: string, ttl: number }[]>([])

  const _onOpenChange = (_open: boolean) => {
    console.log(_open)
    if (_open) {
      testAllServers()
      setTrue()
    } else {
      setFalse()
    }
  }

  const testAllServers = () => {
    for (const server of servers) {
      console.log(server.ws)
      const ws = JknWebSocket.create(server.ws)
      ws.getIns()?.on('data', (data: any) => {
        console.log(data)
      })
    }
  }

  return (
    <Popover open={open} onOpenChange={_onOpenChange}>
      <PopoverAnchor className="flex">
        <JknIcon name="ic_connected" onClick={() => _onOpenChange(true)} />
      </PopoverAnchor>
      <PopoverContent>
        {
          servers.map((server) => (
            <div key={server.name} className="flex items-center gap-2">
              <div className="text-sm">{server.name}</div>
              <div className="flex items-center gap-2">

              </div>
            </div>
          ))
        }
      </PopoverContent>
    </Popover>
  )
}

