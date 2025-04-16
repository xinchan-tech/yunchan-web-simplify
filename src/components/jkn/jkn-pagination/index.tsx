import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { DropdownMenu } from '@radix-ui/react-dropdown-menu'
import { useMemo } from 'react'
import { JknIcon } from '../jkn-icon'

interface JknPaginationProps {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizes?: number[]
}

const SHOW_MAX_PAGE = 5

export const JknPagination = (props: JknPaginationProps) => {
  const { total, page, pageSize, onPageChange, onPageSizeChange, pageSizes = [30, 50, 100, 200] } = props

  const totalPage = useMemo(() => Math.ceil(total / pageSize), [total, pageSize])

  const onClickPage = (p: number) => {
    if (p < 1 || p > totalPage) return

    if (p === page) return

    onPageChange(p)
  }

  const renderStart = () => {
    if (totalPage <= SHOW_MAX_PAGE || page < SHOW_MAX_PAGE - 1) {
      return (
        <PaginationItem>
          <PaginationLink isActive={page === 1} onClick={() => onClickPage(1)}>
            1
          </PaginationLink>
        </PaginationItem>
      )
    }

    return (
      <>
        <PaginationItem>
          <PaginationLink isActive={page === 1} onClick={() => onClickPage(1)}>
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
      </>
    )
  }

  const renderCenter = () => {
    if (totalPage < SHOW_MAX_PAGE || page < SHOW_MAX_PAGE - 1) {
      return (
        <>
          {Array.from({ length: SHOW_MAX_PAGE - 2 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <PaginationItem key={i}>
              <PaginationLink isActive={page === i + 2} onClick={() => onClickPage(i + 2)}>
                {i + 2}
              </PaginationLink>
            </PaginationItem>
          ))}
        </>
      )
    }

    if (page < totalPage - SHOW_MAX_PAGE + 2) {
      return (
        <>
          {Array.from({ length: SHOW_MAX_PAGE - 2 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <PaginationItem key={i}>
              <PaginationLink isActive={page === page + i - 1} onClick={() => onClickPage(page + i - 1)}>
                {page + i - 1}
              </PaginationLink>
            </PaginationItem>
          ))}
        </>
      )
    }

    return (
      <>
        {Array.from({ length: SHOW_MAX_PAGE - 1 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <PaginationItem key={i}>
            <PaginationLink
              isActive={page === totalPage - SHOW_MAX_PAGE + i + 1}
              onClick={() => onClickPage(totalPage - SHOW_MAX_PAGE + i + 1)}
            >
              {totalPage - SHOW_MAX_PAGE + i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
      </>
    )
  }

  const renderEnd = () => {
    if (totalPage <= SHOW_MAX_PAGE || page > totalPage - SHOW_MAX_PAGE + 1) {
      return (
        <PaginationItem>
          <PaginationLink isActive={page === totalPage} onClick={() => onClickPage(totalPage)}>
            {totalPage}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return (
      <>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink isActive={page === totalPage} onClick={() => onClickPage(totalPage)}>
            {totalPage}
          </PaginationLink>
        </PaginationItem>
      </>
    )
  }

  return (
    <Pagination className="text-foreground">
      <div className="flex items-center">
        <span>每页显示</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="min-w-[82px] ml-2.5 text-center bg-accent rounded-[300px] leading-8 cursor-pointer">
              {pageSize}&nbsp;
              <JknIcon.Svg name="arrow-down" size={12} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {pageSizes.map(size => (
              <DropdownMenuItem data-checked={size === pageSize} key={size} onClick={() => onPageSizeChange(size)}>
                {size}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => onClickPage(page - 1)} />
        </PaginationItem>
        {total === 0 ? (
          <PaginationItem>
            <PaginationLink>0</PaginationLink>
          </PaginationItem>
        ) : (
          <>
            {renderStart()}
            {renderCenter()}
            {renderEnd()}
          </>
        )}
        <PaginationItem>
          <PaginationNext onClick={() => onClickPage(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
