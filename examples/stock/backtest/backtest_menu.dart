import 'dart:async';
import 'dart:math';

import 'package:confetti/confetti.dart';
import 'package:mgjkn/desktop/logger.dart';
import 'package:flutter/material.dart';
import 'package:flutter_smart_dialog/flutter_smart_dialog.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/backtest/calendar_widget.dart';
import 'package:mgjkn/desktop/stock/kchart/entity/k_line_entity.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/renderer/base_chart_renderer.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/extensions/extension_widget.dart';

import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/widgets/widget.dart';
import 'package:tuple/tuple.dart';

class BacktestMenu extends StatefulWidget {
  const BacktestMenu({super.key});

  static double menuHeight = 40;

  @override
  State<BacktestMenu> createState() => _BacktestMenuState();
}

class _BacktestMenuState extends State<BacktestMenu> {
  var selectedSpeedIndex = 2;
  var editingController = TextEditingController();

  @override
  void initState() {
    super.initState();
    BacktestManager.shared.onUpdateWidget = () {
      setState(() {});
    };
  }

  @override
  void dispose() {
    super.dispose();
    BacktestManager.shared.onUpdateWidget = null;
  }

  @override
  Widget build(BuildContext context) {
    var incomeText = BacktestManager.shared.incomeText();
    var playPauseImage =
        BacktestManager.shared.isbackTesting ? "assets/images/ic_huice3.png" : "assets/images/ic_huice2.png";
    var startStr = BacktestManager.shared.startDateText.isEmpty ? "请选择时间" : BacktestManager.shared.startDateText;
    // var startTimeStr = BacktestManager.shared.startDate.isEmpty ? "请选择" : BacktestManager.shared.startDate;
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Row(children: [
        const JKText("开始时间: "),
        JKButton(
          startStr,
          // isSelected: true,
          width: 100,
          height: 24,
          onCtxPressed: (ctx) async {
            if (BacktestManager.shared.isbackTesting) {
              showToast("请先停止回测再选择时间");
              return;
            }
            SmartDialog.showAttach(
                targetContext: ctx,
                alignment: Alignment.topRight,
                maskColor: Colors.transparent,
                builder: (_) {
                  return JKCalendarWidget(
                    initialDate: DateTime.tryParse(BacktestManager.shared.startDate),
                    onSelected: (date) {
                      BacktestManager.shared.startDateText = Utils.formatDate(date, format: "yyyy-MM-dd");
                      setState(() {});
                      BacktestManager.shared.prepareData();
                    },
                  )
                      .board(
                        width: 300,
                        height: 310,
                        paddigAll: 5,
                        bgColor: JKStyle.theme.bgColor,
                        all: 1,
                        radius: 4,
                      )
                      .padding(bottom: 10);
                });
          },
        ).board(bgColor: JKStyle.theme.dividerColor, radius: 4).padding(left: 15),
      ]),
      Row(
        children: [
          // JKButton(
          //   "选择回测起点",
          //   tooltips: true,
          //   image: "assets/images/ic_huice1.png",
          //   imageSize: 2,
          //   width: 20,
          //   type: JKButtonType.selColor,
          //   // isSelected: BacktestManager.shared.isChoosing,
          //   selectedStyle: JKButtonStyle(fontColor: JKStyle.theme.white),
          //   onPressed: () {
          //     // BacktestManager.shared.isChoosing = !BacktestManager.shared.isChoosing;
          //     BacktestManager.shared.stopTimer();
          //     setState(() {});
          //   },
          // ),
          JKButton("开始/暂停", image: playPauseImage, imageSize: 2, width: 20, tooltips: true, onPressed: () {
            BacktestManager.shared.startOrPauseTimer();
            setState(() {});
          }).padding(horizontal: 15),
          JKButton(BacktestManager.shared.speedList[selectedSpeedIndex][0] as String, tooltips: "回测速度", width: 50,
              onCtxPressed: (ctx) {
            SmartDialog.showAttach(
                targetContext: ctx,
                alignment: Alignment.topCenter,
                maskColor: Colors.transparent,
                builder: (_) {
                  return Column(children: [
                    const JKText("回放速度"),
                    Column(
                        children: List.generate(BacktestManager.shared.speedList.length, (index) {
                      var item = BacktestManager.shared.speedList[index];
                      return JKHover(
                          hoverColor: JKStyle.themeColor,
                          child: Row(children: [
                            JKText(item[0].toString()).padding(right: 5, top: 5, bottom: 5),
                            JKText(item[1].toString(), color: Colors.grey.shade700).padding(vertical: 5),
                          ]).action(() {
                            BacktestManager.shared.everySecond = item[2] as int;
                            selectedSpeedIndex = index;
                            SmartDialog.dismiss();
                            setState(() {});
                          }).padding(left: 10));
                    }))
                  ]).board(
                      all: 1, width: 150, bgColor: JKStyle.theme.bgColor, radius: 4, paddigTop: 5, paddigbottom: 5);
                });
          }).board(all: 1, height: 24, radius: 4),
          JKButton("下一条K线", image: "assets/images/ic_huice4.png", tooltips: true, width: 20, imageSize: 2,
              onPressed: () {
            BacktestManager.shared.nextStep();
          }).padding(horizontal: 15),
          JKButton(
            "跳转至实时",
            tooltips: true,
            image: "assets/images/ic_huice6.png",
            imageSize: 2,
            width: 20,
            onPressed: () {
              BacktestManager.shared.startIndex = 0;
            },
          ),
        ],
      ),
      Row(
        children: [
          JKText(incomeText.item1, color: incomeText.item2).padding(right: 10),
          JKButton(
            "卖出",
            normalStyle: JKButtonStyle(bgColor: JKStyle.fallColor, fontColor: JKStyle.theme.white),
            type: JKButtonType.bgColor,
            width: 60,
            height: 24,
            onPressed: () {
              BacktestManager.shared.onSell();
            },
          ),
          JKButton(
            minWidth: 70,
            BacktestManager.shared.transactionCount.toString(),
            type: JKButtonType.boardSelColor,
            height: 24,
            onCtxPressed: (ctx) {
              SmartDialog.showAttach(
                  alignment: Alignment.topCenter,
                  maskColor: Colors.transparent,
                  targetContext: ctx,
                  builder: (_) {
                    var nums = [1, 5, 25, 100, 500, 1000];
                    return StatefulBuilder(builder: (context, _setState) {
                      if (editingController.hasListeners) {
                        editingController.removeListener(() {});
                      }
                      editingController.addListener(() {
                        var count = int.tryParse(editingController.text);
                        if (count == null || count < 0) {
                          count = 0;
                          editingController.text = "0";
                        }
                        BacktestManager.shared.transactionCount = count;
                        Future.delayed(Duration(microseconds: 100)).then((value) {
                          // setState(() {});
                          // _setState(() {});
                        });
                      });
                      editingController.text = BacktestManager.shared.transactionCount.toString();
                      return Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
                        const JKText("数量").padding(vertical: 5),
                        JKTextField(hintText: "输入买入数量", controller: editingController)
                            .board(all: 1, height: 30)
                            .padding(horizontal: 14),
                        Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                          JKHover(
                            hoverColor: JKStyle.themeColor,
                            child: const JKText("-", center: true),
                          )
                              .board(
                            width: 50,
                            height: 24,
                            all: 1,
                            radius: 4,
                          )
                              .action(() {
                            BacktestManager.shared.transactionCount -= 1;
                            _setState(() {});
                            setState(() {});
                          }),
                          JKHover(
                            hoverColor: JKStyle.themeColor,
                            child: const JKText("清零", center: true),
                          )
                              .board(
                            width: 50,
                            height: 24,
                            all: 1,
                            radius: 4,
                          )
                              .action(() {
                            BacktestManager.shared.transactionCount = 0;
                            _setState(() {});
                            setState(() {});
                          }),
                          JKHover(
                            hoverColor: JKStyle.themeColor,
                            child: const JKText("+", center: true),
                          )
                              .board(
                            width: 50,
                            height: 24,
                            all: 1,
                            radius: 4,
                          )
                              .action(() {
                            BacktestManager.shared.transactionCount += 1;
                            _setState(() {});
                            setState(() {});
                          }),
                        ]).padding(vertical: 10, horizontal: 10),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: List.generate(
                              nums.length,
                              (index) => JKHover(
                                    hoverColor: JKStyle.themeColor,
                                    child: JKText(nums[index].toString(), center: true),
                                  )
                                      .board(
                                    width: 50,
                                    height: 24,
                                    all: 1,
                                    radius: 4,
                                  )
                                      .action(() {
                                    BacktestManager.shared.transactionCount += nums[index];
                                    setState(() {});
                                    _setState(() {});
                                  })

                              // JKButton(
                              //   nums[index].toString(),
                              //   width: 50,
                              //   height: 24,
                              //   type: JKButtonType.boardSelColor,
                              //   hoverColor: JKStyle.themeColor,
                              //   onPressed: () {

                              //   },
                              // ),
                              ),
                        )
                      ])
                          .board(width: 200, bgColor: JKStyle.theme.bgColor, all: 1, paddigbottom: 20, radius: 3)
                          .padding(bottom: 10);
                    });
                  });
            },
          ).padding(horizontal: 10),
          JKButton(
            "买入",
            normalStyle: JKButtonStyle(bgColor: JKStyle.riseColor, fontColor: JKStyle.theme.white),
            type: JKButtonType.bgColor,
            width: 60,
            height: 24,
            onPressed: () {
              BacktestManager.shared.onBuy();
            },
          ),
          JKButton(
            "平仓",
            type: JKButtonType.boardSelColor,
            width: 60,
            height: 24,
            onPressed: () {
              BacktestManager.shared.onSell(all: true);
            },
          ).padding(left: 10),
        ],
      ),
    ]).board(height: BacktestMenu.menuHeight, top: 1, paddigRight: 20, paddigLeft: 20, paddigTop: 5, paddigbottom: 5);
  }
}

