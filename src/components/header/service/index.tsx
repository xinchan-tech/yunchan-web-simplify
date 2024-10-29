import { Popover, Table, type TableProps } from "antd"
import DiscordPng from '@/assets/icon/discord.png'
import TelegramPng from '@/assets/icon/telegram.png'
import WeChatPng from '@/assets/icon/wechat.png'
import { useTranslation } from "react-i18next"

const HeaderService = () => {
  const {t} = useTranslation()
  return (
    <div>
      <Popover overlayStyle={{border: '1px solid #353535'}} overlayClassName="rounded-md overflow-hidden"  content={<Content />} trigger="hover" placement="bottom">
        <span className="text-sm">{t('contact')}</span>
      </Popover>
    </div>
  )
}

const columns: TableProps['columns'] = [
  { title: '', dataIndex: 'type', render: (_, record) => <span className="flex items-center"><img src={record.icon} alt="" className="mr-2" width={28} />{record.type}</span> },
  { title: '卢老师', dataIndex: 't1' },
  { title: '丽丽老师', dataIndex: 't2' }
]

const data = [
  { type: 'WeChat', t1: 'jnk6888', t2: 'jkn5977', icon: WeChatPng },
  { type: 'Telegram', t1: 'jkn7577', t2: 'jkn00078', icon: TelegramPng },
  { type: 'Discord', t1: 'China@2923', t2: 'China#7019', icon: DiscordPng }
]

const Content = () => (
  <Table columns={columns} dataSource={data} pagination={false} size='small' rowKey='type' />
)


export default HeaderService