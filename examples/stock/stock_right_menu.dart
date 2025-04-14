import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_hsvcolor_picker/flutter_hsvcolor_picker.dart';
import 'package:mgjkn/debug.dart';
import 'package:mgjkn/desktop/alarm_widget/alarm_common.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/exchange_stream_widget.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/desktop/stock/stock_update_manager.dart';
import 'package:mgjkn/desktop/user_info/account_info.dart';
import 'package:mgjkn/desktop/alarm_widget/stock_alarm_popup.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/notification.dart';
import 'package:mgjkn/model/model.dart';
import 'package:mgjkn/network/network.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/widgets/jktable.dart';
import 'package:mgjkn/widgets/widget.dart';
import 'package:url_launcher/url_launcher.dart';

class MainRightMenuWidget extends StatefulWidget {
  const MainRightMenuWidget({super.key});

  @override
  State<MainRightMenuWidget> createState() => _MainRightMenuWidgetState();
}

class _MainRightMenuWidgetState extends State<MainRightMenuWidget> {
  var showMoreInfo = false;
  final menuTitles = ["报价", "简介"]; // 新闻
  var menuSelectedIndex = 0;
  var selectedPools = <String>{};

  String stockCode = "";
  String stockName = "";
  final _menuWidth = JKStyle.rightMenuWidth;

  bool isSelectedRelatedList = true;
  var isRelatedLoading = true;
  bool hideRelateList = false;
  int selectedRelatePlateIndex = 0;
  List<dynamic> relatePlates = [];

  late StreamSubscription<StockDataChangeEvent> eBus;
  @override
  void initState() {
    super.initState();
    stockCode = KLineManager.shared.selectedChartController.stockCode;
    stockName = KLineManager.shared.selectedChartController.stockName;
    updateData();
    eBus = eventBus.on<StockDataChangeEvent>().listen((_) {
      var event = KLineManager.shared.selectedChartController;
      if (mounted && stockCode != event.stockCode) {
        stockCode = event.stockCode;
        stockName = event.stockName;
        briefData = {};
        newsList = [];
        quoteData = QuoteData.fromJson({});
        relateList = [];
        relatePlates = [];
        isSelectedRelatedList = true;
        hideRelateList = true;
        currentStockItem = null;
        setState(() {});
        updateData();
      }
    });

    Debug.marketRefreshMap["MainRightMenu"] = () {
      useRealtimeData = true;
      updateData();
    };
  }

  var useRealtimeData = false;

  @override
  dispose() {
    eBus.cancel();
    Debug.marketRefreshMap.remove("MainRightMenu");
    super.dispose();
  }

  updateData() {
    if (stockCode.isEmpty) {
      return;
    }
    updateNewsList();
    updateRelates();
    updateBrief();
    updateQuote();
    updateNotice();
    baeStockInfo();
  }

  var newsList = [];
  var relateList = [];

  updateNewsList() {
    network.newsList(stockCode).then((res) {
      if (res.success) {
        newsList = res.json["data"] ?? [];
      } else {
        newsList = [];
      }
      setState(() {});
    });
  }

  updateRelates({String? plateId}) {
    isRelatedLoading = true;
    network.relateStock(stockCode, plateId: plateId).then((res) {
      isRelatedLoading = false;
      if (res.success) {
        relateList = JKBaseStockItemList.fromMapList(res.json["data"]?["stocks"]);
        relateList.sort((a, b) {
          var aa = a as JKBaseStockItem;
          var bb = b as JKBaseStockItem;
          var (aMv, _, _, _) = Utils.getStockInfo(aa.extend.totalShare, aa.stock.close);
          var (bMv, _, _, _) = Utils.getStockInfo(bb.extend.totalShare, bb.stock.close);
          return bMv.compareTo(aMv);
        });

        List plates = res.json["data"]?["plates"] ?? [];
        if (plates.isNotEmpty) {
          relatePlates = plates;
        }

        if (relateList.isEmpty) {
          isSelectedRelatedList = false;
          hideRelateList = true;
        } else {
          isSelectedRelatedList = true;
          hideRelateList = false;
        }
      } else {
        relateList = [];
        relatePlates = [];
      }
      setState(() {});
    });
  }

