import DiscordPng from '@/assets/icon/discord.png'
import TelegramPng from '@/assets/icon/telegram.png'
import WeChatPng from '@/assets/icon/wechat.png'
import { useTranslation } from "react-i18next"
import { useConfig } from "@/store"
import { HoverCard, HoverCardContent, HoverCardTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components"

const HeaderService = () => {
  const { t } = useTranslation()

  return (
    <div className="mr-4">
      <HoverCard openDelay={100}>
        <HoverCardTrigger asChild><span className="text-sm cursor-pointer">{t('contact')}</span></HoverCardTrigger>
        <HoverCardContent className="w-[400px]" align="end"><Content /></HoverCardContent>
      </HoverCard>
    </div>
  )
}

const Content = () => {
  const { consults } = useConfig()

  const data: Record<string, unknown>[] = (() => {
    const t: Record<string, unknown>[] = [
      { type: 'WeChat', icon: WeChatPng, concat: [] },
      { type: 'Telegram', icon: TelegramPng, concat: []  },
      { type: 'Discord', icon: DiscordPng, concat: []  }
    ]
    for (const item of consults) {
      (t[0].concat as string[]).push(item.contact[0]);
      (t[1].concat as string[]).push(item.contact[1]);
      (t[2].concat as string[]).push(item.contact[2])
    }
    console.log(t, consults)
    return t
  })()

  return (
    // <Table columns={columns} dataSource={data} pagination={false} size='small' rowKey='type' />
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[240px]">&nbsp;</TableHead>
          {
            consults.map(h => (
              <TableHead className="w-[100px]" key={h.name}>{h.name}</TableHead>
            ))
          }
        </TableRow>
      </TableHeader>
      <TableBody>
        {
          data.map(row => (
            <TableRow key={row.type as string}>
              <TableCell className="flex items-center"><img src={row.icon as string} className="w-8" alt="" /><span>{row.type as string}</span></TableCell>
              {
                (row.concat as string[]).map(item => {
                  return <TableCell key={item}>{item}</TableCell>
                })
              }
            </TableRow>
          ))
        }
      </TableBody>
    </Table>
  )
}


export default HeaderService