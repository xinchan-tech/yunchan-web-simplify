import { cn } from "@/utils/style";
import { useGroupChatShortStore } from "@/store/group-chat-new";
import { useShallow } from "zustand/react/shallow";
import { useEffect } from "react";

function userIdToColor(userId: string) {
  // 步骤1：生成哈希值（基于djb2算法优化）
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) + hash + userId.charCodeAt(i); // 等效 hash * 33 + charCode
  }

  // 步骤2：将哈希值转换为颜色分量
  const r = (hash & 0xff0000) >> 16; // 取高位字节作为红色
  const g = (hash & 0x00ff00) >> 8; // 取中间字节作为绿色
  const b = hash & 0x0000ff; // 取低位字节作为蓝色

  // 步骤3：格式化为十六进制字符串
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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

  const { avatarColorMap, setAvatarColorMap } = useGroupChatShortStore(
    useShallow((state) => ({
      avatarColorMap: state.avatarColorMap,
      setAvatarColorMap: state.setAvatarColorMap,
    }))
  );

  useEffect(() => {
    if (data && data.uid) {
      if (!avatarColorMap.has(data.uid)) {
        avatarColorMap.set(data.uid, userIdToColor(data.uid));

        setAvatarColorMap(avatarColorMap);
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
          className={cn(
            "flex justify-center items-center",
            size === "sm" ? "text-sm" : "text-lg font-semibold"
          )}
          style={{
            borderRadius: radius,
            backgroundColor: avatarColorMap.get(data.uid),
          }}
        >
          {data?.name && data?.name.length > 0 && data.name[0].toUpperCase()}
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
