import LargeCap from "./large-cap"

const DashBoardPage = () => {
  return (
    <div className="grid grid-cols-3 grid-rows-2 h-full w-full">
      <div>
        <LargeCap />
      </div>
      <div className="col-span-2"></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
}

export default DashBoardPage