class BacktestManager {
  BacktestManager._();
  static final BacktestManager shared = BacktestManager._();

  BuildContext? context;
  Function? onUpdateWidget;
  Timer? timer;

  bool _isEnable = false;
  bool get isEnable => _isEnable;
  set isEnable(bool enable) {
    _isEnable = enable;
    // isChoosing = enable;
    startIndex = -1;
    startDate = "";
    if (enable == false) {
      stopTimer();
    }
  }

  int startIndex = -1;
  String startDate = "";
  String startDateText = "";

  var tickCount = 0;
  var everySecond = 10; // 默认: 10*100ms = 1秒
  var transactionCount = 100;

  void prepareData() {
    BacktestManager.shared.startDate = BacktestManager.shared.startDateText;
    var dateStr = "${BacktestManager.shared.startDate} 00:00:00";
    var li = KLineManager.shared.selectedChartController.currentStock.dateIndex;
    for (var i = 0; i < li.length; i++) {
      var item = li[i];
      if (item.compareTo(dateStr) < 0) {
        BacktestManager.shared.startIndex = i + 1;
        break;
      }
    }
    BacktestManager.shared.resetData();
    var ctl = KLineManager.shared.selectedChartController;
    ctl.scrollX = BacktestManager.shared.startIndex * ctl.candleWidth - 200;
  }

