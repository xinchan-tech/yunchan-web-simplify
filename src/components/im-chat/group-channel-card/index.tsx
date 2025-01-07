import type { GroupChannelItem } from "@/api";

function getRandomColor() {
  const r = Math.floor(50 + Math.random() * 100); //
  const g = Math.floor(50 + Math.random() * 100); //
  const b = Math.floor(50 + Math.random() * 100); //
  return `rgb(${r},${g},${b})`;
}

const GroupChannelCard = (props: { data: GroupChannelItem }) => {
  const { data } = props;
  return (
    <div className="flex justify-between mb-4">
      <div className="flex">
        <div className="avatar-box">
          {data.avatar ? (
            <img src={data.avatar} alt="群logo" />
          ) : (
            <div className="group-name-avatar">
              {data.name[0].toLocaleUpperCase()}
            </div>
          )}
        </div>
        <div className="group-info">
          <div className="mb-1">{data.name}</div>
          <div className="flex mb-1">
            <div className="group-tag">{data.total_user}</div>
            <div className="group-tag">{data.tags}</div>
          </div>
          <div className="group-desc">{data.brief}</div>
        </div>
      </div>
      <div className="group-price"></div>
      <style jsx>
        {`
          .group-price {
          }
          .avatar-box {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            overflow: hidden;
          }
          .avatar-box img {
            width: 60px;
            height: 60px;
          }
          .group-name-avatar {
            width: 60px;
            height: 60px;
            font-size: 40px;
            color: #fff;
            text-align: center;
            line-height: 60px;
            background-color: rgba(7, 140, 143);
          }
        `}
      </style>
    </div>
  );
};

export default GroupChannelCard;
