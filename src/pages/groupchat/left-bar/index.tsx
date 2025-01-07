const GroupChatLeftBar = () => {
    return <div className="w-[68px] left-bar-cont">
        <div className="left-bar-item">
            头像
        </div>
        <div className="left-bar-item">
            群聊
        </div>
        <style jsx>
            {
                `
                    {
                        .left-bar-cont {
                            padding: 20px 10px;
                            width: 68px;
                            height: 100%;
                            background-color: rgb(30,32,34)
                        }
                        .left-bar-item {
                            width: 50px;
                            height: 50px;
                            border-radius: 8px;
                            margin-bottom: 14px;
                        }
                        
                    }
                `
            }
        </style>
    </div>
}

export default GroupChatLeftBar