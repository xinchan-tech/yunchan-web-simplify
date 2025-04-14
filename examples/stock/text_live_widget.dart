import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/user_info/account_info.dart';
import 'package:mgjkn/desktop/stock/opinion_widget.dart';
import 'package:mgjkn/extensions/extension_widget.dart';

import 'package:mgjkn/network/network.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/widgets/jktable.dart';
import 'package:mgjkn/widgets/widget.dart';

class TextLiveWidget extends StatefulWidget {
  const TextLiveWidget({super.key});

  @override
  State<TextLiveWidget> createState() => _TextLiveWidgetState();
}

class _TextLiveWidgetState extends State<TextLiveWidget> with SingleTickerProviderStateMixin {
  final _menuWidth = JKStyle.rightMenuWidth;
  final menuTitles = ["全部"];
  var selectedTitleIndex = 0;

  var showCommentIndex = -1;

  var commentText = "";
  var commentController = TextEditingController();

  late AnimationController _animationController;

  var isLoading = false;

  @override
  void initState() {
    _animationController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    )..repeat();
    isLoading = true;
    updateList();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    List<Widget> titles = List.generate(
        menuTitles.length,
        (index) => JKButton(menuTitles[index],
                isSelected: selectedTitleIndex == index,
                height: 20,
                fontSize: 12,
                type: JKButtonType.selColor, onPressed: () {
              selectedTitleIndex = index;
              contentList = [];
              isLoading = true;
              setState(() {});
              updateList();
            }));

    var r = RotationTransition(
      turns: Tween(begin: 0.0, end: 1.0).animate(_animationController),
      child: JKButton("", image: "assets/images/refresh.png", height: 14, type: JKButtonType.selColor, onPressed: () {
        showCommentIndex = -1;
        _animationController.reset();
        _animationController.forward();
        _animationController.repeat();
        contentList = [];
        isLoading = true;
        setState(() {});
        updateList(false);
      }),
    );
    titles.add(r);

    return Container(
      decoration: BoxDecoration(
        color: JKStyle.theme.bgColor,
        border: Border(
          left: BorderSide(
            color: Colors.grey.shade900, // 右边框颜色
            width: 1, // 右边框宽度
          ),
        ),
      ),
      width: _menuWidth,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.only(left: 4, right: 4),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.grey.shade900, width: 1)),
            ),
            height: 30,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: titles,
            ),
          ),
          content(contentList),
        ],
      ),
    );
  }

  Widget content(List datas) {
    if (datas.isEmpty) {
      if (isLoading) {
        return const JKText("加载中...", center: true).padding(top: 50);
      } else {
        return const JKText("暂无数据", center: true).padding(top: 50);
      }
    }

    var canSend = UserInfo.shared.isTeacher;

    return Container(
      padding: const EdgeInsets.only(top: 5),
      height: MediaQuery.of(context).size.height - 90,
      width: _menuWidth,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          JKTable(
              data: datas,
              columns: const [JKTableColumn("")],
              rowHeight: -1,
              headerHeight: 0,
              dividerColor: Colors.transparent,
              cellBuilder: (context, item, index) {
                var name = item["user"]["username"] ?? "---";
                var uid = item["user"]["id"] ?? "---";
                var avatar = item["user"]["avatar"];
                var isPraise = item["is_praise"];
                var isFcous = item["is_care"];
                var createTime = item["create_time"];
                var content = item["content"];
                var images = item["urls"] ?? [];
                var oid = item["id"];

                var showComment = showCommentIndex == index;

                var fcousText = "关注";
                var fcousColor = JKButtonStyle(fontColor: JKStyle.stockGreen, borderColor: JKStyle.stockGreen);
                // if (isFcous) {
                //   fcousText = "已关注";
                //   fcousColor = JKButtonStyle(fontColor: Colors.grey.shade700, borderColor: Colors.grey.shade700);
                // }

                return [
                  JKTableRow(Container(
                    padding: const EdgeInsets.only(left: 5, right: 0, top: 5, bottom: 5),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                avatar == null
                                    ? Image.asset("assets/images/login.png")
                                    : JKImage(avatar, width: 26, height: 26, fit: BoxFit.cover, clipOval: true)
                                        .board(all: 1, radius: 13),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    JKText(name, fontSize: 12, selectable: true),
                                    JKText(Utils.formatDate(createTime), fontSize: 12, selectable: true),
                                  ],
                                ).padding(left: 5)
                              ],
                            ),
                            JKButton(fcousText, fontSize: 12, normalStyle: fcousColor, onPressed: () {
                              network.fcousUser(uid);
                            }).padding(right: 5)
                          ],
                        ),
                        SelectableText(content, style: const TextStyle(fontSize: 12)).padding(top: 10, bottom: 10),
                        images.isEmpty
                            ? const SizedBox()
                            : Wrap(
                                spacing: 5,
                                runSpacing: 5,
                                children: List.generate(images.length, (idx) {
                                  return JKImage(images[idx], fit: BoxFit.cover)
                                      .board(all: 1, width: (_menuWidth / 2) - 15, height: (_menuWidth / 2) - 15);
                                }),
                              ).padding(left: 5),
                        JKDivider(color: Colors.grey.shade700).padding(top: 5)
                      ],
                    ),
                  ))
                ];
              }),
          canSend
              ? JKButton(
                  "发布图文直播",
                  radius: 15,
                  normalStyle: JKButtonStyle(bgColor: Colors.blue, fontColor: JKStyle.theme.white),
                  width: 120,
                  height: 30,
                  onPressed: () async {
                    await showPageSheet(context, const OpinionEditorWidget(isTextLive: true),
                        width: 400, height: 550, title: "发布图文直播");
                    updateList();
                  },
                ).padding(bottom: 10)
              : const SizedBox(),
        ],
      ),
    );
  }

  var contentList = [];
  updateList([bool cache = true]) {
    var idx = selectedTitleIndex;

    network.textLive((res) {
      if (res.success) {
        if (idx == selectedTitleIndex) {
          contentList = res.json["data"]["items"];
          _animationController.stop();
          isLoading = false;
          setState(() {});
        }
      } else {
        showToast(res.message);
      }
    });
  }
}

extension TextLiveExt on Network {
  textLive(Function(ResultData) onResult) async {
    cacheAndGet("/opinions", data: {"type": "1"}, onResult: onResult);
  }

  Future<ResultData> postTextLive(String content, images) async {
    return post("/opinion/save", data: {"type": "1", "content": content, "urls[]": images});
  }
}
