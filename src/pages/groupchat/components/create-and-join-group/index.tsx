import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  JknIcon,
  useModal
} from '@/components'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import type { CreateGroupRecord } from '@/api'
import { toast } from '@/hooks'
import { useUser } from '@/store'
import { ComponentRef, useRef, useState } from 'react'
import CreateGroupForm from './create-group-form'
import { JoinGroupContentModal } from './join-group-content'

const CreateGroup = () => {
  const createGroup = useModal({
    content: (
      <CreateGroupForm
        onSuccess={() => {
          createGroup.modal.close()
        }}
        onReCreate={data => {
          reCreateModal.modal.open()
          setCurRecord(data)
        }}
      />
    ),
    footer: null,
    className: 'w-[720px]',
    onOpen: () => {},
    title: '创建社群',
    closeIcon: true
  })
  const [curRecord, setCurRecord] = useState<CreateGroupRecord | null>(null)
  const { user } = useUser()
  const reCreateModal = useModal({
    content: (
      <CreateGroupForm
        onSuccess={() => {
          reCreateModal.modal.close()
          createGroup.modal.close()
        }}
        editMode
        initData={curRecord}
      />
    ),
    className: 'w-[720px]',
    title: '重新申请',
    closeIcon: true,
    footer: null
  })

  const joinGroup = useRef<ComponentRef<typeof JoinGroupContentModal>>(null)

  // const joinGroup = useModal({
  //   content: (
  //     <JoinGroupContent
  //       onSuccess={() => {
  //         joinGroup.modal.close()
  //       }}
  //     />
  //   ),
  //   footer: null,
  //   className: 'w-[800px]',
  //   onOpen: () => { },
  //   title: '加入群组',
  //   closeIcon: true
  // })

  const [open, setOpen] = useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className="bg-accent rounded inline-block w-6 h-6 flex-shrink-0 leading-6 text-center text-tertiary ml-1 cursor-pointer">
            <JknIcon.Svg
              name="plus"
              size={12}
              onClick={() => {
                setOpen(!open)
              }}
            />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {user?.user_type !== '0' && (
            <DropdownMenuItem
              onClick={() => {
                createGroup.modal.open()
                setOpen(false)
              }}
            >
              创建社群
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => joinGroup.current?.open()}>加入社群</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {createGroup.context}
      {reCreateModal.context}
      <JoinGroupContentModal ref={joinGroup} onSuccess={() => {}} />
      {/* {joinGroup.context} */}
    </>
  )
}

export default CreateGroup