  void resetData() {
    stopTimer();
    totalCost = 0.0;
    totalCount = 0;
    income = 0.0;
    averageCost = 0.0;
    winCount = 0;
    winMax = 0;
    transactions.clear();
  }

  var speedList = [
    //100毫秒为基准的倍数
    ["x10", "每秒更新10次", 1],
    ["x3", "每秒更新3次", 3],
    ["x1", "每秒更新1次", 10],
    ["x0.5", "每2秒更新1次", 20],
    ["x0.3", "每3秒更新1次", 30],
    ["x0.1", "每10秒更新1次", 100]
  ];

  void nextStep({int count = 1}) {
    startIndex -= count;
    if (startIndex <= 0) {
      startIndex = 0;
    }
    var point = getCurrentPoint();
    if (point != null) {
      startDate = point.date;
      var ctl = KLineManager.shared.selectedChartController;
      ctl.scrollX -= ctl.candleWidth;
      ctl.refreshCanvas();
    } else {
      logger.d("测试结束1");
      onReward();
      stopTimer();
    }

    if (startIndex == 0) {
      logger.d("测试结束2");
      onReward();
      stopTimer();
    }
  }

  bool get isbackTesting => timer != null;

  KLineEntity? getCurrentPoint({int? index}) {
    var idx = index ?? startIndex;
    var curIndex = KLineManager.shared.selectedChartController.currentStock.datas.length - idx - 1;
    return KLineManager.shared.selectedChartController.currentStock.datas.safeAt(curIndex);
  }

  ///{"2024-05-01":["B",2220,183.23]}
  Map<String, List<dynamic>> transactions = {};

