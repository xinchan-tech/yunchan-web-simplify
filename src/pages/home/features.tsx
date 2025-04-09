import Home3 from '@/assets/home/home-3.png'
import Home4 from '@/assets/home/home-4.png'
import Home5 from '@/assets/home/home-5.png'
import Home6 from '@/assets/home/home-6.png'
import Home7 from '@/assets/home/home-7.png'
import Home8 from '@/assets/home/home-8.png'
import Home9 from '@/assets/home/home-9.png'
import Home10 from '@/assets/home/home-10.png'
import { Button } from '@/components'
import { useNavigate } from 'react-router'

const FeaturesPage = () => {
  const navigate = useNavigate()
  return (
    <div className="pt-24">
      <div className="py-12" style={{ backgroundImage: 'var(--wp--preset--gradient--gradient-one)' }}>
        <img src={Home3} alt="home-3" className="w-[1000px] mx-auto block" />
      </div>
      <div className="py-12" style={{ backgroundImage: 'var(--wp--preset--gradient--gradient-ten)' }}>
        <img src={Home4} alt="home-4" className="home-content-w-1 mx-auto block" />
      </div>
      {/* <div className="py-12" style={{ backgroundImage: 'var(--wp--preset--gradient--gradient-fourteen)' }} >

      </div> */}
      <div className="py-24 space-y-12" style={{ backgroundImage: 'var(--wp--preset--gradient--gradient-six)' }}>
        <img src={Home5} alt="home-5" className="home-content-w-1 mx-auto block" />
        <img src={Home6} alt="home-6" className="home-content-w-1 mx-auto block" />
      </div>
      <div className="py-24" style={{ backgroundImage: 'var(--wp--preset--gradient--gradient-five)' }}>
        <img src={Home7} alt="home-7" className="home-content-w-1 mx-auto block" />
      </div>
      <div className="py-12 space-y-16" style={{ backgroundImage: 'var(--wp--preset--gradient--gradient-twentytwo)' }}>
        <img src={Home8} alt="home-8" className="home-content-w-1 mx-auto block" />
        <img src={Home9} alt="home-9" className="home-content-w-1 mx-auto block" />
        <img src={Home10} alt="home-10" className="home-content-w-1 mx-auto block" />
      </div>
      <div className="home-content-w-1 mx-auto text-center text-[56px] font-bold">
        <p>
          TodayChart：No Trading
          <br /> 只有趋势图，3秒锁定趋势机会
        </p>
        <Button
          onClick={() => navigate('/mall')}
          className="linear-gradient-1 w-[160px] h-[56px] rounded-[300px] text-xl text-white cursor-pointer"
        >
          立即加入
        </Button>
      </div>
      <div></div>
      {/* <div className="py-12">
        <img src={Home11} alt="home-11" className="home-content-w-1 mx-auto block" />
      </div> */}
    </div>
  )
}

export default FeaturesPage
