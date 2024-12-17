import 'package:flutter/material.dart';
import 'package:mgjkn/desktop/financial/financial_valuation.dart';
import 'package:mgjkn/desktop/painter_list.dart';
import 'package:mgjkn/desktop/settings_widget.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/backtest/backtest_menu.dart';
import 'package:mgjkn/desktop/stock/chan_data_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_menu.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_data_controller.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/desktop/stock/panit/paint_enum.dart';
import 'package:mgjkn/desktop/stock/search_field.dart';
import 'package:mgjkn/desktop/stock/stock_left_menu.dart';
import 'package:mgjkn/desktop/stock/opinion_widget.dart';
import 'package:mgjkn/desktop/stock/text_live_widget.dart';
import 'package:mgjkn/extensions/extension_widget.dart';

import 'package:mgjkn/desktop/stock/kchart/entity/k_line_entity.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_vertical_widget.dart';
import 'package:mgjkn/notification.dart';
import 'package:mgjkn/model/model.dart';
import 'package:mgjkn/network/network.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/widgets/widget.dart';
import 'stock_right_menu.dart';

enum ContentType { stockInfo, opinion, textLive, financial }

class StockKline extends StatefulWidget {
  StockKline(
      {this.stockInfo, this.contentType = ContentType.stockInfo, super.key});

  StockInfo? stockInfo; //初始化用
  final ContentType contentType;

  @override
  State<StatefulWidget> createState() {
    return _StockKline();
  }
}

class _StockKline extends State<StockKline> {
  var selectedSubMenuIndex = 0;
  var subMenuTitles = [
    ["主图指标", "assets/images/kline_nor.png"],
    ["线型切换", "assets/images/candle_nor.png"],
    ["多图模式", "assets/images/multiple_nor.png"],
    ["股票PK", "assets/images/pk_icon_nor.png"],
    ["叠加标记", "assets/images/event_nor.png"],
    ["画线工具", "assets/images/paint_nor.png"]
  ];

  int selectedTrendIndex = -1;
  int selectedGraphicsIndex = -1;
  int selectedSpaceIndex = -1;
  int selectedUtilityIndex = -1;

// // 多图参数
//   var selectedFrameIndex = 0;
//   var preferenceMultiple2Frames = 0;
//   var preferenceMultiple3Frames = 0;

