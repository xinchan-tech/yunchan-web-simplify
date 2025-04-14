import 'package:flutter/material.dart';
import 'package:flutter_smart_dialog/flutter_smart_dialog.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/user_info/account_info.dart';
import 'package:mgjkn/desktop/stock/text_live_widget.dart';
import 'package:mgjkn/extensions/extension_widget.dart';

import 'package:mgjkn/network/network.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/widgets/jktable.dart';
import 'package:mgjkn/widgets/widget.dart';

class OpinionWidget extends StatefulWidget {
  const OpinionWidget({super.key});

  @override
  State<OpinionWidget> createState() => _OpinionWidgetState();
}

class _OpinionWidgetState extends State<OpinionWidget> with SingleTickerProviderStateMixin {
  final _menuWidth = JKStyle.rightMenuWidth;
  final menuTitles = ["最热门", "我的关注", "我的观点"];
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
              isLoading = true;
              setState(() {});
              updateList(page: -1);
            }));

    var r = RotationTransition(
      turns: Tween(begin: 0.0, end: 1.0).animate(_animationController),
      child: JKButton("", image: "assets/images/refresh.png", height: 14, type: JKButtonType.selColor, onPressed: () {
        showCommentIndex = -1;
        _animationController.reset();
        _animationController.forward();
        _animationController.repeat();
        contentListMap[selectedTitleIndex] = [];
        contentListPage[selectedTitleIndex] = 0;
        isLoading = true;
        setState(() {});
        updateList(page: 0);
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
          content(contentListMap[selectedTitleIndex] ?? []),
        ],
      ),
    );
  }

  final scrollController = ScrollController();
  Widget content(List datas) {
    if (datas.isEmpty) {
      if (isLoading) {
        return const JKText("加载中...", center: true).padding(top: 50);
      } else {
        return const JKText("暂无数据", center: true).padding(top: 50);
      }
    }

    return Container(
      padding: const EdgeInsets.only(top: 5),
      height: MediaQuery.of(context).size.height - 90,
      width: _menuWidth,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          JKTable(
            scrollController: scrollController,
            data: datas,
            rowHeight: -1,
            cellBuilder: (context, item, index) {
              return [JKTableRow(cellView(item, index))];
            },
            headerHeight: 0,
            dividerColor: Colors.transparent,
            willScrollToBottom: () {
              updateList();
            },
            columns: const [JKTableColumn("")],
          ),
          JKButton(
            "发表观点",
            radius: 15,
            normalStyle: JKButtonStyle(bgColor: Colors.blue, fontColor: JKStyle.theme.white),
            width: 80,
            height: 30,
            onPressed: () async {
              if (UserInfo.shared.isLogin == false) {
                showToast("请先登录");
                return;
              }
              await showPageSheet(context, const OpinionEditorWidget(), width: 400, height: 550, title: "发表观点");
              updateList(page: 0);
            },
          ).padding(bottom: 10),
        ],
      ),
    );
  }

  Map<int, List> contentListMap = {};
  Map<int, int> contentListPage = {};

  updateList({int? page}) {
    var currentPage = page ?? contentListPage[selectedTitleIndex] ?? 0;

    if (currentPage == -1) {
      var l = contentListMap[selectedTitleIndex] ?? [];
      if (l.isNotEmpty) {
        return;
      }
      currentPage = 0;
    }

    if (currentPage == 0) {
      contentListMap[selectedTitleIndex] = [];
      contentListPage[selectedTitleIndex] = 0;
      isLoading = true;
      setState(() {});
    }

    var idx = selectedTitleIndex;
    network.opinions(idx.toString(), currentPage + 1).then((res) {
      if (res.success) {
        var li = res.json["data"]["items"];
        if (li.isNotEmpty) {
          var old = contentListMap[idx] ?? [];
          old.addAll(li);
          contentListMap[idx] = old;
          contentListPage[idx] = currentPage + 1;
          _animationController.stop();
          isLoading = false;
          setState(() {});
        }
      } else {
        showToast(res.message);
      }
    });
  }

  Widget cellView(Map item, int index) {
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
    if (isFcous) {
      fcousText = "已关注";
      fcousColor = JKButtonStyle(fontColor: Colors.grey.shade700, borderColor: Colors.grey.shade700);
    }

    return Container(
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
                      : JKImage(avatar, width: 26, height: 26, fit: BoxFit.fill),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      JKText(name, fontSize: 12, selectable: true),
                      JKText(Utils.formatDate(createTime), fontSize: 12, selectable: true),
                    ],
                  ).padding(left: 5)
                ],
              ),
              JKButton(fcousText, fontSize: 12, height: 20, normalStyle: fcousColor, onPressed: () {
                if (UserInfo.shared.isLogin == false) {
                  showToast("请先登录");
                  return;
                }

                item["is_care"] = isFcous ? false : true;
                setState(() {});

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
                    return JKImage(images[idx], width: (_menuWidth / 2) - 15, fit: BoxFit.fitWidth).board(all: 1);
                  }),
                ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: () {
                  if (UserInfo.shared.isLogin == false) {
                    showToast("请先登录");
                    return;
                  }
                  var lastPraiseStatus = contentListMap[selectedTitleIndex]?[index]["is_praise"];
                  var change = lastPraiseStatus ? -1 : 1;
                  var last = int.tryParse(contentListMap[selectedTitleIndex]?[index]["praise_count"]) ?? 0;
                  contentListMap[selectedTitleIndex]?[index]["praise_count"] = (last + change).toString();
                  contentListMap[selectedTitleIndex]?[index]["is_praise"] = !lastPraiseStatus;
                  setState(() {});
                  network.praiseComment(item["id"]);
                },
                child: Row(children: [
                  Image.asset(
                    "assets/images/ic_praise.png",
                    width: 16,
                    color: isPraise ? JKStyle.stockGreen : null,
                  ),
                  JKText(item["praise_count"],
                          color: isPraise ? JKStyle.stockGreen : const Color.fromRGBO(158, 158, 158, 1))
                      .padding(left: 2)
                ]),
              ),
              GestureDetector(
                onTap: () {
                  showCommentIndex = index;
                  commentList = [];
                  setState(() {});
                  getComments();
                },
                child: Row(children: [
                  Image.asset("assets/images/ic_comment.png", width: 16),
                  JKText(item["comment_count"]).padding(left: 2, right: 10)
                ]),
              ),
            ],
          ).padding(top: 10),
          showComment
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    TextField(
                      controller: commentController,
                      style: TextStyle(color: JKStyle.theme.textGreyColor2, fontSize: 12),
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        hintText: "留下您的评论，让我们一起掌握市场",
                        hintStyle: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                        enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey.shade800)),
                        focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey.shade800)),
                      ),
                      cursorColor: Colors.blue,
                      onChanged: (value) {
                        commentText = value;
                      },
                    ),
                    JKButton(
                      "发表评论",
                      width: 68,
                      height: 24,
                      fontSize: 12,
                      type: JKButtonType.bgColor,
                      onPressed: () async {
                        if (UserInfo.shared.isLogin == false) {
                          showToast("请先登录");
                          return;
                        }
                        var res = await network.saveComment(oid, commentText);
                        if (res.success) {
                          var last = int.tryParse(contentListMap[selectedTitleIndex]?[index]["comment_count"]) ?? 0;
                          contentListMap[selectedTitleIndex]?[index]["comment_count"] = (last + 1).toString();
                          commentController.text = "";
                          setState(() {});
                          getComments();
                        }
                      },
                    ).padding(top: 10, bottom: 10)
                  ],
                ).padding(right: 10, top: 10)
              : const SizedBox(),
          showComment ? commentListWidget() : const SizedBox(),
          // showComment ? Center(child: JKButton("查看更多评论...", fontSize: 11, onPressed: () {})) : const SizedBox(),
          JKDivider(color: Colors.grey.shade700).padding(top: 10)
        ],
      ),
    );
  }

  var commentList = [];
  void getComments() {
    var id = contentListMap[selectedTitleIndex]?[showCommentIndex]["id"];
    network.opinionComments(id, (res) {
      commentList = res.json["data"]["items"];
      setState(() {});
    });
  }

  Widget commentListWidget() {
    return SizedBox(
      height: commentList.isEmpty ? 10 : 200,
      child: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: List.generate(commentList.length, (index) {
              var item = commentList[index];
              var comment = item["content"];
              var time = item["create_time"];
              return SelectableText.rich(TextSpan(
                children: [
                  TextSpan(
                      text: item["user"]["username"] + "：", style: TextStyle(color: JKStyle.theme.white, fontSize: 12)),
                  TextSpan(text: comment, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  TextSpan(
                      text: "  ${Utils.formatDate(time)}", style: TextStyle(color: Colors.grey.shade800, fontSize: 12)),
                ],
              )).padding(bottom: 10);
            })),
      ),
    );
  }
}

