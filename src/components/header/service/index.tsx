import { Popover, Table, type TableProps } from "antd"
import DiscordPng from '@/assets/icon/discord.png'
import TelegramPng from '@/assets/icon/telegram.png'
import WeChatPng from '@/assets/icon/wechat.png'
import { useTranslation } from "react-i18next"
import { useConfig } from "@/store"

const HeaderService = () => {
  const { t } = useTranslation()

  return (
    <div className="mr-4">
      <Popover overlayStyle={{ border: '1px solid #353535' }} overlayClassName="rounded-md overflow-hidden" content={<Content />} trigger="hover" placement="bottom">
        <span className="text-sm">{t('contact')}</span>
      </Popover>
    </div>
  )
}


const Content = () => {
  const { consults } = useConfig()

  const columns: TableProps['columns'] = [
    { title: '', dataIndex: 'type', render: (_, record) => <span className="flex items-center"><img src={record.icon} alt="" className="mr-2" width={28} />{record.type}</span> },
    ...consults.map((c, index) => ({ title: c.name, dataIndex: `t${index}` }))
  ]

  console.log(columns)

  const data = (() => {
    const t: Record<string, unknown>[] = [
      { type: 'WeChat', icon: WeChatPng, },
      { type: 'Telegram', icon: TelegramPng },
      { type: 'Discord', icon: DiscordPng }
    ]

    for (const _t of t) {
      consults.forEach((item, index) => {
        _t[`t${index}`] = item.contact[index]
      })
    }

    return t
  })()

  return (
    <Table columns={columns} dataSource={data} pagination={false} size='small' rowKey='type' />
  )
}


export default HeaderService