  QuoteData quoteData = QuoteData.fromJson({});
  updateQuote() {
    network.stockQuote(stockCode).then((res) {
      if (res.success) {
        quoteData = QuoteData.fromJson(res.json["data"]);
      } else {
        quoteData = QuoteData.fromJson({});
      }
      setState(() {});
    });
  }

  JKBaseStockItem? currentStockItem;
  baeStockInfo() {
    network.stockBasicInfo(stockCode).then((res) {
      if (res.success) {
        currentStockItem = JKBaseStockItem.fromMap(res.json['data']);
      }
      setState(() {});
    });
  }

  var briefData = {};
  updateBrief() {
    network.stockBrief(stockCode).then((res) {
      if (res.success) {
        briefData = res.json["data"];
      } else {
        briefData = {};
      }

      setState(() {});
    });
  }

  var noticeFinancialData = [];
  var noticeEventData = [];
  updateNotice() {
    network.stockNotice(stockCode).then((res) {
      if (res.success) {
        noticeEventData = res.json["data"]?["event"] ?? [];
        noticeFinancialData = res.json["data"]?["financial"] ?? [];
      } else {
        noticeFinancialData = [];
        noticeEventData = [];
      }

      setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    stockCode = KLineManager.shared.selectedChartController.stockCode;
    stockName = KLineManager.shared.selectedChartController.stockName;

    // var codeNameWidth = Utils.getTextPainter(stockCode, 20);

    return Container(
      decoration: BoxDecoration(
        color: JKStyle.theme.bgColor,
        border: Border(
          left: BorderSide(color: JKStyle.theme.dividerColor),
        ),
      ),
      width: _menuWidth,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.only(left: 4, right: 4),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: JKStyle.theme.dividerColor)),
            ),
            height: 30,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(
                  menuTitles.length,
                  (index) => JKButton(menuTitles[index],
                          isSelected: menuSelectedIndex == index,
                          height: 20,
                          width: _menuWidth / menuTitles.length - menuTitles.length - 10,
                          type: JKButtonType.selColor, onPressed: () {
                        menuSelectedIndex = index;
                        setState(() {});
                      })),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                // crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  JKText(
                    stockCode,
                    fontSize: 20,
                    color: JKStyle.theme.white,
                  ).padding(left: 5, top: 5),
                  SizedBox(
                      width: 145,
                      child: JKText(
                        stockName,
                        fontSize: 14,
                        color: JKStyle.theme.textGreyColor2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.left,
                        lineHeight: 1,
                        maxLines: 2,
                      )).padding(left: 15, top: 5),
                ],
              ),
              JKCollectionButton(
                stockCode: stockCode,
                isCollect: currentStockItem?.extend.collect == true,
                offset: const Offset(-150, -60),
                key: ValueKey("$stockCode${currentStockItem?.extend.collect.toString()}"),
              )
            ],
          ),
          StockDataTrackerWidget(
            stockCode: stockCode,
            stockName: stockName,
            initMarketData: currentStockItem?.stock ?? [],
            initPreMarketData: currentStockItem?.extend.stockBefore ?? [],
            initPostMarketData: currentStockItem?.extend.stockAfter ?? [],
            key: ValueKey(stockCode),
            builder: (ctx, pre, data, after, marketState) {
              Widget firstArrow = const SizedBox();
              Widget secondArrow = const SizedBox();
              Debug.mainRightMenuStockCode = stockCode;
              var firstLineData = useRealtimeData ? currentStockItem?.stock ?? data : data;
              var secondLineData = [];
              if (marketState.isPreMarket) {
                secondLineData = useRealtimeData ? currentStockItem?.extend.stockBefore ?? pre : pre;
              } else if (marketState.isPostMarket) {
                secondLineData = useRealtimeData ? currentStockItem?.extend.stockAfter ?? after : after;
              }

              var i = Utils.getStockChanged(firstLineData.lastClose, firstLineData.close);
              firstArrow = JKStyle.colorArrowImage(i.item1, 16);
              var firstLineDate = firstLineData.safeAt(0) as String?;

              if ((firstLineDate?.length ?? 0) >= 10) {
                firstLineDate = firstLineDate?.substring(5, 10).replaceAll("-", "/");
              }

              var secondDate = secondLineData.safeAt(0) as String?;
              if ((secondDate?.length ?? 0) >= 10) {
                secondDate = secondDate?.substring(5, 10).replaceAll("-", "/");
              }

              var secondLineInfo = Utils.getStockChanged(secondLineData.lastClose, secondLineData.close);
              secondArrow = JKStyle.colorArrowImage(secondLineInfo.item1, 14);

              var firstState = marketState.isMarket ? "交易中" : "收盘价";
              var firstLineFontsize = 20.0;

              var firstLinePrice = firstLineData.close.asFixed(3); //firstLineData.close.asFixed(3);
              var firstLinePriceWidth = 999.0;
              do {
                TextPainter textPainter = TextPainter(
                  text: TextSpan(text: firstLinePrice, style: TextStyle(fontSize: firstLineFontsize)),
                  maxLines: 1,
                  textDirection: TextDirection.ltr,
                );
                textPainter.layout();
                firstLinePriceWidth = textPainter.width;
                firstLineFontsize--;
              } while (firstLinePriceWidth > 85);

              return Column(children: [
                JKTooltip(
                  message: "查看盘中分时走势",
                  child: InkWell(
                    onTap: () {
                      KLineManager.shared.selectedChartController.setStockInfo(time: JKStockTimeType.time);
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Row(children: [
                          JKText(firstLinePrice, fontSize: firstLineFontsize, color: i.item4, fontWeight: FontWeight.bold),
                          firstArrow,
                        ]),
                        JKText(i.item1, fontSize: 11, color: i.item4),
                        JKText(i.item2, fontSize: 11, color: i.item4),
                        JKText("$firstState ${firstLineDate ?? "--"}", fontSize: 11, color: JKStyle.theme.textGreyColor2)
                      ],
                    ).padding(left: 5),
                  ),
                ),
                Visibility(
                  visible: marketState != JKMarketState.market && secondLineData.isNotEmpty && Utils.isMainIndex(stockCode) == false,
                  child: JKTooltip(
                    message: "查看${marketState.name}分时走势",
                    child: InkWell(
                        onTap: () {
                          var t = JKStockTimeType.timePre;
                          if (marketState.isPostMarket) {
                            t = JKStockTimeType.timeAft;
                          }
                          KLineManager.shared.selectedChartController.setStockInfo(time: t);
                        },
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Row(children: [JKText(secondLineData.close.asFixed(3), fontSize: 16, color: secondLineInfo.item4), secondArrow]),
                            JKText(secondLineInfo.item1, fontSize: 11, color: secondLineInfo.item4),
                            JKText(secondLineInfo.item2, fontSize: 11, color: secondLineInfo.item4),
                            JKText("${marketState.name}价 ${secondDate ?? "--"}", fontSize: 11, color: JKStyle.theme.textGreyColor2)
                          ],
                        ).padding(left: 5, top: 5, bottom: 5)),
                  ),
                )
              ]);
            },
          ),
          JKDivider(),
          Expanded(child: rightMenuContent())
        ],
      ),
    );
  }

  var debugSelectedColorIndex = 0;
  Widget rightMenuContent() {
    switch (menuSelectedIndex) {
      case 1:
        var title = [
          ["公司名称", "name"],
          ["所属行业", "sic_description"],
          ["成立时间", "list_date"],
          // ["上市日期",""],
          // ["上市场所",""],
          ["员工人数", "total_employees"],
          ["公司网址", "homepage_url"],
          ["联系电话", "phone_number"],
          // ["年结日",""],
          ["证券类型", "market"]
        ];
        // var values = [
        //   briefData["name"] ?? "暂无资料",
        //   briefData[""] ?? "暂无资料",
        //   briefData[""] ?? "暂无资料",
        //   "???",
        //   "???",
        //   briefData["total_employees"] ?? "暂无资料",
        //   briefData["homepage_url"] ?? "暂无资料",
        //   briefData["phone_number"] ?? "暂无资料",
        //   "???",
        //   briefData["market"] ?? "暂无资料",
        // ];

        return Container(
            padding: const EdgeInsets.only(left: 10, top: 10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              JKText("概况", color: JKStyle.theme.textGreyColor2),
              Column(
                children: List.generate(title.length, (index) {
                  var t = title[index];
                  var item = t[0];
                  var val = briefData[t[1]];
                  return Row(
                    children: [
                      SizedBox(width: 50, child: JKText(item, color: JKStyle.theme.textGreyColor2, fontSize: 13, textAlign: TextAlign.left)),
                      SizedBox(width: 170, child: JKText(val, fontSize: 13, maxLines: 2, textAlign: TextAlign.left).padding(left: 5))
                    ],
                  ).padding(top: 5);
                }),
              ),
              JKDivider().padding(vertical: 10),
              JKText("简介", color: JKStyle.theme.textGreyColor2).padding(bottom: 10),
              // JKText(
              //   briefData["description"] ?? "暂无资料",
              //   fontSize: 13,
              //   maxLines: null,
              //   textAlign: TextAlign.left,
              // )
              Text(briefData["description"] ?? "暂无资料", style: TextStyle(fontSize: 13, color: JKStyle.theme.white, height: 1.6))
            ]));
      case 2:
        return StatefulBuilder(builder: ((context, setCurrentState) {
          var debugColorTitle = [
            ["蜡烛图-绿色", JKStyle.stockGreen],
            ["蜡烛图-红色", JKStyle.stockRed],
            ["上中枢-小", JKStyle.normalPivotRiseColor],
            ["上中枢-大", JKStyle.largePivotRiseColor],
            ["下中枢-小", JKStyle.normalPivotFallColor],
            ["下中枢-大", JKStyle.largePivotFallColor],
            ["拓展_2_上中枢", JKStyle.pivot2ExtRiseColor],
            ["拓展_2_下中枢", JKStyle.pivot2ExtFallColor],
            ["拓展_4_上中枢", JKStyle.pivot4ExtRiseColor],
            ["拓展_4_下中枢", JKStyle.pivot4ExtFallColor],
            ["小买点", JKStyle.normalBuyColor],
            ["大买点", JKStyle.largeBuyColor],
            ["小卖点", JKStyle.normalSaleColor],
            ["大卖点", JKStyle.largeSaleColor],
          ];

          String current = debugColorTitle[debugSelectedColorIndex][0] as String;
          return Column(children: [
            Column(children: [
              Column(
                  children: List.generate(debugColorTitle.length, (index) {
                var item = debugColorTitle[index];
                var color = (item[1] as Color);
                return Row(children: [
                  JKCheckBox(
                      selected: debugSelectedColorIndex == index,
                      onClick: (v) {
                        debugSelectedColorIndex = index;
                        setCurrentState(() {});
                      }),
                  JKText("${item[0]}:  ${color.toHex().toUpperCase()}", color: color),
                ]);
              })),
              ColorPicker(
                      color: Colors.blue,
                      paletteHeight: 200,
                      onChanged: (value) {
                        switch (current) {
                          case "蜡烛图-绿色":
                            JKStyle.stockGreen = value;
                            break;
                          case "蜡烛图-红色":
                            JKStyle.stockRed = value;
                            break;
                          case "上中枢-小":
                            JKStyle.normalPivotRiseColor = value;
                            break;
                          case "上中枢-大":
                            JKStyle.largePivotRiseColor = value;
                            break;
                          case "下中枢-小":
                            JKStyle.normalPivotFallColor = value;
                            break;
                          case "下中枢-大":
                            JKStyle.largePivotFallColor = value;
                            break;
                          case "拓展_2_上中枢":
                            JKStyle.pivot2ExtRiseColor = value;
                            break;
                          case "拓展_2_下中枢":
                            JKStyle.pivot2ExtFallColor = value;
                            break;
                          case "拓展_4_上中枢":
                            JKStyle.pivot4ExtRiseColor = value;
                            break;
                          case "拓展_4_下中枢":
                            JKStyle.pivot4ExtFallColor = value;
                            break;
                          case "小买点":
                            JKStyle.normalBuyColor = value;
                            break;
                          case "大买点":
                            JKStyle.largeBuyColor = value;
                            break;
                          case "小卖点":
                            JKStyle.normalSaleColor = value;
                            break;
                          case "大卖点":
                            JKStyle.largeSaleColor = value;
                            break;
                          default:
                        }
                        KLineManager.shared.selectedChartController.refreshCanvas();
                        setCurrentState(() {});
                      },
                      initialPicker: Picker.paletteValue)
                  .board(width: 400)
            ])
          ]);
        }));
        return Container(
          padding: const EdgeInsets.only(left: 10, right: 10),
          child: ListView.builder(
            padding: const EdgeInsets.only(top: 5, bottom: 5),
            itemCount: newsList.length,
            itemBuilder: (context, index) {
              var item = newsList[index];
              var title = item["title"];
              var time = DateTime.parse(item["published_utc"]).secondsSinceEpoch;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(width: 250, height: 35, child: JKText(title, fontSize: 12, maxLines: 2, textAlign: TextAlign.left)),
                  JKText(Utils.formatDate(time, format: ""), fontSize: 12, color: Colors.grey.shade700).padding(top: 5),
                  JKDivider(color: Colors.grey.shade800).padding(top: 5, bottom: 5)
                ],
              ).action(() async {
                var url = Uri.parse(item["article_url"]);
                if (await canLaunchUrl(url)) {
                  await launchUrl(url);
                }
              });
            },
          ),
        );
    }
    return intro();
  }

  Widget intro() {
    var relatePlateWidth = 0.0;
    for (var item in relatePlates) {
      var w = item["name"].length * 14.0 + 20;
      relatePlateWidth = max(relatePlateWidth, w);
    }

    var bubbleVal = "";
    var bubbleStatus = "";
    var bubbleColor = Colors.green;

    if (currentStockItem?.extend.bubble.isNotEmpty == true) {
      bubbleVal = currentStockItem?.extend.bubble["bubble_val"] as String? ?? "";
      var bubbleValDouble = bubbleVal.toDouble();
      if (bubbleValDouble > 0) {
        bubbleVal = bubbleVal.asFixed(2);
        if (bubbleVal.toDouble() > 2) {
          bubbleColor = Colors.red;
        }
        bubbleStatus = currentStockItem?.extend.bubble["bubble_status"] as String? ?? "";
        bubbleStatus = " ($bubbleStatus)";
      } else {
        bubbleVal = "";
        bubbleStatus = "";
      }
    }

    var preClose = currentStockItem?.stock.lastClose;
    switch (Utils.currentMarketState) {
      case JKMarketState.preMarket:
        preClose = currentStockItem?.extend.stockBefore.lastClose;
        break;
      case JKMarketState.market:
        preClose = currentStockItem?.stock.lastClose;
        break;
      case JKMarketState.postMarket:
        preClose = currentStockItem?.extend.stockAfter.lastClose;
        break;
    }

    var maxTitleWidth = 0.0;
    for (var item in relatePlates) {
      var tp = Utils.getTextPainter(item["name"], 14);
      maxTitleWidth = max(maxTitleWidth, tp.width + 30);
    }

    var ssss = [
      hideRelateList
          ? const SizedBox()
          : Row(children: [
              JKButton(
                relatePlates.safeAt(selectedRelatePlateIndex)?["name"] ?? "",
                isSelected: isSelectedRelatedList,
                normalStyle: JKButtonStyle(fontColor: JKStyle.theme.white),
                height: 24,
                fontSize: 12,
                onPressed: () {
                  isSelectedRelatedList = true;
                  setState(() {});
                },
              ),
              relatePlates.length > 1
                  ? JKHoverDropdown(
                      title: "",
                      image: "assets/images/arrow_down.png",
                      options: relatePlates,
                      width: maxTitleWidth,
                      offset: Offset(-maxTitleWidth / 2, 0),
                      itemBuilder: (item) {
                        return Row(children: [
                          JKText(item["name"]),
                        ]).board(height: 30, paddigLeft: 10, paddigTop: 2, paddigbottom: 2);
                      },
                      onSelected: (_, index) {
                        selectedRelatePlateIndex = index;
                        var item = relatePlates[index];
                        relateList = [];
                        setState(() {});
                        updateRelates(plateId: item["id"]);
                      },
                      isSelected: false)
                  : const SizedBox()
            ]),
      JKButton(
        "逐笔买卖",
        isSelected: !isSelectedRelatedList,
        height: 30,
        fontSize: 12,
        normalStyle: JKButtonStyle(fontColor: JKStyle.theme.white),
        onPressed: () {
          isSelectedRelatedList = false;
          setState(() {});
        },
      )
    ];

    if (Utils.isMainIndex(stockCode)) {
      ssss.removeLast();
    }

    return Column(
      children: [
        StockDataTrackerWidget(
            stockCode: "$stockCode@1440",
            stockName: stockName,
            initMarketData: currentStockItem?.stock ?? [],
            initPreMarketData: currentStockItem?.extend.stockBefore ?? [],
            initPostMarketData: currentStockItem?.extend.stockAfter ?? [],
            key: ValueKey("$stockCode@1440"),
            builder: (ctx, pre, data, aft, marketState) {
              var (mv, turnover, pe, pb) = Utils.getStockInfo(
                currentStockItem?.extend.totalShare ?? "0",
                data.close,
                tradeVal: data.dayTradeVal,
                netProfit: currentStockItem?.extend.netIncomeLoss ?? "",
                totalAssets: currentStockItem?.extend.totalAssets ?? "",
                totalLiability: currentStockItem?.extend.liabilities ?? "",
              );
              var lastClose = double.tryParse(data.lastClose) ?? 0;
              var high = double.tryParse(data.high) ?? 0;
              var open = double.tryParse(data.open) ?? 0;
              var low = double.tryParse(data.low) ?? 0;
              var highColor = high > lastClose ? JKStyle.riseColor : JKStyle.fallColor;
              var openColor = open > lastClose ? JKStyle.riseColor : JKStyle.fallColor;
              var lowColor = low > lastClose ? JKStyle.riseColor : JKStyle.fallColor;
              var list = [
                quoteCell("最高价", data.high.asFixed(3), "今开价", data.open.asFixed(3), color: highColor, color2: openColor).padding(top: 4),
                quoteCell("最低价", data.low.asFixed(3), "昨收价", data.lastClose.asFixed(3), color: lowColor).padding(top: 4),
                quoteCell("成交量", Utils.friendlyUnit(data.dayTradeVol), "成交额", Utils.friendlyUnit(data.dayTradeVal, base: 10000)).padding(top: 4),
                quoteCell("总市值", Utils.friendlyUnit(mv), "换手率", Utils.asFixed(turnover, fractionDigits: 2, isPercent: true)).padding(top: 4),
                quoteCell("市盈率", pe, "市净率", pb).padding(top: 4),
                quoteCell("52周高", quoteData.qYearHigh.asFixed(3), color: JKStyle.riseColor, color2: JKStyle.fallColor, "52周低", quoteData.qYearLow.asFixed(3)).padding(top: 4),
                JKDivider().padding(
                  top: 5,
                ),
              ];

              if (["SPX", "IXIC", "DJI"].contains(KLineManager.shared.selectedChartController.currentStock.stockCode)) {
                list.removeRange(2, 5);
              }

              return Column(children: list);
            }),
        bubbleVal.isNotEmpty
            ? Row(
                children: [
                  const JKText("估值泡沫", color: Colors.green, center: true, fontSize: 16).board(width: _menuWidth / 2, height: 50, right: 1),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [JKText(bubbleVal, fontSize: 16, color: bubbleColor), JKText(bubbleStatus, fontSize: 16, color: bubbleColor, noEmpty: false)],
                  ).board(width: _menuWidth / 2 - 1, height: 35)
                ],
              )
            : const SizedBox(),
        bubbleVal.isNotEmpty ? JKDivider() : const SizedBox(),
        Row(
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const JKImage("assets/images/ic_price_call.png", size: 34),
                const JKText("股价报警", color: JKStyle.redTextColor, fontSize: 15).padding(top: 2),
              ],
            ).board(width: _menuWidth / 2 - 1, height: 70).action(() {
              if (UserInfo.shared.isLogin == false) {
                showToast("请先登录");
                return;
              }
              var ctl = KLineManager.shared.selectedChartController;
              showStockAlarm(context, ctl.stockCode, ctl.stockName, JKStockAlarmType.price);
            }),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const JKImage("assets/images/ai_call.png", size: 34),
                const JKText("AI报警", color: JKStyle.redTextColor, fontSize: 15).padding(top: 2),
              ],
            ).board(width: _menuWidth / 2 - 1, height: 70, left: 1, color: JKStyle.theme.dividerColor).action(() {
              if (UserInfo.shared.isLogin == false) {
                showToast("请先登录");
                return;
              }
              showStockAlarm(context, stockCode, stockName, JKStockAlarmType.ai);
            }),
            // Column(
            //   mainAxisAlignment: MainAxisAlignment.center,
            //   children: [
            //     const JKImage("assets/images/ic_holo_call.png", size: 24),
            //     JKBadge(
            //       number: 99,
            //       child: const Row(
            //         mainAxisAlignment: MainAxisAlignment.center,
            //         children: [
            //           JKText("全息报警", color: JKStyle.redTextColor, fontSize: 15),
            //           JKImage("assets/images/ringht_bell.png", size: 16),
            //         ],
            //       ),
            //     )
            //   ],
            // ).board(width: _menuWidth / 3 - 1, height: 70).action(() {
            //   if (UserInfo.shared.isLogin == false) {
            //     showToast("请先登录");
            //     return;
            //   }
            //   showStockAlarm(context, stockCode, stockName, JKStockAlarmType.holo);
            // })
          ],
        ),
        noticeFinancialData.isEmpty
            ? const SizedBox()
            : Row(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                const JKImage("assets/images/ic_caibao.png", size: 20).padding(left: 5, right: 5, top: 5),
                NoticeCarousel(
                    notices: noticeFinancialData.map((e) {
                  if (e is Map) {
                    return (e["title"] as String?) ?? "";
                  }
                  return "";
                }).toList())
              ]).board(height: 45, top: 1),
        noticeEventData.isEmpty
            ? const SizedBox()
            : Row(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                JKHoverDropdown(
                  title: "",
                  options: noticeEventData.map((e) {
                    if (e is Map) {
                      return (e["title"] as String?) ?? "";
                    }
                    return "";
                  }).toList(),
                  itemBuilder: (index) {
                    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const JKImage("assets/images/ic_notice.png", size: 20),
                      JKText(
                        index,
                        color: JKStyle.theme.white,
                        textAlign: TextAlign.start,
                        maxLines: 2,
                        fontSize: 12,
                      ).board(width: 220, height: 35, paddigLeft: 5)
                    ]).board(paddigTop: 5, paddigbottom: 5, bottom: 1);
                  },
                  onSelected: (v, _) {},
                  isSelected: false,
                  image: "assets/images/ic_notice.png",
                  offset: const Offset(-250, -150),
                  hoverColor: null,
                  width: 250,
                  imageSize: 20,
                  itemHeight: 48,
                ).padding(left: 5, right: 5, top: 5),
                NoticeCarousel(
                    notices: noticeEventData.map((e) {
                  if (e is Map) {
                    return (e["title"] as String?) ?? "";
                  }
                  return "";
                }).toList())
              ]).board(height: 45, top: 1),
        Row(
          mainAxisAlignment: hideRelateList ? MainAxisAlignment.center : MainAxisAlignment.spaceAround,
          children: ssss,
        ).board(height: 26, bottom: 1, top: 1),
        Expanded(
          child: isSelectedRelatedList
              ? JKTable(
                  isLoading: isRelatedLoading,
                  data: relateList,
                  columns: const [
                    JKTableColumn("股票", alignment: Alignment.centerLeft, width: 60),
                    JKTableColumn("现价", width: 72),
                    JKTableColumn("涨跌幅%", alignment: Alignment.center, width: 75),
                    JKTableColumn("总市值", width: 72),
                  ],
                  cellBuilder: JKStockUpdateRowBuilder(builder: (context, initData, pre, market, aft, index) {
                    var info = Utils.getStockChanged(market.lastClose, market.close);
                    var (mv, _, _, _) = Utils.getStockInfo(initData.extend.totalShare, market.close);
                    return [
                      JKTableRow(JKText(initData.code, fontSize: 12, color: JKStyle.theme.pinkTextColor)),
                      JKTableRow(JKFlash(JKText(market.close.asFixed(3), color: info.item4, fontSize: 12))),
                      JKTableRow(JKFlash(JKStockText(info.item2, bgColor: info.item3, fontSize: 12).board(width: 60), align: Alignment.center)),
                      JKTableRow(JKFlash(JKText(Utils.friendlyUnit(mv), color: info.item3, fontSize: 12))),
                    ];
                  }),
                  onDoubleTapCell: (item, _) {
                    // StockInfo code = StockInfo(code: item["ticker"], name: item["name"] ?? "--");
                    // eventBus.fire(code);
                    KLineManager.shared.selectedChartController.setStockInfo(code: item.code, name: item.name ?? "--");
                  },
                )
              : ExchangeStreamWidget(
                  code: KLineManager.shared.selectedChartController.stockCode,
                  preClose: preClose,
                  key: ValueKey(stockCode),
                ),
        )
      ],
    );
  }

  Widget quoteCell(String title, String value, String title2, String value2, {Color? color, Color? color2, double fixLeft = 8.0}) {
    color ??= JKStyle.theme.white;
    color2 ??= JKStyle.theme.white;
    return Row(children: [
      Row(
        children: [
          JKText(title, fontSize: 13, color: JKStyle.theme.textGreyColor2),
          SizedBox(width: 85, child: JKText(value, fontSize: 13, color: color, textAlign: TextAlign.left).padding(left: 8))
        ],
      ).padding(left: 5),
      Row(
        children: [
          SizedBox(width: 50, child: JKText(title2, fontSize: 13, color: JKStyle.theme.textGreyColor2)),
          JKText(value2, fontSize: 13, color: color2).padding(left: fixLeft != 8 ? 5 : 8),
        ],
      ).padding(left: fixLeft)
    ]);
  }
}

