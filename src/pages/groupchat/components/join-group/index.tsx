import { joinGroupService } from "@/api";
import { GroupData } from "../../group-channel";
import ChatAvatar from "../chat-avatar";
import { Button } from "@/components";
import { useGroupChatShortStore } from "@/store/group-chat-new";
import { cn } from "@/utils/style";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import WKSDK from "wukongimjssdk";
import { useToast } from "@/hooks";

const JoinGroup = (props: { data: GroupData }) => {
  const { data } = props;
  const {toast} = useToast()
  const renderTags = () => {
    let tags: string[] = [];
    if (data.tags) {
      tags = data.tags.split(/[,、]/);
    }

    return tags.map((tag, idx) => {
      return (
        <div
          key={`${tag}${idx}`}
          className="group-tag mr-2 h-5 leading-5 pl-[6px] pr-[6px] rounded-sm"
        >
          {tag}
          <style jsx>{`
            .group-tag {
              background-color: rgb(40, 41, 46);
              color: rgb(165, 165, 165);
              font-size: 14px;
            }
          `}</style>
        </div>
      );
    });
  };
  const { groupDetailData, setReadyToJoinGroup } = useGroupChatShortStore(
    useShallow((state) => ({
      groupDetailData: state.groupDetailData,
      setReadyToJoinGroup: state.setReadyToJoinGroup
    }))
  );



  const [joinIng, setJoinIng] = useState(false);

  const handleJoinGroup = async () => {
    if (data.account) {
      try {
        let resp;

        setJoinIng(true);
        if (selectedProdSn) {
          resp = await joinGroupService(data.account, {
            product_sn: selectedProdSn,
          });
        } else {
          resp = await joinGroupService(data.account);
        }
        if(resp === true) {
            setReadyToJoinGroup(null);
            WKSDK.shared().config.provider.syncConversationsCallback();
            toast({ description:  '加群成功' })
        } else {
            toast({ description: resp?.msg  || '加群失败' })
        }
        setJoinIng(false);
      } catch (er) {
        console.error(er);
        toast({ description: er?.message  || '加群失败' })
        setJoinIng(false);
      }
    }
  };

  const [selectedProdSn, setSelectedProdSn] = useState("");

  useEffect(() => {
    if (
      groupDetailData &&
      groupDetailData.products instanceof Array &&
      groupDetailData.products.length > 0
    ) {
      setSelectedProdSn(groupDetailData.products[0].product_sn);
    }
  }, [groupDetailData]);

  return (
    <div className="join-group-panel">
      <div className="join-group-content">
        <div className="flex items-center justify-between mb-10">
          <div className="flex ">
            <ChatAvatar
              data={{
                avatar: data.avatar,
                name: data.name,
                uid: data.account,
              }}
              radius="16px"
              className="w-16 h-16"
            />
            <div className="ml-[20px]">
              <div className="text-xl font-bold text-white mb-4">
                {data.name || ""}
              </div>
              <div className="flex">{renderTags()}</div>
            </div>
          </div>
          <Button
            loading={joinIng}
            onClick={handleJoinGroup}
            className="w-[200px] h-[52px] leading-[52px] rounded-md text-lg font-bold"
          >
            加入群聊
          </Button>
        </div>
        <div className="group-info">{groupDetailData?.notice || ""}</div>
        <div className="prod-list flex justify-center">
          {groupDetailData?.products instanceof Array &&
            groupDetailData.products.length > 0 &&
            groupDetailData.products.map((prod) => {
              return (
                <div
                  key={prod.product_sn}
                  className={cn(
                    "prod-item",
                    selectedProdSn === prod.product_sn && "selected"
                  )}
                  onClick={() => {
                    setSelectedProdSn(prod.product_sn);
                  }}
                >
                  <div className="font-bold prod-name text-center">--</div>

                  <div className="text-center">
                    <span className="prod-price font-bold">$</span>
                    <span className="prod-price font-bold">{prod.price}</span>
                    <span className="prod-unit font-bold">/${prod.unit}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      <style jsx>
        {`
          .prod-list {
            margin-top: 60px;
            flex-shrink: 0;
          }
          .prod-name {
            font-size: 20px;
          }
          .prod-price {
            font-size: 30px;
          }
          .prod-unit {
            font-size: 18px;
          }
          .prod-item {
            padding-top: 30px;
            width: 160px;
            margin-right: 30px;
            background-color: rgb(43, 45, 49);
            height: 200px;
            border-radius: 8px;
            bpx-sizing: border-box;
            border: 5px solid rgb(43, 45, 49);
          }
          .prod-item.selected {
            border: 5px solid hsl(var(--primary));
          }
          .join-group-panel {
            padding: 40px 30px;
            height: 100%;
            box-sizing: border-box;
          }
          .join-group-content {
            background-color: rgb(59, 61, 68);
            height: 100%;
            border-radius: 12px;
            box-sizing: border-box;
            padding: 30px 60px;
          }
          .group-info {
            border: 1px solid rgb(66, 68, 103);
            padding: 20px;
            border-radius: 12px;
            font-size: 14px;
          }
        `}
      </style>
    </div>
  );
};

export default JoinGroup;