class OpinionEditorWidget extends StatefulWidget {
  const OpinionEditorWidget({super.key, this.isTextLive = false});

  final bool isTextLive;

  @override
  State<OpinionEditorWidget> createState() => _OpinionEditorWidgetState();
}

class _OpinionEditorWidgetState extends State<OpinionEditorWidget> {
  var inputext = "";
  var selectedVisibaleIndex = 0;
  var visibaleRange = ["所有人", "关注我的", "仅自己"];

  List<String> imagePaths = [];

  @override
  Widget build(BuildContext context) {
    var imageWidgets = List.generate(
      imagePaths.length,
      (index) => ImageSelectorWidget(
        imagePaths[index],
        onRemove: () {
          imagePaths.removeAt(index);
          setState(() {});
        },
        onTap: () {
          showImageWindow(imagePaths[index]);
        },
      ),
    );
    if (imageWidgets.length < 6) {
      imageWidgets.add(ImageSelectorWidget(
        "assets/images/add.png",
        onTap: () async {
          var path = await Utils.pickImageFile();
          if (path.isNotEmpty) {
            imagePaths.add(path);
            setState(() {});
          }
        },
      ));
    }
    return Column(
      mainAxisAlignment: MainAxisAlignment.start,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 10),
        const JKText("文字"),
        const SizedBox(height: 10),
        Container(
          height: 100,
          width: 380,
          decoration:
              BoxDecoration(borderRadius: BorderRadius.circular(5), border: Border.all(color: Colors.grey.shade800)),
          padding: const EdgeInsets.only(left: 10, right: 10),
          child: TextField(
            decoration: InputDecoration(
                hintText: widget.isTextLive ? "在这里输入文字" : "在这里输入观点",
                border: InputBorder.none,
                hintStyle: TextStyle(color: Colors.grey.shade600)),
            style: TextStyle(color: JKStyle.theme.white),
            maxLines: null,
            onChanged: (t) {
              inputext = t;
            },
          ),
        ),
        const SizedBox(height: 10),
        const JKText("图片"),
        const SizedBox(height: 10),
        Container(
            width: 380,
            padding: const EdgeInsets.all(5),
            decoration:
                BoxDecoration(border: Border.all(color: Colors.grey.shade800), borderRadius: BorderRadius.circular(5)),
            child: Center(child: Wrap(spacing: 20, runSpacing: 10, children: imageWidgets))),
        const SizedBox(height: 25),
        Center(
            child: Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            const JKText("谁可以看：").padding(top: 1),
            JKDropDownButton(defaultTitle: "所有人", visibaleRange, selectedVisibaleIndex, tooltip: false, (index, value) {
              selectedVisibaleIndex = index;
              setState(() {});
            }),
            JKButton("确认发表", type: JKButtonType.bgColor, width: 80, height: 30, onPressed: () async {
              var urls = [];
              if (imagePaths.isNotEmpty) {
                var res = await Utils.uploadAliyun(imagePaths);
                if (res.isError) {
                  showToast(res.message);
                  return;
                }
                urls = res.json["data"];
              }

              ResultData res;
              if (widget.isTextLive) {
                res = await network.postTextLive(inputext, urls);
              } else {
                res = await network.saveOpinion(inputext, urls);
              }

              if (res.success) {
                showToast("发表成功", onDismiss: () {
                  SmartDialog.dismiss();
                });
              } else {
                showToast(res.message);
              }
            }).padding(left: 20, right: 20),
          ],
        )),
      ],
    ).padding(top: 5, left: 10);
  }
}