class CheckboxPicker extends StatefulWidget {
  CheckboxPicker({required this.titles, required this.height, required this.width, required this.selecteds, required this.onChanged, this.itemHeight = 25, super.key});
  bool isSingle = false;
  List<String> titles;
  double height;
  double itemHeight;
  double width;
  Set<String> selecteds;
  final Function(Set<String>) onChanged;
  @override
  State<CheckboxPicker> createState() => _CheckboxPickerState();
}

class _CheckboxPickerState extends State<CheckboxPicker> {
  @override
  void initState() {
    super.initState();
    widget.selecteds.clear();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
        height: widget.height,
        child: JKScrollView(
            thumbVisibility: true,
            child: Column(
              children: List.generate(widget.titles.length, (index) {
                var item = widget.titles[index];
                var isSelected = widget.selecteds.contains(item);
                var perfix = widget.isSingle ? "single" : "mult";
                return JKHover(
                    hoverColor: JKStyle.themeColor,
                    child: GestureDetector(
                      onTap: () {
                        if (isSelected) {
                          widget.selecteds.remove(item);
                        } else {
                          widget.selecteds.add(item);
                        }
                        widget.onChanged?.call(widget.selecteds);
                        setState(() {});
                      },
                      child: Row(children: [
                        Image.asset(
                          "assets/images/checkbox_${perfix}_${isSelected ? "sel" : "nor"}.png",
                          width: 20,
                          height: 20,
                        ).padding(left: 5, right: 5),
                        SizedBox(
                          width: widget.width,
                          child: Text(
                            item,
                            style: TextStyle(color: JKStyle.theme.white, fontSize: 14),
                          ),
                        )
                      ]).board(paddigTop: 2, paddigbottom: 2),
                    )).board(height: widget.itemHeight);
              }),
            )));
  }
}

