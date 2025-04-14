import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_smart_dialog/flutter_smart_dialog.dart';
import 'package:mgjkn/debug.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/settings_widget.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/desktop/stock/stock_update_manager.dart';
import 'package:mgjkn/desktop/user_info/account_info.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/panit/mini_kline_chart.dart';
import 'package:mgjkn/desktop/stock_pool_manager.dart';
import 'package:mgjkn/desktop/user_info/login_view.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/desktop/logger.dart';
import 'package:mgjkn/notification.dart';
import 'package:mgjkn/model/model.dart';
import 'package:mgjkn/network/network.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/widgets/jktable.dart';
import 'package:mgjkn/widgets/widget.dart';

class MainLeftMenuWidget extends StatefulWidget {
  const MainLeftMenuWidget({super.key});

  static get currentWidth {
    switch (Settings.leftMenuShowState) {
      case 1:
        return JKStyle.leftMenuWidth;
      case 2:
        return JKStyle.leftMenuWidth / 3 * 2;
    }
    return 0;
  }

  @override
  State<MainLeftMenuWidget> createState() => _MainLeftMenuWidgetState();
}

class _MainLeftMenuWidgetState extends State<MainLeftMenuWidget> {
  int leftMenuSelectedIndex = 0;
  final List<String> leftMenuTitles = ["股票金池", "报警列表", "触发报警"];
  int selectedPoolIndex = 0;
  int selectedAlarmIndex = 0;
  int selectedLogIndex = 0;
  String currentCode = "";

