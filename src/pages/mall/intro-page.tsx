import type { getMallProducts } from '@/api'
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons'
import React from 'react'

interface IntroPageProps {
  intro: Awaited<ReturnType<typeof getMallProducts>>['intro']
}

/**
 * 自定义勾选图标组件
 * @param props 组件属性
 * @param props.color 图标颜色，默认为 #C0B8AA
 * @param props.className 自定义类名
 */
const CheckIcon = ({ color = "#C0B8AA", className = "" }: { color?: string, className?: string }) => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M15.2526 6.47432L8.99481 12.7322L4.99998 8.73732" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

/**
 * 自定义关闭图标组件
 * @param props 组件属性
 * @param props.color 图标颜色，默认为 #C0B8AA
 * @param props.className 自定义类名
 */
const CloseIcon = ({ color = "#C0B8AA", className = "" }: { color?: string, className?: string }) => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M6 14.4854L14.4853 6.00007" stroke={color} strokeLinecap="round"/>
      <path d="M6 6L14.4853 14.4853" stroke={color} strokeLinecap="round"/>
    </svg>
  );
};

/**
 * 方案介绍页面组件
 * @param props 组件属性
 * @param props.intro 方案介绍数据
 */
export const IntroPage = (props: IntroPageProps) => {
  // 获取表格列数（标题列 + 每个方案一列）
  const columnCount = props.intro[0]?.items[0]?.auths.length + 1 || 2;
  
  return (
    <>
      <div className='w-[1150px] mb-12'>
        <div className="grid text-[#808080] pingfang-font" style={{ 
          gridTemplateColumns: `minmax(240px, 1fr) repeat(${columnCount - 1}, 180px)`,
          gap: '20px'
        }}>
          {/* 遍历每个分类 */}
          {props.intro.map((category, cate_index) => (
            <React.Fragment key={category.id}>
              {/* 分类标题行 */}
              {category.title !== ' ' && (
                <div className="col-span-full rounded-sm my-5 bg-[#1B1B1B] text-[#DBDBDB] font-bold pingfang-font py-[14px] px-[10px]">
                  {category.title}
                </div>
              )}
              
              {/* 分类下的每个项目 */}
              {category.items.map((item, item_index) => (
                <React.Fragment key={item.title}>
                  <div className="contents group">
                    {cate_index === 0 ? (
                      <div className="h-10 text-[28px] text-[#DBDBDB] font-bold pingfang-font flex items-center">
                        方案比较
                      </div>
                    ): (
                      // 项目名称
                      <div className="h-[25px] text-[18px] group-hover:text-[#DBDBDB] transition-colors">{item.title}</div>
                    )}

                    {/* 项目在各方案中的支持情况 */}
                    {item.auths.map((auth, index) => (
                      <div key={index} className={`${cate_index === 0 ? 'h-10 text-[18px] text-[#DBDBDB] font-bold' : 'h-[25px] text-[18px] group-hover:text-[#DBDBDB]'} flex items-center justify-center transition-colors`}>
                        {cate_index === 0 ? (
                          <span>{auth}</span>
                        ) : (
                          <>
                            {auth === 'yes' ? (
                              <CheckIcon color='#22AB94' />
                            ) : auth === 'no' ? (
                              <CloseIcon color='#666666' />
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
      
      <style jsx>
      {`
        /* 导入 Heebo 字体 */
        @import url("https://fonts.googleapis.com/css2?family=Heebo:wght@700&display=swap");

        /* 平方字体 */
        .pingfang-font {
          font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
        }
      `}
    </style>
  </>
  )
}

export default IntroPage
