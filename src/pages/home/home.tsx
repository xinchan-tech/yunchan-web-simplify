import Home2 from '@/assets/home/home-2.png'
import StockKing from '@/assets/home/stock-king.jpg'
import { JknIcon } from '@/components'
import { Link } from 'react-router'

const Home = () => {
  return (
    <div className="">
      <div className="my-24 home-content-w-1 mx-auto flex space-x-12 items-center w-full justify-around">
        <div className="px-12">
          <div className="text-[48px] font-bold ">
            No Trading <br />
            只有趋势图，3秒锁定趋势
          </div>
          <Link to="/app/stock?symbol=QQQ" className="linear-gradient-1 w-[160px] h-[56px] rounded-[300px] text-xl text-white flex items-center justify-center mt-10 cursor-pointer">
            开始使用
          </Link>
        </div>
        <div>
          <img src={StockKing} alt="" className="h-[860px]" />
        </div>
      </div>
      <div className="mx-auto home-section-bg-1 py-24">
        <div className="home-content-w-1 mx-auto">
          <img src={Home2} alt="ios-download" className="size-full" />
        </div>
      </div>
      <div className="home-section-bg-2 pb-32 home-qa font-light">
        <div className="max-w-[1000px] mx-auto px-12 box-border space-y-12">
          <p className="mb-24 text-center text-[44px] ">常见问题</p>
          <details className="text-2xl border-0 border-b border-solid border-[#575757] pb-10">
            <summary className="text-[28px] font-bold">TodayChart 提供什么服务</summary>
            <div className="text-xl mt-10 ">
              <div className="font-light">
                <span>TodayChart ，专注美股图表，Ai轻量化级别。</span>
                <br />
                <span>我们NO Trading ！只有趋势图 ！15秒轻松锁定牛熊股✨</span>
              </div>

              <div className="my-5 flex items-center">
                <JknIcon name="huojian" className="size-[28px]" />
                &nbsp;<span className="gradient-text text-2xl">核心功能</span>
              </div>

              <div className="flex mb-2 space-x-5 ">
                <div className="flex items-center">
                  <div className="rounded-[5px] w-[18px] h-[18px] bg-[#028934] border border-solid border-[#83C877] text-center  box-border mr-1">
                    <JknIcon.Svg name="check" size={10} className="mb-2" />
                  </div>
                  AI闪电预警
                </div>
                <div className="flex items-center">
                  <div className="rounded-[5px] w-[18px] h-[18px] bg-[#028934] border border-solid border-[#83C877] text-center  box-border mr-1">
                    <JknIcon.Svg name="check" size={10} className="mb-2" />
                  </div>
                  超级选股神器
                </div>
                <div className="flex items-center">
                  <div className="rounded-[5px] w-[18px] h-[18px] bg-[#028934] border border-solid border-[#83C877] text-center  box-border mr-1">
                    <JknIcon.Svg name="check" size={10} className="mb-2" />
                  </div>
                  策略回测
                </div>
                <div className="flex items-center">
                  <div className="rounded-[5px] w-[18px] h-[18px] bg-[#028934] border border-solid border-[#83C877] text-center  box-border mr-1">
                    <JknIcon.Svg name="check" size={10} className="mb-2" />
                  </div>
                  聊天社群
                </div>
                <div className="flex items-center">
                  <div className="rounded-[5px] w-[18px] h-[18px] bg-[#028934] border border-solid border-[#83C877] text-center  box-border mr-1">
                    <JknIcon.Svg name="check" size={10} className="mb-2" />
                  </div>
                  特色算法指标
                </div>
              </div>
              <div className="flex mb-2 space-x-5">
                <div className="flex items-center">
                  <div className="rounded-[5px] w-[18px] h-[18px] bg-[#028934] border border-solid border-[#83C877] text-center  box-border mr-1">
                    <JknIcon.Svg name="check" size={10} className="mb-2" />
                  </div>
                  Ai热门推送
                </div>
                <div className="flex items-center">
                  <div className="rounded-[5px] w-[18px] h-[18px] bg-[#028934] border border-solid border-[#83C877] text-center  box-border mr-1">
                    <JknIcon.Svg name="check" size={10} className="mb-2" />
                  </div>
                  24h特色榜单
                </div>
                <div className="flex items-center">
                  <div className="rounded-[5px] w-[18px] h-[18px] bg-[#028934] border border-solid border-[#83C877] text-center  box-border mr-1">
                    <JknIcon.Svg name="check" size={10} className="mb-2" />
                  </div>
                  叠加功能
                </div>
                <div className="flex items-center">
                  <div className="rounded-[5px] w-[18px] h-[18px] bg-[#028934] border border-solid border-[#83C877] text-center  box-border mr-1">
                    <JknIcon.Svg name="check" size={10} className="mb-2" />
                  </div>
                  PK功能
                </div>
                <div className="flex items-center">
                  <div className="rounded-[5px] w-[18px] h-[18px] bg-[#028934] border border-solid border-[#83C877] text-center  box-border mr-1">
                    <JknIcon.Svg name="check" size={10} className="mb-2" />
                  </div>
                  云存储等
                </div>
              </div>
            </div>
          </details>
          <details className="text-2xl border-0 border-b border-solid border-[#575757] pb-10">
            <summary className="text-[28px] font-bold">软件遇到问题，怎么快速解决？</summary>
            <div className="text-xl mt-10 ">
              <div className="font-light">
                <span>别慌！</span>
                <br />
                <span>
                  打开“群聊”页面，点击 <span className="text-primary">“技术客服”</span>{' '}
                  直接提交反馈。我们会及时给您解决。
                </span>
              </div>
            </div>
          </details>
          <details className="text-2xl border-0 border-b border-solid border-[#575757] pb-10">
            <summary className="text-[28px] font-bold">讨论社群是什么？</summary>
            <div className="text-xl mt-10 ">
              <div className="font-light">
                <span>软件“群聊”功能 。</span>
                <br />
                <div className="mt-5 mb-2 font-bold">
                  <JknIcon name="trumpet" />
                  &nbsp;<span>核心精神</span>
                </div>
                <span>交换一个苹果，各得一个苹果；交换一个观点，解锁双倍灵感！</span>

                <div className="mt-5 mb-2 font-bold">功能特点</div>
                <span>
                  用户可以在里面，自由讨论，交流观点、共享策略。
                  <br />
                  新手也可以与高手一起征战华尔街，躺着学技术，躺着听策略，新手也能逆袭。
                </span>
              </div>
            </div>
          </details>
          <details className="text-2xl border-0 border-b border-solid border-[#575757] pb-10">
            <summary className="text-[28px] font-bold">分享佣金计划！</summary>
            <div className="text-xl mt-10 ">
              <div className="font-light">
                <div className="mt-5 mb-2 font-bold">
                  <JknIcon name="money" />
                  &nbsp;<span>【推荐有礼 | TodayChart 分享佣金计划】</span>
                </div>
                <span>躺着赚美元的机会来了！</span>

                <div className="mt-5 mb-2 font-bold">
                  <JknIcon name="fire-2" />
                  &nbsp;<span>【奖励规则】</span>
                </div>

                <span>推荐 1 位新用户订阅 → 白拿 20% 订阅金额积分！</span>
                <br />
                <span>积分 = 现金！可兑换软件会员 / 抵扣现金 / 解锁高级功能</span>

                <div className="mt-5 mb-2 font-bold">
                  <span>
                    点击
                    <Link to="/user/invite" className="underline !decoration-primary !text-primary">
                      「我的分享链接」
                    </Link>
                    →「推荐好友」
                  </span>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
      <style jsx>
        {`
          .gradient-text {
            background: linear-gradient(to right, #A31AFF, #03E6FF);
            -webkit-background-clip: text;
            color: transparent;
          }


          `}
      </style>
    </div>
  )
}

export default Home
