import { cn } from "@/utils/style";
import { useGroupChatShortStore } from "@/store/group-chat-new";
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from "react";

function getRandomRgbColor() {
  // 生成三个随机数，范围在 0 到 255 之间
  const r = 100 + Math.floor(Math.random() * 100);
  const g = 100 + Math.floor(Math.random() * 100);
  const b = 100 + Math.floor(Math.random() * 155);
  const rgbColor = `rgb(${r}, ${g}, ${b})`;
  return rgbColor;
}

const ChatAvatar = (props: {
  data: {
    name: string;
    avatar: string;
    uid: string;
  };
  className?: string;
  radius?: string;
  size?: "sm" | "lg";
}) => {
  const { data, className, radius = "50%", size } = props;
  
  const { avatarColorMap, setAvatarColorMap } = useGroupChatShortStore(useShallow(state => ({
    avatarColorMap: state.avatarColorMap,
    setAvatarColorMap: state.setAvatarColorMap
  })));

  useEffect(() => {
    if (data && data.uid) {
      if (!avatarColorMap.has(data.uid)) {
        avatarColorMap.set(data.uid, getRandomRgbColor());

        setAvatarColorMap(avatarColorMap)
      }
    }
  }, [data]);

  return (
    <div
      className={cn(
        "chat-avatar",
        size === "sm" ? "w-5 h-5" : "w-10 h-10",
        className
      )}
    >
      {data.avatar ? (
        <img src={data.avatar} style={{ borderRadius: radius }} />
      ) : (
        <div
          className={cn("flex justify-center items-center", size === "sm" ? 'text-sm' : 'text-lg font-semibold')}
          style={{ borderRadius: radius, backgroundColor: avatarColorMap.get(data.uid) }}

        >
          {data?.name && data?.name.length >0 &&  data.name[0].toUpperCase()}
        </div>
      )}

      <style jsx>
        {`
          .chat-avatar div,
          .chat-avatar img {
            width: 100%;
            height: 100%;
          }
        `}
      </style>
    </div>
  );
};

export default ChatAvatar;