class ImageSelectorWidget extends StatefulWidget {
  final Function? onRemove;
  final Function? onTap;
  final String imageUrl;

  const ImageSelectorWidget(this.imageUrl, {this.onRemove, this.onTap, super.key});

  @override
  _ImageSelectorWidgetState createState() => _ImageSelectorWidgetState();
}

class _ImageSelectorWidgetState extends State<ImageSelectorWidget> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    Widget img = const SizedBox(
      width: 100,
      height: 100,
    );
    img = JKImage(widget.imageUrl, width: 100, height: 100, fit: BoxFit.fill).board(all: 1);

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: Stack(
        children: [
          GestureDetector(
            child: img,
            onTap: () {
              widget.onTap?.call();
            },
          ),
          if (_isHovered && widget.onRemove != null)
            Positioned(
              top: 0,
              right: 0,
              child: InkWell(
                onTap: () {
                  widget.onRemove?.call();
                },
                child: Image.asset("assets/images/close.png", width: 14, height: 14),
              ),
            ),
        ],
      ),
    );
  }
}

extension Op on Network {
  opinionComments(String id, Function(ResultData) onResult) async {
    cacheAndGet("/opinion/$id/comments", onResult: onResult);
  }

  Future<ResultData> fcousUser(String uid) async {
    return post("/user/$uid/care");
  }

  Future<ResultData> praiseComment(String oid) async {
    return post("/opinion/$oid/praise/save");
  }

  Future<ResultData> saveComment(String oid, String content) async {
    return post("/opinion/$oid/comment/save", data: {"content": content});
  }

  Future<ResultData> saveOpinion(String content, images) async {
    return post("/opinion/save", data: {"type": "0", "content": content, "urls[]": images});
  }
}
