import type { getMallProducts } from '@/api'
import React from 'react'
import { CheckIcon, CloseIcon } from './components/mall-icon'

interface IntroPageProps {
  intro: Awaited<ReturnType<typeof getMallProducts>>['intro']
}

/**
 * 方案介绍页面组件
 * @param props 组件属性
 * @param props.intro 方案介绍数据
 */
export const IntroPage = (props: IntroPageProps) => {
  // 获取表格列数（标题列 + 每个方案一列）
  const columnCount = props.intro[0]?.items[0]?.auths.length + 1 || 2

  return (
    <>
      <div className="w-[1150px] mb-12">
        <div
          className="grid text-[#808080] font-pingfang"
          style={{
            gridTemplateColumns: `minmax(240px, 1fr) repeat(${columnCount - 1}, 180px)`,
            gap: '20px'
          }}
        >
          {/* 遍历每个分类 */}
          {props.intro.map((category, cate_index) => (
            <React.Fragment key={category.id}>
              {/* 分类标题行 */}
              {category.title !== ' ' && (
                <div className="col-span-full rounded-sm my-5 bg-[#1B1B1B] text-[#DBDBDB] font-bold font-pingfang py-[14px] px-[10px]">
                  {category.title}
                </div>
              )}

              {/* 分类下的每个项目 */}
              {category.items.map(item => (
                <React.Fragment key={item.title}>
                  <div className="contents group">
                    {cate_index === 0 ? (
                      <div className="h-10 text-[28px] text-[#DBDBDB] font-bold font-pingfang flex items-center">
                        方案比较
                      </div>
                    ) : (
                      // 项目名称
                      <div className="h-[25px] text-[18px] group-hover:text-[#DBDBDB] transition-colors">
                        {item.title}
                      </div>
                    )}

                    {/* 项目在各方案中的支持情况 */}
                    {item.auths.map((auth, index) => (
                      <div
                        key={index}
                        className={`${cate_index === 0 ? 'h-10 text-[18px] text-[#DBDBDB] font-bold' : 'h-[25px] text-[18px] group-hover:text-[#DBDBDB]'} flex items-center justify-center transition-colors`}
                      >
                        {cate_index === 0 ? (
                          <span>{auth}</span>
                        ) : (
                          <>
                            {auth === 'yes' ? (
                              <CheckIcon color="#22AB94" />
                            ) : auth === 'no' ? (
                              <CloseIcon color="#666666" />
                            ) : (
                              <span>{auth}</span>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  )
}

export default IntroPage