  late StreamSubscription<StockPoolUpdateEvent> eBusa;
  late StreamSubscription<ShowStockDetailEvent> eBusb;
  late StreamSubscription<StockPoolSelectedStockChangedEvent> eBusc;
  late Timer timer;
  @override
  void initState() {
    super.initState();
    eBusa = eventBus.on<StockPoolUpdateEvent>().listen((event) {
      setState(() {});
    });

    eBusb = eventBus.on<ShowStockDetailEvent>().listen((event) {
      currentCode = event.code;
      setState(() {});
    });

    eBusc = eventBus.on<StockPoolSelectedStockChangedEvent>().listen((event) {
      var poolStocks = StockPoolManager.shared.getPoolStockList(index: selectedPoolIndex, refresh: false);
      var chooseIndex = poolStocks.indexWhere((e) => e.code == currentCode);
      if (event.next) {
        chooseIndex += 1;
      } else if (event.prev) {
        chooseIndex -= 1;
      }
      var chooseItem = poolStocks.safeAt(chooseIndex);
      if (chooseItem != null) {
        onCellTap(chooseItem);
      }
    });

    Debug.marketRefreshMap["MainLeftMenu"] = () {
      updateData();
    };

    StockPoolManager.shared.updatePoolList();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (poolContentController.hasClients) {
        var poolStocks = StockPoolManager.shared.getPoolStockList(index: selectedPoolIndex, refresh: false);
        var index = poolStocks.indexWhere((element) => element.code == currentCode);
        var itemHeight = 60.0;
        RenderBox renderBox = context.findRenderObject() as RenderBox;
        double scrollOffset = index * itemHeight;

        // 计算已经显示的高度
        double visibleHeight = renderBox.size.height - 60;
        double totalHeight = itemHeight * poolStocks.length;
        double maxScrollExtent = totalHeight - visibleHeight;
        if (scrollOffset > maxScrollExtent) {
          scrollOffset = maxScrollExtent;
        }

        if (index > 0) {
          poolContentController.animateTo(
            scrollOffset, // 假设每个列表项高度为 56.0
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
          );
        }
      }
    });
  }

  @override
  void dispose() {
    eBusa.cancel();
    eBusb.cancel();
    eBusc.cancel();
    super.dispose();
    Debug.marketRefreshMap.remove("MainLeftMenu");
  }

  var createPoolName = "";

  @override
  Widget build(BuildContext context) {
    currentCode = KLineManager.shared.selectedChartController.stockCode;
    return Container(
      decoration: BoxDecoration(
        border: Border(
          right: BorderSide(color: JKStyle.theme.dividerColor),
        ),
      ),
      width: MainLeftMenuWidget.currentWidth,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Container(
          //   padding: const EdgeInsets.only(left: 4, right: 4),
          //   decoration: BoxDecoration(
          //     border: Border(bottom: BorderSide(color: Colors.grey.shade900, width: 1)),
          //   ),
          //   height: 30,
          //   child: Row(
          //     mainAxisAlignment: MainAxisAlignment.spaceAround,
          //     children: List.generate(leftMenuTitles.length, (index) {
          //       var btn = JKButton(leftMenuTitles[index],
          //           isSelected: leftMenuSelectedIndex == index,
          //           height: 20,
          //           // width: _menuWidth / leftMenuTitles.length - leftMenuTitles.length - 10,
          //           type: JKButtonType.selColor, onPressed: () {
          //         leftMenuSelectedIndex = index;
          //         updateData();
          //         setState(() {});
          //       });
          //       var num = 9;
          //       return (index == leftMenuTitles.length - 1) ? JKBadge(number: num, child: btn) : btn;
          //     }),
          //   ),
          // ),
          Expanded(child: getContent())
        ],
      ),
    );
  }

  Widget getContent() {
    switch (leftMenuSelectedIndex) {
      case 1:
        return alertContent();
      case 2:
        return alarmedLogs();
      default:
        return poolContent();
    }
  }

  void onCellTap(JKBaseStockItem item) {
    currentCode = item.code;
    KLineManager.shared.selectedChartController.setStockInfo(code: item.code, name: item.name);
    eventBus.fire(StockPoolSelecedEvent(StockInfo(code: item.code, name: item.name)));
    setState(() {});
  }

  Map<int, List> alarmDataMap = {};
  Map<int, List> alarmLogsMap = {};
  updateData() {
    switch (leftMenuSelectedIndex) {
      case 1:
        var idx = selectedAlarmIndex;
        // network.alarmAllList(selectedAlarmIndex).then((res) {
        //   if (res.isError) {
        //     return;
        //   }
        //   alarmDataMap[idx] = res.json["data"]["items"];
        //   setState(() {});
        // });
        return;
      case 2:
        var idx = selectedLogIndex;
        network.alarmAllLogs(selectedLogIndex).then((res) {
          if (res.isError) {
            return;
          }
          alarmLogsMap[idx] = res.json["data"]["items"];
          setState(() {});
        });
        return;
      default:
        var thumbs = Settings.leftMenuShowState == 1;
        StockPoolManager.shared.getPoolStockList(index: selectedPoolIndex, thumbs: thumbs, preAndAfter: true);
        return;
    }
  }

  var poolContentController = ScrollController();
  var selectedSortIndex = -1;
  // 股票金池
  Widget poolContent() {
    var poolStocks = StockPoolManager.shared.getPoolStockList(index: selectedPoolIndex, refresh: false);

    return Column(
      children: [
        UserInfo.shared.isLogin
            ? Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: MainLeftMenuWidget.currentWidth - 25,
                    child: Wrap(
                      runSpacing: 5,
                      alignment: WrapAlignment.start,
                      children: List.generate(StockPoolManager.shared.pools.length, (index) {
                        var item = StockPoolManager.shared.pools[index];
                        return JKButton("${item.name}(${item.total})",
                            fontSize: 12, noCenter: true, isSelected: selectedPoolIndex == index, onPressed: () {
                          selectedPoolIndex = index;
                          StockPoolManager.shared
                              .getPoolStockList(index: selectedPoolIndex, thumbs: true, preAndAfter: true);
                          setState(() {});
                        });
                      }),
                    ).padding(top: 5),
                  ),
                  JKButton(
                    "新建金池",
                    image: "assets/images/left_add.png",
                    tooltips: true,
                    type: JKButtonType.imageOnly,
                    width: 18,
                    onCtxPressed: (ctx) {
                      if (UserInfo.shared.isLogin == false) {
                        showToast("请先登录");
                        return;
                      }
                      createPoolName = "";
                      SmartDialog.showAttach(
                          targetContext: ctx,
                          builder: (_) {
                            return Column(
                              children: [
                                const JKText("新建金池").padding(top: 5),
                                SizedBox(
                                  height: 35,
                                  child: TextField(
                                    autofocus: true,
                                    decoration: const InputDecoration(
                                        hintText: "输入金池名称",
                                        border: UnderlineInputBorder(),
                                        hintStyle: TextStyle(color: Colors.grey, fontSize: 14)),
                                    style: const TextStyle(color: Colors.white, fontSize: 14),
                                    onChanged: (value) {
                                      var v = value.replaceAll("'", "");
                                      createPoolName = v;
                                      setState(() {});
                                    },
                                  ),
                                ).padding(left: 20, right: 20, bottom: 20),
                                JKButton("确定", width: 60, height: 26, onPressed: () {
                                  StockPoolManager.shared.createPool(createPoolName).then((res) {
                                    if (res.success) {
                                      showToast("创建成功");
                                      SmartDialog.dismiss();
                                    } else {
                                      showToast(res.message);
                                    }
                                  });
                                }, type: JKButtonType.bgColor)
                              ],
                            )
                                .board(width: 200, height: 130, bgColor: JKStyle.theme.bgColor, all: 1, radius: 4)
                                .padding(top: 10);
                          });
                    },
                  ).padding(top: 5, right: 5)
                ],
              )
            : const SizedBox(),
        JKDivider().padding(top: 4),
        Row(
          children: [
            const JKSortButton("名称", size: 12).padding(left: 5),
            SizedBox(width: Settings.leftMenuShowState == 1 ? 110 : 20),
            JKSortButton(
              "现价",
              size: 12,
              isSelected: selectedSortIndex == 0,
              onSort: (s) {
                selectedSortIndex = 0;
                poolStocks.sort((a, b) {
                  var ap = double.tryParse(a.stock.close) ?? 0;
                  var bp = double.tryParse(b.stock.close) ?? 0;
                  if (s == 1) {
                    return ap > bp ? 1 : -1;
                  }
                  return ap < bp ? 1 : -1;
                });
                setState(() {});
              },
            ),
            JKSortButton(
              "涨跌幅%",
              size: 12,
              isSelected: selectedSortIndex == 1,
              onSort: (s) {
                selectedSortIndex = 1;
                poolStocks.sort((a, b) {
                  var aInfo = Utils.getStockChanged(a.stock.lastClose, a.stock.close);
                  var bInfo = Utils.getStockChanged(b.stock.lastClose, b.stock.close);
                  var aa = aInfo.item2.replaceAll("%", "");
                  var bb = bInfo.item2.replaceAll("%", "");
                  var ap = double.tryParse(aa) ?? 0;
                  var bp = double.tryParse(bb) ?? 0;

                  if (s == 1) {
                    return ap > bp ? 1 : -1;
                  }
                  logger.d("$ap < $bp: ${ap < bp}");
                  return ap < bp ? 1 : -1;
                });
                setState(() {});
              },
            ),
          ],
        ).board(bottom: 1, color: JKStyle.theme.dividerColor),
        UserInfo.shared.isLogin
            ? Expanded(
                child: ScrollbarTheme(
                  data: ScrollbarThemeData(
                    thumbColor: MaterialStateProperty.all(JKStyle.theme.thumbColor),
                    radius: const Radius.circular(0),
                    mainAxisMargin: 0,
                    crossAxisMargin: 0,
                    thickness: MaterialStateProperty.all(6),
                  ),
                  child: Scrollbar(
                    controller: poolContentController,
                    thumbVisibility: true,
                    child: ListView.builder(
                      controller: poolContentController,
                      itemCount: poolStocks.length,
                      physics: const ClampingScrollPhysics(),
                      itemBuilder: (context, index) {
                        var item = poolStocks[index];
                        return GestureDetector(
                          onTapDown: (v) {
                            onCellTap(item);
                          },
                          child: JKHover(
                            child: StockFlashCell(
                              item: item,
                              isSelected: item.code == currentCode,
                              key: ValueKey(item.code),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              )
            : Column(
                children: [
                  JKText("尚未登录账号", color: Colors.grey.shade600).padding(top: 100, bottom: 10),
                  JKButton("登录账号", type: JKButtonType.boardSelColor, height: 26, onPressed: () {
                    showLoginView(context);
                  })
                ],
              ),
      ],
    );
  }

  // 报警列表
  Widget alertContent() {
    var titles = ["AI 报警", "全息报警", "画线报警"];
    return Column(children: [
      Container(
        decoration: BoxDecoration(
          color: JKStyle.theme.bgColor,
          border: Border(bottom: BorderSide(color: Colors.grey.shade900, width: 1)),
        ),
        height: 30,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(
              titles.length,
              (index) => JKBadge(
                  number: 0,
                  offset: 99 > 9 ? const Offset(0, -5) : const Offset(8, -5),
                  child: JKButton(titles[index], isSelected: selectedAlarmIndex == index, height: 24, onPressed: () {
                    selectedAlarmIndex = index;
                    updateData();
                    setState(() {});
                  }))),
        ),
      ),
      Container(
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: JKStyle.redTextColor, width: 1)),
        ),
        height: 30,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const JKText("名称", color: Colors.green).padding(left: 10),
            const JKText("周期", color: Colors.green).padding(left: selectedAlarmIndex == 0 ? 0 : 28),
            JKText(selectedAlarmIndex == 0 ? "类型" : "停止时间", color: Colors.green).padding(right: 10),
          ],
        ),
      ),
      Expanded(
        child: ListView.builder(
            itemCount: alarmDataMap[selectedAlarmIndex]?.length ?? 0,
            itemBuilder: (context, index) {
              var item = alarmDataMap[selectedAlarmIndex]![index];

              var conditions = [];
              conditions.addAll(item["condition"]["category_names"] ?? []);
              conditions.addAll(item["condition"]["user_indicators"] ?? []);

              return JKHover(
                  child: Stack(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          JKText(item["symbol"], color: Colors.white, fontSize: 16),
                          JKText(
                            item["name"] ?? "--",
                            color: const Color.fromARGB(255, 88, 88, 88),
                            overflow: TextOverflow.ellipsis,
                          ).board(width: MainLeftMenuWidget.currentWidth - 20)
                        ],
                      ).padding(left: 10),
                    ],
                  ),
                  Align(
                    child: JKText(JKStockTimeTypeExt.getFrom(item["stock_cycle"])?.rawValue.item2 ?? "--",
                            color: Colors.red)
                        .padding(bottom: 14),
                  ),
                  Positioned(
                      right: 0,
                      bottom: 22,
                      child: TooltipWidget(
                        offset: const Offset(80, -30),
                        tooltip: Container(
                          decoration: BoxDecoration(
                            color: JKStyle.theme.bgColor,
                            border: Border.all(color: Colors.grey.shade800),
                            borderRadius: const BorderRadius.all(Radius.circular(5)),
                          ),
                          width: 140,
                          height: conditions.length * 41.0 + 2,
                          child: ListView.builder(
                              itemCount: conditions.length,
                              itemBuilder: (ctx, idx) {
                                return Container(
                                  height: 40,
                                  // decoration: BoxDecoration(
                                  //     border: Border(bottom: BorderSide(color: Colors.grey.shade800))),
                                  child: JKText(conditions[idx], color: JKStyle.theme.textGreyColor2, center: true),
                                );
                              }),
                        ),
                        child: selectedAlarmIndex == 0
                            ? Row(
                                children: [
                                  JKText(conditions.safeAt(0) ?? "全息报警"),
                                  Image.asset("assets/images/arrow_right.png", width: 10, height: 10)
                                ],
                              )
                            : JKText(Utils.formatDate(item["expire_time"], format: "yyyy/MM/dd")).padding(bottom: 3),
                      ).padding(right: 10))
                ],
              ).board(height: 60));
            }),
      )
    ]);
  }

  var lastCreateTime = "";
  Widget alarmedLogs() {
    var titles = ["AI 报警", "全息报警", "画线报警"];
    return Column(children: [
      Container(
        decoration: BoxDecoration(
          color: JKStyle.theme.bgColor,
          border: Border(bottom: BorderSide(color: Colors.grey.shade900, width: 1)),
        ),
        height: 30,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(
              titles.length,
              (index) => JKBadge(
                  number: 0,
                  offset: 99 > 9 ? const Offset(0, -5) : const Offset(8, -5),
                  child: JKButton(titles[index], isSelected: selectedLogIndex == index, height: 24, onPressed: () {
                    selectedLogIndex = index;
                    updateData();
                    setState(() {});
                  }))),
        ),
      ),
      // Container(
      //   decoration: BoxDecoration(
      //     color: SkinManager.bgColor,
      //     border: Border(bottom: BorderSide(color: Colors.grey.shade900, width: 1)),
      //   ),
      //   height: 30,
      //   child: Row(
      //     mainAxisAlignment: MainAxisAlignment.spaceBetween,
      //     children: [
      //       JKText("名称", color: Colors.green).padding(left: 10),
      //       JKText("周期", color: Colors.green).padding(left: selectedLogIndex == 0 ? 0 : 28),
      //       JKText(selectedLogIndex == 0 ? "类型" : "停止时间", color: Colors.green).padding(right: 10),
      //     ],
      //   ),
      // ),
      Expanded(
        child: ListView.builder(
            itemCount: alarmLogsMap[selectedLogIndex]?.length ?? 0,
            itemBuilder: (context, index) {
              var item = alarmLogsMap[selectedLogIndex]![index];

              var conditions = [];
              conditions.addAll(item["condition"]["category_names"] ?? []);
              conditions.addAll(item["condition"]["user_indicators"] ?? []);
              conditions.addAll(item["condition"]["indicators"] ?? []);
              var isShowTime = lastCreateTime != item["create_time"];
              var isBull = item["condition"]["bull"] == "1";
              if (isShowTime) {
                lastCreateTime = item["create_time"];
              }
              return Column(
                children: [
                  isShowTime ? JKText(Utils.formatDate(item["create_time"])) : const SizedBox(),
                  Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          JKText(item["symbol"], color: JKStyle.theme.white),
                          JKText(JKStockTimeTypeExt.getFrom(item["stock_cycle"])?.rawValue.item2 ?? "--",
                              color: JKStyle.theme.white),
                          JKText("Todo"),
                          JKText("todo%"),
                        ],
                      ).padding(bottom: 5),
                      Wrap(
                        children: [
                          JKStyle.colorArrowImage(isBull ? "1" : "0", 16).padding(right: 10),
                          Wrap(
                            spacing: 10,
                            runSpacing: 2,
                            children: List.generate(conditions.length, (index) {
                              if (index == conditions.length - 1) return JKText(conditions[index]);
                              return JKText(conditions[index] + " / ");
                            }),
                          ).padding(left: 5, right: 5)
                        ],
                      )
                    ],
                  )
                      .board(bgColor: Colors.grey.shade900, radius: 4, paddigTop: 10, paddigbottom: 10)
                      .padding(left: 5, right: 5, top: 10, bottom: 10)
                ],
              );
            }),
      )
    ]);
  }
}