  double income = 0.0; //落地收入
  double totalCost = 0.0; //总成本
  int totalCount = 0; //总数量
  double averageCost = 0.0; //平均成本
  Tuple2 incomeText() {
    if (income == 0) {
      return const Tuple2("0.00", Colors.grey);
    }
    var symbol = income > 0 ? "+" : "";
    var color = income > 0 ? JKStyle.riseColor : JKStyle.fallColor;
    return Tuple2("$symbol${Utils.asFixed(income)} USD", color);
  }

  ///浮盈
  double get floatSurplus {
    var point = getCurrentPoint();
    if (point != null) {
      return totalCount * point.close - averageCost * totalCount;
    }
    return 0;
  }

  final _controllerCenter = ConfettiController(duration: const Duration(milliseconds: 100));
  onReward() {
    onSell(all: true);
    var title = income > 0 ? "恭喜, 交易员!" : "再接再厉, 交易员!";
    var incomeText = income > 0 ? "+${income.toStringAsFixed(2)}" : income.toStringAsFixed(2);
    var winMaxText = winMax > 0 ? "+${winMax.toStringAsFixed(2)}" : winMax.toStringAsFixed(2);
    var incomeColor = income > 0 ? JKStyle.riseColor : JKStyle.fallColor;
    if (income > 1000 || income < -1000) {
      incomeText = income > 0 ? "+${(income / 1000).toStringAsFixed(2)}K" : "${(income / 1000).toStringAsFixed(2)}K";
    }
    var winRate = winCount / max(transactions.length, 1);
    var stockCode = KLineManager.shared.selectedChartController.currentStock.stockCode;
    var stockTime = KLineManager.shared.selectedChartController.currentStock.stockTime.rawValue.item2;

    showPageSheet(
      context!,
      width: 700,
      height: 400,
      Stack(alignment: Alignment.center, children: [
        Align(
          alignment: Alignment.center,
          child: ConfettiWidget(
              confettiController: _controllerCenter,
              blastDirectionality: BlastDirectionality.explosive,
              numberOfParticles: 50,
              emissionFrequency: 1,
              maximumSize: const Size(10, 35),
              minimumSize: const Size(5, 10),
              gravity: 0.05,
              colors: const [Colors.green, Colors.blue, Colors.pink, Colors.orange, Colors.purple, Colors.amberAccent]),
        ),
        Column(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            Column(
              children: [
                JKText(title, fontSize: 40),
                JKText("您在 $stockCode - $stockTime 的回测中", fontSize: 20).padding(top: 15),
              ],
            ),
            Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const JKText("现金盈利", fontSize: 20),
                  Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        JKText(incomeText, fontSize: 28, color: incomeColor),
                        const JKText("USD", fontSize: 14).padding(left: 5, bottom: 5)
                      ])
                ],
              ).board(all: 1, width: 210, height: 120, radius: 5),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const JKText("成功率", fontSize: 20),
                  JKText(Utils.asFixed(winRate, isPercent: true, fractionDigits: 2), fontSize: 28, color: incomeColor),
                ],
              ).board(all: 1, width: 210, height: 120, radius: 5),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const JKText("最赚钱的交易", fontSize: 20),
                  Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        JKText(winMaxText, fontSize: 28, color: incomeColor),
                        const JKText("USD", fontSize: 14).padding(left: 5, bottom: 5)
                      ])
                ],
              ).board(all: 1, width: 210, height: 120, radius: 5)
            ]),
            SizedBox(height: 20)
          ],
        )
      ]),
    );
    if (income > 0) {
      _controllerCenter.play();
    }
    BacktestManager.shared.resetData();
    BacktestManager.shared.onUpdateWidget?.call();
  }

  void onBuy() {
    if (transactionCount <= 0) {
      return;
    }
    var point = getCurrentPoint();
    if (point != null) {
      totalCost += point.close * transactionCount;
      totalCount += transactionCount;
      averageCost = totalCost / totalCount;
      var li = transactions[point.date] ?? [];
      li.add(["B", transactionCount, point.close]);
      transactions[point.date] = li;
      KLineManager.shared.selectedChartController.refreshCanvas();
    }
    BacktestManager.shared.onUpdateWidget?.call();
  }

  int winCount = 0;
  double winMax = 0.0;
  void onSell({bool all = false}) {
    if (totalCount <= 0) {
      return;
    }
    int sellCount = transactionCount > totalCount ? totalCount : transactionCount;
    if (all) {
      sellCount = totalCount;
    }
    var point = getCurrentPoint();
    if (point != null) {
      // 计算盈利
      double r = (point.close - averageCost) * sellCount;
      if (r > 0) {
        winCount++;
        winMax = max(winMax, r);
      }
      income += r;
      totalCost -= averageCost * sellCount;
      totalCount -= sellCount;

      var li = transactions[point.date] ?? [];
      li.add(["S", sellCount, point.close]);
      transactions[point.date] = li;
      KLineManager.shared.selectedChartController.refreshCanvas();
    }
    BacktestManager.shared.onUpdateWidget?.call();
  }

  void startOrPauseTimer() {
    if (isbackTesting) {
      stopTimer();
    } else {
      startTimer();
    }
  }

  void startTimer() {
    stopTimer();
    tickCount = 0;
    timer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      tickCount++;
      if (tickCount % everySecond == 0) {
        nextStep();
      }
    });
  }

  void stopTimer() {
    if (timer != null) {
      timer?.cancel();
      timer = null;
    }
  }

  void drawBuySales(Canvas canvas, String date, double curX, lowY, highY) {
    var li = transactions[date] ?? [];
    if (li.isNotEmpty) {
      var bCount = 0;
      var sCount = 0;
      for (var item in li) {
        var price = Utils.asFixed(item[2]);
        if (item[0] == "B") {
          canvas.drawText(
              "↑买入 ${item[1]}\n\$$price", Offset(curX, lowY + 10 + (bCount * 30)), Colors.grey.shade400, 10);
          bCount++;
        } else {
          canvas.drawText(
              "\$$price\n↓卖出 ${item[1]}", Offset(curX, highY - 30 - (sCount * 30)), Colors.grey.shade400, 10);
          sCount++;
        }
      }
    }
  }

  void drawAvgCost(Canvas canvas, BaseChartRenderer renderer, double curX, lowY, highY) {
    if (!isbackTesting) return;
    if (averageCost.isNaN) return;

    var y = renderer.getY(averageCost);
    var canvasWidth = canvas.getDestinationClipBounds().width;
    canvas.drawDashLine(Offset(0, y), Offset(canvasWidth, y), color: Colors.grey.shade700, lineWidth: 1);

    var offset = Offset(15, y - 8);
    TextPainter tp = TextPainter(
        text: TextSpan(
            text: "$totalCount Ι ${Utils.asFixed(averageCost)} Ι",
            style: TextStyle(color: JKStyle.theme.white, fontSize: 14)),
        textDirection: TextDirection.ltr);
    tp.layout();

    var paint = Paint()..color = Colors.grey.shade700;
    canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(offset.dx - 5, offset.dy, tp.width + 10, tp.height), const Radius.circular(3)),
        paint);

    tp.paint(canvas, offset);

    var valueColor = floatSurplus >= 0 ? JKStyle.riseColor : JKStyle.fallColor;
    var valueSymbol = floatSurplus >= 0 ? "+" : "";
    canvas.drawText(
        "$valueSymbol${Utils.asFixed(floatSurplus)} USD", Offset(15 + tp.width + 5, offset.dy), valueColor, 14,
        backgroundColor: Colors.grey.shade700);
  }

  // void drawLongPressCrossLine(Canvas canvas, Size size,
  //     {int selectedIndex = -1, double curX = 0, double mWidth = 0, int length = 0}) {
  //   var point = getCurrentPoint(index: selectedIndex);
  //   if (point != null) {
  //     startIndex = selectedIndex;
  //     startDate = point.date;
  //     logger.d("backTest: startDate :$startDate, startIndex: $startIndex");
  //     Paint paintY = Paint()
  //       ..color = JKStyle.themeColor
  //       ..strokeWidth = 2
  //       ..isAntiAlias = true;

  //     double x = mWidth - curX;
  //     canvas.drawLine(Offset(x, ChartStyle.topPadding), Offset(x, size.height - ChartStyle.bottomDateHigh), paintY);
  //     canvas.drawText("选择起点", Offset(x - 26, size.height - 40), JKStyle.theme.white, 14, backgroundColor: JKStyle.themeColor);
  //     canvas.drawText(point.date, Offset(x - 38, size.height - 20), JKStyle.theme.white, 14,
  //         backgroundColor: JKStyle.themeColor);
  //   }
  // }
}