  final TextEditingController textEditingController = TextEditingController();
  Widget subMenuContent() {
    var framesTitles = [
      ["1图", "assets/images/frame_1.png"],
      ["2图", "assets/images/frame_2.png"],
      ["3图", "assets/images/frame_3.png"],
      ["4图", "assets/images/frame_4.png"],
      ["6图", "assets/images/frame_5.png"],
      ["9图", "assets/images/frame_6.png"],
    ];
    switch (selectedSubMenuIndex) {
      case 0:
        var indicator = IndicatorManager.shared.indicatorList["main"] ?? [];
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: List.generate(
                indicator.length,
                (index) {
                  var name = indicator[index]["name"];
                  List subTitles = indicator[index]["indicators"] ?? [];
                  var requstType = indicator[index]["type"];
                  if (subTitles.isNotEmpty) {
                    var isSelected = false;

                    // for (var element in KLineManager.shared.selectedChartController.mainIndicator) {
                    //   for (var item in subTitles) {
                    //     if (item["name"] == element) {
                    //       isSelected = true;
                    //       break;
                    //     }
                    //   }
                    // }

                    return JKHoverDropdown(
                      title: indicator[index]["name"],
                      image: "assets/images/arrow_down.png",
                      fontsize: 14,
                      imageColor: Colors.grey,
                      hoverColor: JKStyle.themeColor,
                      options: subTitles,
                      offset: const Offset(-40, 0),
                      onSelected: (v, _) {},
                      isSelected: false,
                      child: IndicatorMenu(
                          KLineManager.shared.selectedChartController,
                          chartKey: "",
                          IndicatorItem(
                              name: name,
                              id: "id",
                              type: "type",
                              dbType: "dbType"),
                          titles: [name],
                          contents: [
                            subTitles
                                .map((e) => IndicatorItem.fromJson(e))
                                .toList()
                          ],
                          width: 149,
                          isChekcBox: true),
                    ).padding(right: 10);
                  }

                  return JKButton(
                    name,
                    onPressed: () {
                      KLineManager.shared.selectedChartController
                          .setMainIndicator(indicator[index]);
                      setState(() {});
                    },
                    height: 20,
                    fontSize: 12,
                    isSelected: KLineManager
                        .shared.selectedChartController.mainIndicator
                        .contains(indicator[index]),
                  ).padding(left: 5, right: 5);
                },
              ),
            ),
            JKButton(
              "回测",
              image: "assets/images/ic_replay.png",
              imageSize: 16,
              fontSize: 12,
              imagePaddingRight: 2,
              isSelected: BacktestManager.shared.isEnable,
              type: JKButtonType.imageLeft,
              onPressed: () {
                BacktestManager.shared.isEnable =
                    !BacktestManager.shared.isEnable;
                BacktestManager.shared.context = context;
                BacktestManager.shared.everySecond = 10;
                setState(() {});
              },
            )
          ],
        ).board(
            width: context.width -
                MainLeftMenuWidget.currentWidth -
                (Settings.isShowRightMenu ? JKStyle.rightMenuWidth : 0) -
                291);
      case 1:
        var isCandle =
            KLineManager.shared.selectedChartController.mainLineType ==
                JKMainLineType.candle;
        return Row(children: [
          const JKText("主图类型: ").padding(right: 10),
          JKButton(
            "折线图",
            image: "assets/images/line_type_1.png",
            type: JKButtonType.imageLeft,
            onPressed: () {
              KLineManager.shared.selectedChartController.mainLineType =
                  JKMainLineType.kline;
              setState(() {});
            },
            width: 70,
            height: 30,
            isSelected: !isCandle,
          ).padding(left: 10),
          JKButton(
            "蜡烛图",
            image: "assets/images/line_type_2.png",
            type: JKButtonType.imageLeft,
            onPressed: () {
              KLineManager.shared.selectedChartController.mainLineType =
                  JKMainLineType.candle;
              setState(() {});
            },
            width: 70,
            height: 30,
            isSelected: isCandle,
          ).padding(left: 10)
        ]);
      case 2:
        return Row(
          children: [
            const JKText("多图显示: ").padding(left: 0),
            Row(
                children: List.generate(
              framesTitles.length,
              (titleIndex) {
                var image = framesTitles[titleIndex][1];
                Widget drop = const SizedBox();
                if (titleIndex == 1 || titleIndex == 2) {
                  var items = [
                    "assets/images/frame_2_1.png",
                    "assets/images/frame_2_2.png"
                  ];
                  if (titleIndex == 1) {
                    image =
                        items[KLineManager.shared.preferenceMultiple2Frames];
                  }
                  if (titleIndex == 2) {
                    items = [
                      "assets/images/frame_3_1.png",
                      "assets/images/frame_3_2.png",
                      "assets/images/frame_3_3.png",
                      "assets/images/frame_3_4.png"
                    ];
                    image =
                        items[KLineManager.shared.preferenceMultiple3Frames];
                  }

                  drop = JKHoverDropdown(
                    title: "",
                    image: "assets/images/arrow_down.png",
                    imageColor: Colors.grey,
                    options: items,
                    isImageItem: true,
                    offset: const Offset(-20, 0),
                    width: 50,
                    onSelected: (v, index) {
                      if (titleIndex == 1) {
                        KLineManager.shared.selectedFrameIndex = 1;
                        KLineManager.shared.preferenceMultiple2Frames = index;
                      } else if (titleIndex == 2) {
                        KLineManager.shared.selectedFrameIndex = 2;
                        KLineManager.shared.preferenceMultiple3Frames = index;
                      }
                      setState(() {});
                    },
                    isSelected: false,
                  );
                }

                var btn = JKButton(
                  tooltips: true,
                  framesTitles[titleIndex][0],
                  image: image,
                  onPressed: () {
                    KLineManager.shared.selectedFrameIndex = titleIndex;
                    KLineManager.shared.selectedFrameIndex = titleIndex;
                    setState(() {});
                  },
                  width: 18,
                  height: 18,
                  isSelected:
                      KLineManager.shared.selectedFrameIndex == titleIndex,
                ).padding(left: 10);
                return Row(children: [btn, drop]);
              },
            )),
          ],
        );
      case 3:
        return Row(children: [
          const JKText("叠加股票: ").padding(right: 10),
          StockSearchField(onSelected: (stock, time) {
            KLineManager.shared.selectedChartController
                .addCompareStock(stock.code);
          })
        ]);
      case 4:
        var eventTitles =
            KLineManager.shared.selectedChartController.infoEventData;

        return Row(
          children: List.generate(
            eventTitles.length,
            (index) {
              String title = eventTitles[index]["title"];
              List subTitles = eventTitles[index]["value"] ?? [];
              if (subTitles.isNotEmpty) {
                var isSelected = false;
                List<IndicatorItem> indicatorItems = [];
                List<String> titles = [];
                for (var item in subTitles) {
                  indicatorItems.add(
                    IndicatorItem(
                        name: item["name"],
                        id: item["key"],
                        type: eventTitles[index]["key"],
                        dbType: "db_type",
                        authorized: true),
                  );
                  titles.add(item["name"]);
                }

                return JKHoverDropdown(
                  title: title,
                  image: "assets/images/arrow_down.png",
                  fontsize: 14,
                  imageColor: Colors.grey,
                  options: subTitles,
                  offset: const Offset(-50, 0),
                  onSelected: (v, _) {},
                  isSelected: false,
                  child: IndicatorMenu(
                      KLineManager.shared.selectedChartController,
                      chartKey: "",
                      height: subTitles.length * 45 + 70,
                      IndicatorItem(
                          name: subTitles[0]["name"],
                          id: "id",
                          type: "type",
                          dbType: "db_type"),
                      titles: [title],
                      contents: [indicatorItems],
                      width: 200,
                      search: false,
                      isMainState: true,
                      isEventState: true,
                      isChekcBox: false),
                ).padding(right: 10);
              }

              var isSel = KLineManager
                  .shared.selectedChartController.infoEventMaps.keys
                  .contains(title);
              return JKButton(title,
                  height: 20, fontSize: 14, isSelected: isSel, onPressed: () {
                var key = eventTitles[index]["key"];
                KLineManager.shared.selectedChartController
                    .setInfoEvent(title, key, isBasic: true);
                setState(() {});
              });
            },
          ),
        );
      case 5:
        var ctl = KLineManager.shared.selectedChartController;
        var showPaints = ctl.showPaint;
        var showCrossPaint = ctl.isCrossPaint;
        // var currentPaintType = ctl.paintManager.currentPaintType;
        // debugPrint("PaintCurrent: ${ctl.paintManager.currentPaintType}");
        // var isPaintTypeSelected = currentPaintType;
        return Row(children: [
          PaintMenuButton(
            defaultTitle: "趋势类",
            defaultImage: "assets/images/type_1.png",
            selectedIndex: selectedTrendIndex,
            items: JKStyle.trendMenu,
            onChoosed: (index) {
              setSelectPanit(
                  index, -1, -1, -1, JKStyle.trendMenu.safeAt(index));
            },
          ),
          const SizedBox(width: 15),
          PaintMenuButton(
            defaultTitle: "图形类",
            defaultImage: "assets/images/type_2.png",
            selectedIndex: selectedGraphicsIndex,
            items: JKStyle.graphicsMenu,
            onChoosed: (index) {
              setSelectPanit(
                  -1, index, -1, -1, JKStyle.graphicsMenu.safeAt(index));
            },
          ),
          const SizedBox(width: 15),
          PaintMenuButton(
            defaultTitle: "时空类",
            defaultImage: "assets/images/type_3.png",
            selectedIndex: selectedSpaceIndex,
            items: JKStyle.spaceMenu,
            onChoosed: (index) {
              setSelectPanit(
                  -1, -1, index, -1, JKStyle.spaceMenu.safeAt(index));
            },
          ),
          const SizedBox(width: 15),
          PaintMenuButton(
            defaultTitle: "工具类",
            defaultImage: "assets/images/type_4.png",
            selectedIndex: selectedUtilityIndex,
            items: JKStyle.toolMenu,
            onChoosed: (index) {
              setSelectPanit(-1, -1, -1, index, JKStyle.toolMenu.safeAt(index));
            },
          ),
          JKButton("跨周期画线",
                  tooltips: true,
                  image: "assets/images/zhouqi.png",
                  isSelected: showCrossPaint, onPressed: () {
            KLineManager.shared.selectedChartController.isCrossPaint =
                !showCrossPaint;
            setState(() {});
          }, width: 18, height: 18)
              .padding(left: 15),
          JKButton("显示/隐藏",
                  tooltips: true,
                  image:
                      "assets/images/${showPaints ? "eye_open" : "eye_close"}.png",
                  isSelected: !showPaints, onPressed: () {
            KLineManager.shared.selectedChartController.showPaint = !showPaints;
            setState(() {});
          }, width: 18, height: 18)
              .padding(left: 15),
          JKButton(
            "连续画线",
            tooltips: true,
            image: "assets/images/ic_pen_stay.png",
            isSelected: ctl.paintContinue,
            onPressed: () {
              ctl.paintContinue = !ctl.paintContinue;
              setState(() {});
            },
            width: 18,
            height: 18,
          ).padding(left: 15),
          JKButton(
            "删除所有画线",
            tooltips: true,
            image: "assets/images/del.png",
            onPressed: () {
              KLineManager.shared.selectedChartController.paintManager
                  .clearAll();
              network.deleteAllUserPaint(
                  KLineManager.shared.selectedChartController.stockCode,
                  KLineManager
                      .shared.selectedChartController.stockTime.rawValue.item1);
              setState(() {});
            },
            width: 18,
            height: 18,
          ).padding(left: 15),
          JKButton("画线统计",
                  tooltips: true,
                  image: "assets/images/ic_draw_list.png",
                  isSelected: !showPaints, onPressed: () {
            showPageSheet(context, const PainterList(), title: "全部画线");
          }, width: 18, height: 18)
              .padding(left: 15),
        ]);
      default:
        return const SizedBox();
    }
  }

  Widget chanChartContent() {
    var ctl = KLineManager.shared.selectedChartController;
    if (!ctl.hasChanMenu) {
      return const SizedBox();
    }
    var li = [];
    if (ctl.hasBasicChanMenu) {
      li = [
        ["chan_pen_", ChanDataIndicator.pen],
        ["chan_bs_", ChanDataIndicator.class1],
        // ["chan_bs_", ChanDataIndicator.class2],
        ["chan_bs_", ChanDataIndicator.class3],
        ["chan_zhongshu_", ChanDataIndicator.pivot],
        // ["chan_jiage_", ChanDataIndicator.pivotPrice],
        // ["chan_duanshu_", ChanDataIndicator.pivotSection],
        ["chan_fanzhuan_", ChanDataIndicator.reversal],
        ["chan_chongdie_", ChanDataIndicator.showOverlap],
        ["chan_duanxian_", ChanDataIndicator.shortLine],
        ["chan_zhuli_", ChanDataIndicator.mainTrend]
      ];
    } else if (ctl.hasProChanMenu) {
      li = [
        ["chan_pen_", ChanDataIndicator.pen],
        ["chan_bs_", ChanDataIndicator.class1],
        ["chan_bs_", ChanDataIndicator.class2],
        ["chan_bs_", ChanDataIndicator.class3],
        ["chan_zhongshu_", ChanDataIndicator.pivot],
        ["chan_jiage_", ChanDataIndicator.pivotPrice],
        ["chan_duanshu_", ChanDataIndicator.pivotSection],
        ["chan_fanzhuan_", ChanDataIndicator.reversal],
        ["chan_chongdie_", ChanDataIndicator.showOverlap],
        ["chan_duanxian_", ChanDataIndicator.shortLine],
        ["chan_zhuli_", ChanDataIndicator.mainTrend]
      ];
    }

    return Row(
        children: List.generate(li.length, (index) {
      var item = li[index];
      var indicator = item[1] as ChanDataIndicator;
      var isSelected = ctl.mainIndicator.contains(indicator.info.$2);
      var img = isSelected ? "${item[0]}sel" : "${item[0]}nor";
      // var fontColor = isSelected ? JKStyle.theme.white : Colors.grey.shade600;
      // return Row(children: [
      //   JKImage("assets/images/chan_tool/$img.png"),
      //   const SizedBox(width: 2),
      //   JKText(item[1], fontSize: 12, color: fonrColor),
      // ]).padding(right: 15);
      return JKButton(
        indicator.info.$1,
        image: "assets/images/chan_tool/$img.png",
        type: JKButtonType.imageLeft,
        isSelected: isSelected,
        normalStyle: JKButtonStyle(
            fontColor: Colors.grey.shade600, hoverColor: JKStyle.theme.white),
        selectedStyle: JKButtonStyle(
            fontColor: JKStyle.theme.white, hoverColor: JKStyle.theme.white),
        fontSize: 12,
        imageSize: 28,
        widthPlus: 6,
        // imageFit: BoxFit.fitWidth,
        hoverColor: JKStyle.theme.white,
        hoverImageColor: false,
        imagePaddingRight: 0,
        onPressed: () {
          ctl.setMainIndicator(indicator.info.$2);
          setState(() {});
        },
      );
    })).board(height: 24, paddigLeft: 10, bottom: 1);
  }

  var eBus;
  @override
  void initState() {
    super.initState();
    eBus = eventBus.on<StockDataChangeEvent>().listen((event) {
      setState(() {});
    });

    network.indicatorList(onResult: (ResultData res) {
      if (res.success) {
        IndicatorManager.shared.indicatorList = res.json["data"] ?? {};
        setState(() {});
      }
    });

    widget.stockInfo ??=
        StockInfo(code: "QQQ", name: "Invesco QQQ Trust, Series 1");
    var ctl = KLineManager.shared.selectedChartController;
    ctl.setStockInfo(
        code: widget.stockInfo!.code,
        name: widget.stockInfo!.name,
        time: widget.stockInfo!.stockTime);
  }

  @override
  void dispose() {
    eBus.cancel();
    BacktestManager.shared.isEnable = false;
    super.dispose();
  }

  Widget getMultipleFrame() {
    var curWidth = MediaQuery.of(context).size.width - 50 * 2;
    curWidth = curWidth - MainLeftMenuWidget.currentWidth;
    curWidth =
        Settings.isShowRightMenu ? curWidth - JKStyle.rightMenuWidth : curWidth;
    var curHeight = MediaQuery.of(context).size.height - 100 - 11;
    if (KLineManager.shared.selectedChartController.hasChanMenu) {
      curHeight -= 20;
    }
    curHeight = BacktestManager.shared.isEnable
        ? curHeight - BacktestMenu.menuHeight
        : curHeight;

    Widget klines;
    switch (KLineManager.shared.selectedFrameIndex) {
      case 1: // 2图
        KLineManager.shared
            .removeDataController(["2", "3", "4", "5", "6", "7", "8"]);
        if (KLineManager.shared.preferenceMultiple2Frames == 0) {
          klines = Row(
            children: [
              KLineVerticalWidget("0", curWidth / 2, curHeight,
                      key: const ValueKey("0"))
                  .board(width: curWidth / 2, height: curHeight),
              KLineVerticalWidget("1", curWidth / 2, curHeight,
                      key: const ValueKey("1"))
                  .board(width: curWidth / 2, height: curHeight),
            ],
          );
        } else {
          klines = Column(
            children: [
              SizedBox(
                height: curHeight / 2,
                child: KLineVerticalWidget("0", curWidth, curHeight / 2,
                    key: const ValueKey("0")),
              ),
              SizedBox(
                  height: curHeight / 2,
                  child: KLineVerticalWidget("1", curWidth, curHeight / 2,
                      key: const ValueKey("1"))),
            ],
          );
        }
        break;
      case 2: // 3图
        KLineManager.shared
            .removeDataController(["3", "4", "5", "6", "7", "8"]);
        switch (KLineManager.shared.preferenceMultiple3Frames) {
          case 1:
            klines = Column(children: [
              SizedBox(
                height: curHeight / 2,
                child: Row(
                  children: [
                    SizedBox(
                      height: curHeight / 2,
                      width: curWidth / 2,
                      child: KLineVerticalWidget(
                          "0", curWidth / 2, curHeight / 2,
                          key: const ValueKey("0")),
                    ),
                    SizedBox(
                      height: curHeight / 2,
                      width: curWidth / 2,
                      child: KLineVerticalWidget(
                          "1", curWidth / 2, curHeight / 2,
                          key: const ValueKey("1")),
                    ),
                  ],
                ),
              ),
              SizedBox(
                height: curHeight / 2,
                child: KLineVerticalWidget("2", curWidth, curHeight / 2,
                    key: const ValueKey("2")),
              ),
            ]);
            break;
          case 2:
            klines = Row(children: [
              SizedBox(
                width: curWidth / 2,
                height: curHeight,
                child: KLineVerticalWidget("0", curWidth / 2, curHeight,
                    key: const ValueKey("0")),
              ),
              Column(
                children: [
                  SizedBox(
                    height: curHeight / 2,
                    width: curWidth / 2,
                    child: KLineVerticalWidget("1", curWidth / 2, curHeight / 2,
                        key: const ValueKey("1")),
                  ),
                  SizedBox(
                    height: curHeight / 2,
                    width: curWidth / 2,
                    child: KLineVerticalWidget("2", curWidth / 2, curHeight / 2,
                        key: const ValueKey("2")),
                  )
                ],
              ),
            ]);
            break;
          case 3:
            klines = Row(children: [
              Column(
                children: [
                  SizedBox(
                    height: curHeight / 2,
                    width: curWidth / 2,
                    child: KLineVerticalWidget("0", curWidth / 2, curHeight / 2,
                        key: const ValueKey("0")),
                  ),
                  SizedBox(
                    height: curHeight / 2,
                    width: curWidth / 2,
                    child: KLineVerticalWidget("1", curWidth / 2, curHeight / 2,
                        key: const ValueKey("1")),
                  )
                ],
              ),
              SizedBox(
                height: curHeight,
                width: curWidth / 2,
                child: KLineVerticalWidget("2", curWidth / 2, curHeight,
                    key: const ValueKey("2")),
              )
            ]);
            break;
          default:
            klines = Column(children: [
              SizedBox(
                height: curHeight / 2,
                child: KLineVerticalWidget("0", curWidth, curHeight / 2,
                    key: const ValueKey("0")),
              ),
              SizedBox(
                height: curHeight / 2,
                child: Row(
                  children: [
                    SizedBox(
                      width: curWidth / 2,
                      height: curHeight / 2,
                      child: KLineVerticalWidget(
                          "1", curWidth / 2, curHeight / 2,
                          key: const ValueKey("1")),
                    ),
                    SizedBox(
                      width: curWidth / 2,
                      height: curHeight / 2,
                      child: KLineVerticalWidget(
                          "2", curWidth / 2, curHeight / 2,
                          key: const ValueKey("2")),
                    ),
                  ],
                ),
              ),
            ]);
        }
        break;
      case 3: // 4图
        KLineManager.shared.removeDataController(["4", "5", "6", "7", "8"]);
        var li = ["0", "1", "2", "3"];
        klines = Wrap(
            children: List.generate(li.length, (index) {
          String id = li[index];
          return SizedBox(
            width: curWidth / 2,
            height: curHeight / 2,
            child: KLineVerticalWidget(id, curWidth / 2, curHeight / 2,
                key: ValueKey(id)),
          );
        }));
        break;
      case 4: // 6图
        KLineManager.shared.removeDataController(["6", "7", "8"]);
        var li = ["0", "1", "2", "3", "4", "5"];
        klines = Wrap(
            children: List.generate(li.length, (index) {
          String id = li[index];
          return SizedBox(
            width: curWidth / 3,
            height: curHeight / 2,
            child: KLineVerticalWidget(id, curWidth / 3, curHeight / 2,
                key: ValueKey(id)),
          );
        }));
        break;
      case 5: // 9图
        var li = ["0", "1", "2", "3", "4", "5", "6", "7", "8"];
        klines = Wrap(
            children: List.generate(li.length, (index) {
          String id = li[index];
          return SizedBox(
            width: curWidth / 3,
            height: curHeight / 3,
            child: KLineVerticalWidget(id, curWidth / 3, curHeight / 3,
                key: ValueKey(id)),
          );
        }));
        break;
      default:
        KLineManager.shared
            .removeDataController(["1", "2", "3", "4", "5", "6", "7", "8"]);
        klines = KLineVerticalWidget("0", curWidth, curHeight,
            key: const ValueKey("0"));
    }
    return SizedBox(height: curHeight, width: curWidth, child: klines);
  }

  @override
  Widget build(BuildContext context) {
    var ctl = KLineManager.shared.selectedChartController;
    return Container(
        color: JKStyle.theme.bgColor,
        child: Row(
          children: [
            MainLeftMenuWidget.currentWidth > 0
                ? MainLeftMenuWidget()
                : const SizedBox(),
            Expanded(
              child: widget.contentType == ContentType.financial
                  ? const FinancialValuation()
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                            height: 24,
                            decoration: BoxDecoration(
                              border: Border(
                                  bottom: BorderSide(
                                      color: JKStyle.theme.dividerColor)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    JKButton(
                                      "显示/隐藏股票金池",
                                      tooltips: true,
                                      image: "assets/images/ic_leftbar.png",
                                      isSelected:
                                          Settings.leftMenuShowState > 0,
                                      onPressed: () {
                                        Settings.leftMenuShowState =
                                            Settings.leftMenuShowState + 1;
                                        setState(() {});
                                      },
                                      width: 18,
                                      height: 18,
                                    ).padding(left: 8, right: 8),
                                    timeStockTimeWidget(),
                                    Row(
                                      children: List.generate(
                                          JKStockTimeType.values.length,
                                          (index) {
                                        var item =
                                            JKStockTimeType.values[index];
                                        if ([
                                          JKStockTimeType.timePre,
                                          JKStockTimeType.time,
                                          JKStockTimeType.time5,
                                          JKStockTimeType.timeAft,
                                          JKStockTimeType.week,
                                          JKStockTimeType.month,
                                          JKStockTimeType.quarter,
                                          JKStockTimeType.month6,
                                          JKStockTimeType.year
                                        ].contains(item)) {
                                          return const SizedBox();
                                        }
                                        return JKButton(
                                          item.rawValue.item2,
                                          onPressed: () {
                                            ctl.setStockInfo(
                                                time: JKStockTimeType
                                                    .values[index]);
                                            setState(() {});
                                          },
                                          fontSize: 13,
                                          isSelected: ctl.stockTime == item,
                                        );
                                      }),
                                    ),
                                    moreStockTimeWidget()
                                  ],
                                ),
                                JKButton(
                                  "显示/隐藏信息栏",
                                  tooltips: true,
                                  image: "assets/images/ic_rightbar.png",
                                  isSelected: Settings.isShowRightMenu,
                                  onPressed: () {
                                    Settings.isShowRightMenu =
                                        !Settings.isShowRightMenu;
                                    setState(() {});
                                  },
                                  width: 18,
                                  height: 18,
                                ).padding(left: 8, right: 8),
                              ],
                            )),
                        Container(
                          height: 24,
                          decoration: BoxDecoration(
                            border: Border(
                                bottom: BorderSide(
                                    color: JKStyle.theme.dividerColor)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Row(
                                    children: List.generate(
                                        subMenuTitles.length,
                                        (index) => JKButton(
                                              subMenuTitles[index][0],
                                              tooltips: true,
                                              image: subMenuTitles[index][1],
                                              type: JKButtonType.imageOnly,
                                              onPressed: () {
                                                selectedSubMenuIndex = index;
                                                ctl.paintManager.enablePaint =
                                                    (index == 5);
                                                ctl.paintContinue = false;
                                                ctl.paintManager.currentPaint =
                                                    null;
                                                ctl.paintManager
                                                        .currentPaintType =
                                                    JKUserPathType.none;
                                                setState(() {});
                                              },
                                              width: 30,
                                              height: 18,
                                              isSelected:
                                                  selectedSubMenuIndex == index,
                                            )),
                                  ),
                                  Padding(
                                    padding:
                                        const EdgeInsets.fromLTRB(0, 0, 10, 0),
                                    child: Container(
                                      width: 1,
                                      height: 20,
                                      color: JKStyle.theme.dividerColor,
                                    ),
                                  ),
                                  subMenuContent(),
                                ],
                              ),
                            ],
                          ),
                        ),
                        chanChartContent(),
                        getMultipleFrame(),
                        BacktestManager.shared.isEnable
                            ? const BacktestMenu()
                            : const SizedBox()
                      ],
                    ),
            ),
            Visibility(
                visible: widget.contentType != ContentType.financial,
                child: getRightMenu()),
          ],
        ));
  }

  // 分时选项
  Widget timeStockTimeWidget() {
    var menus = const [
      JKStockTimeType.timePre,
      JKStockTimeType.time,
      JKStockTimeType.timeAft,
      JKStockTimeType.time5,
    ];

    var title = "分时";
    var isSelected = false;
    var ctl = KLineManager.shared.selectedChartController;

    if (Utils.isMainIndex(ctl.stockCode)) {
      menus = [JKStockTimeType.time, JKStockTimeType.time5];
    }

    if (ctl.stockTime.isTickTime) {
      isSelected = true;
      title = ctl.stockTime.rawValue.item2.replaceAll("分时", "");
    }
    return JKHoverDropdown(
      title: title,
      image: "assets/images/arrow_down.png",
      offset: const Offset(-26, 0),
      options: menus.map((e) => e.rawValue.item2).toList(),
      isSelected: isSelected,
      onSelected: (value, _) {
        for (var i = 0; i < menus.length; i++) {
          var item = menus[i];
          if (item.rawValue.item2 == value) {
            ctl.setStockInfo(time: item);
            break;
          }
        }
        setState(() {});
      },
    );
  }

  // 更多选项
  Widget moreStockTimeWidget() {
    const menus = [
      JKStockTimeType.week,
      JKStockTimeType.month,
      JKStockTimeType.quarter,
      JKStockTimeType.month6,
      JKStockTimeType.year
    ];
    var currenW = context.width - 100;
    currenW -= MainLeftMenuWidget.currentWidth;
    if (Settings.isShowRightMenu) {
      currenW -= JKStyle.rightMenuWidth;
    }
    var showAll = currenW > 1000;
    if (showAll) {
      return Row(
          children: List.generate(menus.length, (index) {
        var item = menus[index];
        var ctl = KLineManager.shared.selectedChartController;
        return JKButton(
          item.rawValue.item2,
          onPressed: () {
            ctl.setStockInfo(time: item);
            setState(() {});
          },
          fontSize: 13,
          isSelected: ctl.stockTime == item,
        );
      }));
    }

    var title = "更多";
    var isSelected = false;
    var ctl = KLineManager.shared.selectedChartController;
    if (menus.contains(ctl.stockTime)) {
      title = ctl.stockTime.rawValue.item2;
      isSelected = true;
    }
    return JKHoverDropdown(
      title: title,
      image: "assets/images/arrow_down.png",
      offset: const Offset(-26, 0),
      options: menus.map((e) => e.rawValue.item2).toList(),
      isSelected: isSelected,
      onSelected: (value, _) {
        for (var i = 0; i < menus.length; i++) {
          var item = menus[i];
          if (item.rawValue.item2 == value) {
            ctl.setStockInfo(time: item);
            break;
          }
        }
        setState(() {});
      },
    ).padding(left: 10);
  }

  Widget getRightMenu() {
    if (Settings.isShowRightMenu == false) {
      return const SizedBox();
    }
    switch (widget.contentType) {
      case ContentType.opinion:
        return const OpinionWidget();
      case ContentType.textLive:
        return const TextLiveWidget();
      default:
        return const MainRightMenuWidget();
    }
  }

  setSelectPanit(a, b, c, d, currentType) {
    selectedTrendIndex = a;
    selectedGraphicsIndex = b;
    selectedSpaceIndex = c;
    selectedUtilityIndex = d;
    var ctl = KLineManager.shared.selectedChartController;
    ctl.paintManager.currentPaintType = currentType ?? JKUserPathType.none;
    ctl.paintManager.context = context;
    if (ctl.paintManager.currentPaintType == JKUserPathType.horizontal ||
        ctl.paintManager.currentPaintType == JKUserPathType.vertical) {
      // 为了直接显示出线不用点击
      ctl.paintManager.currentPaint = ctl.paintManager.currentPaintType.getPath;
      ctl.paintManager.currentPaint?.isPainting = true;
    }

    setState(() {});
  }

  List<KLineEntity> datas = [];
}