class StockFlashCell extends StatefulWidget {
  bool isSelected;
  JKBaseStockItem item;
  StockFlashCell({required this.item, this.isSelected = false, super.key});

  @override
  _StockFlashCellState createState() => _StockFlashCellState();
}

class _StockFlashCellState extends State<StockFlashCell> {
  var lastAddMinTime = "";
  var thumbs = [];
  var eBus;

  @override
  void initState() {
    thumbs = widget.item.extend.thumbs;
    super.initState();
    eventBus.on<StockPoolUpdateEvent>().listen((event) {
      thumbs = widget.item.extend.thumbs;
    });
  }

  Color bgColor = Colors.transparent;
  bool isFlashing = false;
  @override
  Widget build(BuildContext context) {
    LinearGradient? gradient =
        bgColor.value == 0 ? null : LinearGradient(colors: [bgColor.withAlpha(10), bgColor.withAlpha(50)]);

    return Stack(
      children: [
        Container(
          width: context.width,
          height: 60,
          decoration: BoxDecoration(gradient: gradient),
        ),
        Center(
          child: Container(
              decoration: BoxDecoration(
                color: widget.isSelected ? const Color.fromARGB(155, 48, 48, 48) : Colors.transparent,
              ),
              height: 60,
              child: StockDataTrackerWidget(
                stockCode: widget.item.code,
                stockName: widget.item.name,
                initMarketData: widget.item.stock,
                initPreMarketData: widget.item.extend.stockBefore,
                initPostMarketData: widget.item.extend.stockAfter,
                key: ValueKey(widget.item.code),
                builder: (ctx, pre, market, after, marketState) {
                  var firstData = market;
                  var secondData = [];

                  if (marketState.isMarket) {
                    secondData = pre;
                  } else if (marketState.isPreMarket) {
                    secondData = pre;
                  } else if (marketState.isPostMarket) {
                    secondData = after;
                  }

                  var firstInfo = Utils.getStockChanged(firstData.lastClose, firstData.close);
                  var secondInfo = Utils.getStockChanged(secondData.lastClose, secondData.close);

                  return Stack(
                    children: [
                      JKStockName(widget.item.code, widget.item.name,
                          nameColor: JKStyle.theme.textGreyColor3, showIcon: false),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              JKText(firstData.close.asFixed(3), color: firstInfo.item4, fontSize: 12)
                                  .padding(right: 5),
                              JKStockText(firstInfo.item2,
                                  bgColor: firstInfo.item3, fontSize: 12, width: 60, height: 20)
                            ],
                          ),
                          marketState.isMarket
                              ? const SizedBox()
                              : JKTooltip(
                                  message: "${marketState.name}价",
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      JKText(secondData.close.asFixed(3), color: Colors.grey.shade400, fontSize: 11)
                                          .padding(right: 5),
                                      JKText(secondInfo.item2, color: Colors.grey.shade400, fontSize: 11)
                                          .padding(right: 3)
                                    ],
                                  ).padding(top: 5)),
                        ],
                      ),
                      Settings.leftMenuShowState == 1
                          ? Padding(
                              padding: const EdgeInsets.only(left: 50),
                              child: SizedBox(
                                  height: 45,
                                  width: 90,
                                  child: thumbs.isEmpty
                                      ? const SizedBox()
                                      : CustomPaint(
                                          painter: MiniKlineChart(thumbs,
                                              klineOnly: true, lastClose: widget.item.stock.lastClose.toDouble()))),
                            )
                          : const SizedBox()
                    ],
                  ).board(paddigLeft: 5, paddigRight: 5);
                },
                onUpdate: (oldData, newData, marketState) {
                  if (marketState.isMarket) {
                    handleMaketThumbs(newData);
                    setupFlash(oldData, newData);
                  }
                },
              )),
        ),
      ],
    );
  }

  var lastUpdateTime = 0;
  handleMaketThumbs(List<dynamic> newData) {
    var insertMin = [
      "09:30",
      "09:40",
      "09:50",
      "10:00",
      "10:10",
      "10:20",
      "10:30",
      "10:40",
      "10:50",
      "11:00",
      "11:10",
      "11:20",
      "11:30",
      "11:40",
      "11:50",
      "12:00",
      "12:10",
      "12:20",
      "12:30",
      "12:40",
      "12:50",
      "13:00",
      "13:10",
      "13:20",
      "13:30",
      "13:40",
      "13:50",
      "14:00",
      "14:10",
      "14:20",
      "14:30",
      "14:40",
      "14:50",
      "15:00",
      "15:10",
      "15:20",
      "15:30",
      "15:40",
      "15:50",
      "15:59"
    ];

    if (newData.time.length >= 16) {
      var minString = newData.time.substring(11, 16);
      var inserIndex = insertMin.indexOf(minString);
      if (inserIndex == 0) {
        lastAddMinTime = "";
      }
      // 如果是要插入的时间,则插入
      if (inserIndex > -1 && lastAddMinTime != minString) {
        if (inserIndex == 0) {
          // 如果是第0位清空列表
          thumbs.clear();
          thumbs.add(newData.close);
        } else {
          thumbs[thumbs.length - 1] = newData.close;
        }
        //添加用于新数据替
        thumbs.add("-1");
        lastAddMinTime = minString;
      } else {
        // 不是则放在最后一位
        if (thumbs.isNotEmpty) {
          thumbs[thumbs.length - 1] = newData.close;
        }
      }
    }
  }

  setupFlash(List<dynamic> lastData, List<dynamic> nextData) {
    var last = double.tryParse(lastData.close) ?? 0;
    var next = double.tryParse(nextData.close) ?? 0;
    var compareState = 0;
    if (last <= 0 || next <= 0) {
      compareState = 0;
    } else if (last > next) {
      compareState = -1;
    } else if (last < next) {
      compareState = 1;
    }

    if (Settings.flashPrice == false) return;
    if (compareState == 0) return;
    if (isFlashing) return;
    isFlashing = true;
    bgColor = compareState == 1 ? JKStyle.riseColor : JKStyle.fallColor;
    setState(() {});

    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        bgColor = Colors.transparent;
        isFlashing = false;
        setState(() {});
      }
    });
  }
}

class TooltipWidget extends StatefulWidget {
  final Widget child;
  final Widget tooltip;
  Offset offset;

  TooltipWidget({required this.child, required this.tooltip, this.offset = Offset.zero});

  @override
  _TooltipWidgetState createState() => _TooltipWidgetState();
}

class _TooltipWidgetState extends State<TooltipWidget> {
  final key = GlobalKey();
  OverlayEntry? overlayEntry;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      key: key,
      onEnter: (event) => showOverlay(context),
      onExit: (event) => removeOverlay(),
      child: widget.child,
    );
  }

  showOverlay(BuildContext context) {
    overlayEntry = OverlayEntry(
        maintainState: true,
        builder: (context) {
          RenderBox? renderBox = key.currentContext!.findRenderObject() as RenderBox?;
          var size = renderBox?.size;
          var offset = renderBox?.localToGlobal(Offset.zero);
          return Positioned(
            left: (offset?.dx ?? 0) + widget.offset.dx,
            top: (offset?.dy ?? 0) + (size?.height ?? 0) + widget.offset.dy,
            child: widget.tooltip,
          );
        });
    Overlay.of(context).insert(overlayEntry!);
  }

  removeOverlay() {
    overlayEntry?.remove();
    overlayEntry = null;
  }
}