class NoticeCarousel extends StatefulWidget {
  final List<String> notices;
  final Duration duration;

  NoticeCarousel({
    required this.notices,
    this.duration = const Duration(seconds: 5),
  });

  @override
  _NoticeCarouselState createState() => _NoticeCarouselState();
}

class _NoticeCarouselState extends State<NoticeCarousel> {
  int _currentIndex = 0;
  late Timer _timer;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void dispose() {
    _stopTimer();
    _scrollController.dispose();
    super.dispose();
  }

  var isForward = true;
  void _startTimer() {
    _timer = Timer.periodic(widget.duration, (timer) {
      setState(() {
        if (_currentIndex == 0) {
          isForward = true;
        } else if (_currentIndex == widget.notices.length - 1) {
          isForward = false;
        }
        if (isForward) {
          _currentIndex = (_currentIndex + 1) % widget.notices.length;
        } else {
          _currentIndex = (_currentIndex - 1) % widget.notices.length;
        }
        _scrollToIndex(_currentIndex);
      });
    });
  }

  void _stopTimer() {
    _timer.cancel();
  }

  void _scrollToIndex(int index) {
    _scrollController.animateTo(
      index * 45.0,
      duration: const Duration(milliseconds: 800),
      curve: Curves.linear,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: ListView.builder(
        controller: _scrollController,
        itemCount: widget.notices.length,
        itemBuilder: (context, index) {
          return AnimatedSwitcher(
            duration: const Duration(milliseconds: 800),
            child: JKText(
              widget.notices[index],
              color: JKStyle.theme.white,
              key: ValueKey(index),
              fontSize: 13,
              maxLines: 2,
              textAlign: TextAlign.left,
            ).board(width: 350, height: 45),
          ).board(height: 45, paddigTop: 4);
        },
      ),
    );
  }
}
