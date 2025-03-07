import type { getMallProducts } from '@/api'
import { JknIcon } from '@/components'

interface IntroPageProps {
  intro: Awaited<ReturnType<typeof getMallProducts>>['intro']
}

export const IntroPage = (props: IntroPageProps) => {
  return (
    <div>
      <p className="text-lg">方案比较</p>
      <div className="space-y-4 font-normal">
        {props.intro.map(i => (
          <div key={i.id}>
            {i.title !== ' ' ? <div className="text-lg p-2 rounded bg-background">{i.title}</div> : null}
            <div className="space-y-6 my-6">
              {i.items.map(item => (
                <div key={item.title} className="flex items-center">
                  <div className="text-sm w-64">{item.title}</div>
                  {item.auths.map((auth, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    <div key={index} className="flex items-center text-base">
                      <div className="w-48 text-center">
                        {auth === 'yes' || auth === 'no' ? (
                          <JknIcon.Checkbox
                            className="w-3.5 h-3.5"
                            checked={auth === 'yes'}
                            checkedIcon="ic_have"
                            uncheckedIcon="ic_delete"
                          />
                        ) : (
                          auth
                        )}
                      </div>
                      {/* <span>{auth}</span> */}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
