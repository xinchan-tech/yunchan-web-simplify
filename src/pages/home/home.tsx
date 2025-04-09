import Home2 from '@/assets/home/home-2.png'

const Home = () => {
  return (
    <div className="">
      <div className="my-24 home-content-w-1 mx-auto">
        <div className="px-12">
          <div className="text-[48px] font-bold ">
            No Trading <br />
            只有趋势图，3秒锁定趋势
          </div>
          <div className="linear-gradient-1 w-[160px] h-[56px] rounded-[300px] text-xl text-white flex items-center justify-center mt-10 cursor-pointer">
            开始使用
          </div>
        </div>
      </div>
      <div className="mx-auto home-section-bg-1 py-24">
        <div className="home-content-w-1 mx-auto">
          <img src={Home2} alt="ios-download" className="size-full" />
        </div>
      </div>
      <div className="home-section-bg-2 pb-32">
        <div className="home-content-w-1 mx-auto px-12 box-border space-y-12">
          <p className="mb-24 text-center text-[44px]">常见问题</p>
          <details className="text-2xl border-0 border-b border-solid border-[#575757] pb-10">
            <summary>TodayChart 提供什么服务</summary>
            <p></p>
          </details>
          <details className="text-2xl border-0 border-b border-solid border-[#575757] pb-10">
            <summary>软件遇到问题，怎么快速解决？</summary>
            <p></p>
          </details>
          <details className="text-2xl border-0 border-b border-solid border-[#575757] pb-10">
            <summary>讨论社群是什么？</summary>
            <p></p>
          </details>
          <details className="text-2xl border-0 border-b border-solid border-[#575757] pb-10">
            <summary>分享佣金计划！</summary>
            <p></p>
          </details>
        </div>
      </div>
    </div>
  )
}

export default Home
