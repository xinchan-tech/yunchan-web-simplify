import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'package:mgjkn/debug.dart';
import 'package:mgjkn/desktop/logger.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/settings_widget.dart';
import 'package:mgjkn/desktop/stock/backtest/backtest_menu.dart';
import 'package:mgjkn/desktop/stock/chan_data_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/indicator/indicator_menu.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_data_controller.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/kchart/state_enum.dart';
import 'package:mgjkn/desktop/stock/panit/paint_enum.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/notification.dart';

import 'package:mgjkn/widgets/widget.dart';
import 'chart_style.dart';
import 'entity/info_window_entity.dart';
import 'entity/k_line_entity.dart';
import 'utils/number_util.dart';
import 'renderer/chat_painter.dart';

class KChartWidget extends StatefulWidget {
  final KLineDataController dataController;

  final double height;
  final double width;

  KChartWidget({super.key, required this.width, required this.height, required this.dataController});

  @override
  _KChartWidgetState createState() => _KChartWidgetState();
}

class _KChartWidgetState extends State<KChartWidget> with SingleTickerProviderStateMixin {
  bool isLongPress = false;

  double maxScroll = 0;
  double minScroll = 0;
  double scaleX = 1.0;

  // 放大时的 放大点
  double scaleIndex = 0;

  // 长按时选中的点
  Offset selectPoint = const Offset(0, 0);
  Offset scalePoint = const Offset(0, 0);

  late StreamController<InfoWindowEntity> mInfoWindowStream;

  @override
  void initState() {
    super.initState();
    mInfoWindowStream = StreamController<InfoWindowEntity>();

    // 第一次显示时候,用来计算与右边距的
    widget.dataController.scrollX = -(widget.width / 5) + widget.dataController.candleWidth / 2;
    // sliderWidth = calculateSliderWidth();
    // logger.d("init scrollX ${widget.dataController.scrollX}");
    // JKStyle.caculateIndicatorChart(widget.height, widget.dataController.indicatorChartMap.length);
  }

  @override
  void dispose() {
    mInfoWindowStream.close();
    super.dispose();
  }

  handleMouseScroll(Offset offset, Offset location) {
    if (offset.dy == 0) return;
    if (widget.dataController.stockTime.isTickTime) return;
    var idx = widget.dataController.indexFromX(location.dx).ceil();
    var dx = offset.dy > 0 ? -0.05 : 0.05;
    if (Platform.isWindows) {
      // windows 方向相反
      dx = dx * -1;
    }
    scaleX = (scaleX + dx).clamp(0.05, 3);

    widget.dataController.candleWidth = (ChartStyle.defaultcandleWidth * scaleX);

    // logger.d("candle: ${widget.dataController.candleWidth}");
    // sliderWidth = calculateSliderWidth();

    // 缩放固定视角
    if (idx >= 0) {
      var selectIndexOffset = idx * (widget.dataController.candleWidth);
      var x = selectIndexOffset - (widget.dataController.mWidth - location.dx) - widget.dataController.candleWidth / 2;
      widget.dataController.scrollX = (x).clamp(widget.dataController.minScroll, widget.dataController.maxScroll);
    }

    setState(() {});
  }

  var isPointerDown = false;
  var isPointerInYScale = false;
  var isTouchSlider = false;
  bool isSliderY(double touchY) {
    return (touchY > widget.height - ChartStyle.bottomDateHigh);
  }

  double sliderWidth = 0.0;
  double calculateSliderWidth() {
    // 当前一屏显示的个数的长度
    var klineChartWidth = (widget.width);

    if (widget.dataController.stockTime.isTickTime) {
      return klineChartWidth;
    }

    // 计算额外空余的个数
    var spaceCount = klineChartWidth * 0.8 / widget.dataController.candleWidth;
    // 单屏显示的个数
    var screenShowCount = klineChartWidth / widget.dataController.candleWidth;

    var slierWidth = screenShowCount / (widget.dataController.currentStock.datas.length + spaceCount) * klineChartWidth;

    return slierWidth;
  }

  var _lastTapUpTime = 0;

  List<JKRightMenuItem> menuItems = [];

  @override
  Widget build(BuildContext context) {
    if (menuItems.isEmpty) {
      menuItems = [
        JKRightMenuItem("主图坐标", options: ["价格坐标", "涨幅坐标", "双边坐标"], onTap: (context, item) {
          var ctl = KLineManager.shared.selectedChartController;
          switch (item) {
            case "价格坐标":
              ctl.yAxisType = JKYAxisType.price;
              break;
            case "涨幅坐标":
              ctl.yAxisType = JKYAxisType.percent;
              break;
            case "双边坐标":
              ctl.yAxisType = JKYAxisType.both;
              break;
            default:
              break;
          }
          Navigator.of(context).pop();
          ctl.refreshCanvas();
        }),
        JKRightMenuItem("附图数量", options: ["0个窗口", "1个窗口", "2个窗口", "3个窗口", "4个窗口", "5个窗口"], onTap: (context, item) {
          var ctl = KLineManager.shared.selectedChartController;
          var count = int.parse(item.substring(0, 1));
          if (count == 0) {
            ctl.indicatorChartMap.clear();
          }
          Map<String, IndicatorItem> newIndicators = {};
          for (var i = 1; i <= count; i++) {
            var item = ctl.indicatorChartMap[i.toString()];
            newIndicators[i.toString()] = item ?? ChanDataIndicator.bottomSignal.info.$2;
          }
          ctl.indicatorChartMap = newIndicators;
          // JKStyle.caculateIndicatorChart(widget.height, newIndicators.length);
          Navigator.of(context).pop();
          KLineManager.shared.selectedChartController.refreshCanvas();
        }),
      ];
    }

    // 所有K线绘制的总长度
    var dataLength = widget.dataController.currentStock.datas.length * widget.dataController.candleWidth;
    // canvas显示的宽度
    var canvasWidth = widget.width - widget.dataController.paddingRight - widget.dataController.paddingLeft;

    if (dataLength > widget.width) {
      maxScroll = dataLength - canvasWidth;
    } else {
      maxScroll = -(canvasWidth - dataLength);
    }
    var datsScroll = canvasWidth - dataLength;
    var normalminScroll = -(canvasWidth * 0.85) + widget.dataController.candleWidth / 2;
    minScroll = min(normalminScroll, -datsScroll);
    // logger.d("scrollX: ${widget.dataController.scrollX}, min: $minScroll");
    // if (dataLength > 0 && dataLength < widget.width && widget.dataController.scrollX == 0) {
    // widget.dataController.scrollX = (widget.dataController.scrollX).clamp(minScroll, maxScroll);
    // }

    widget.dataController.maxScroll = maxScroll;
    widget.dataController.minScroll = minScroll;

    var ctl = widget.dataController;
    sliderWidth = calculateSliderWidth();
    // logger.d("------build : ${ctl.frameId}");
    return ClipRect(
        child: RawKeyboardListener(
            onKey: (event) {
              switch (event.logicalKey) {
                case LogicalKeyboardKey.arrowUp:
                  if (Settings.mouseScrollToZoom) {
                    scaleX = (scaleX + 0.1).clamp(0.05, 5);
                    widget.dataController.candleWidth = ChartStyle.defaultcandleWidth * scaleX;
                    setState(() {});
                  } else {
                    if (event.isKeyPressed(LogicalKeyboardKey.arrowUp) == false) {
                      eventBus.fire(StockPoolSelectedStockChangedEvent(prev: true));
                    }
                  }

                  break;
                case LogicalKeyboardKey.arrowDown:
                  if (Settings.mouseScrollToZoom) {
                    scaleX = (scaleX - 0.1).clamp(0.05, 5);
                    widget.dataController.candleWidth = ChartStyle.defaultcandleWidth * scaleX;
                    setState(() {});
                  } else {
                    if (event.isKeyPressed(LogicalKeyboardKey.arrowDown) == false) {
                      eventBus.fire(StockPoolSelectedStockChangedEvent(next: true));
                    }
                  }

                  break;
                case LogicalKeyboardKey.arrowLeft:
                  widget.dataController.scrollX = (-20 + widget.dataController.scrollX).clamp(minScroll, maxScroll);
                  setState(() {});
                  break;
                case LogicalKeyboardKey.arrowRight:
                  widget.dataController.scrollX = (20 + widget.dataController.scrollX).clamp(minScroll, maxScroll);
                  setState(() {});
                  break;

                default:
                  break;
              }
            },
            focusNode: FocusNode(),
            child: MouseRegion(
              onEnter: (event) {
                isLongPress = true;
                setState(() {});
              },
              onExit: (event) {
                isLongPress = false;
                setState(() {});
              },
              cursor: isPointerInYScale ? SystemMouseCursors.resizeUpDown : MouseCursor.defer,
              child: Listener(
                  onPointerSignal: (event) {
                    if (event is PointerScrollEvent) {
                      handleMouseScroll(event.scrollDelta, event.localPosition);
                    } else {
                      logger.d("eventevent: $event");
                    }
                  },
                  onPointerDown: (event) {
                    if (event.buttons & kSecondaryMouseButton != 0) {
                      // 右键
                      var isRightDownHit = false;
                      // 先判断划线右键事件
                      ctl.paintManager.forEach((element) {
                        if (isRightDownHit == false) {
                          isRightDownHit = element.onMouseRightDown(event.localPosition, context: context);
                        }
                      });
                      if (isRightDownHit) return;
                      final RenderObject? overlay = Overlay.of(context).context.findRenderObject();
                      if (overlay is RenderBox) {
                        showMenu(
                          context: context,
                          color: JKStyle.theme.bgColor,
                          shape: RoundedRectangleBorder(
                            side: BorderSide(color: Colors.grey.shade800),
                            borderRadius: BorderRadius.circular(4), // 设置边框圆角
                          ),
                          position: RelativeRect.fromLTRB(
                            event.position.dx + 10,
                            event.position.dy,
                            MediaQuery.of(context).size.width,
                            MediaQuery.of(context).size.height - event.position.dy,
                          ),
                          constraints: const BoxConstraints(maxHeight: 150, maxWidth: 90),
                          items: List.generate(menuItems.length, (index) {
                            late Widget item;
                            var menuItem = menuItems[index];
                            var title = menuItem.title;
                            var subItems = menuItem.options;
                            if ((subItems).isEmpty) {
                              item = JKHover(
                                hoverColor: JKStyle.lightWhite,
                                child: JKText(title, color: JKStyle.theme.white).board(paddigLeft: 10, paddigRight: 10),
                              );
                            } else {
                              item = JKHover(
                                hoverColor: JKStyle.themeColor,
                                child: JKHoverDropdown(
                                  title: title,
                                  image: "assets/images/arrow_right.png",
                                  imageColor: JKStyle.lightWhite,
                                  hoverColor: JKStyle.lightWhite,
                                  options: subItems,
                                  onSelected: (selectedItem, _) {
                                    menuItem.onTap?.call(context, selectedItem);
                                  },
                                  isSelected: false,
                                  fontsize: 14,
                                  offset: const Offset(79, -70),
                                ).board(paddigLeft: 10),
                              );
                            }

                            return PopupMenuItem(
                              height: 20,
                              padding: const EdgeInsets.only(bottom: 5, left: 2),
                              mouseCursor: SystemMouseCursors.basic,
                              value: index,
                              child: item,
                            );
                          }),
                        ).then((value) {
                          if (value == null) return;
                          if (menuItems.safeAt(value)!.options.isNotEmpty) {
                            return;
                          }
                          ctl.refreshCanvas();
                        });
                      }
                    } else {
                      // 左键
                      isPointerDown = true;
                      if (ctl.paintManager.enablePaint) {
                        ctl.paintManager.prepare();
                        ctl.paintManager.forEach((element) {
                          element.onMouseDownBase(event.localPosition);
                        });
                        ctl.paintManager.currentPaint?.onDragBegin(event.localPosition);
                      }
                      // else if (BacktestManager.shared.isChoosing) {
                      //   //处理回测选择时间
                      //   BacktestManager.shared.onSelectedDate();
                      // }
                      setState(() {});
                    }
                  },
                  onPointerMove: (event) {
                    // logger.d("mov111 ${event.localDelta}");
                    if (ctl.paintManager.enablePaint) {
                      // logger.d("mov2222 ${event.localDelta}");
                      ctl.paintManager.currentPaint?.onDragMove(event.localPosition);
                    }

                    selectPoint = event.localPosition;

                    isLongPress = true;
                    setState(() {});
                  },
                  onPointerUp: (event) {
                    // 检测到手指抬起时，计算时间间隔判断是否为双击
                    final currentTime = DateTime.now().millisecondsSinceEpoch;

                    var d = currentTime - _lastTapUpTime;
                    if (d < 250) {
                      //双击灵敏度
                      ctl.paintManager.forEach((element) {
                        element.onDoubleClick(event.localPosition);
                      });
                    } else {
                      ctl.paintManager.forEach((element) {
                        element.onMouseUp(event.localPosition);
                      });
                    }
                    _lastTapUpTime = DateTime.now().millisecondsSinceEpoch;
                    isPointerDown = false;
                  },
                  onPointerHover: (event) {
                    ctl.mouseLocation = event.localPosition;
                    ctl.paintManager.currentPaint?.onMouseMoveBase(event.localPosition);
                    selectPoint = event.localPosition;
                    var notInPaddingLeft = event.localPosition.dx > ctl.paddingLeft;
                    var notInPaddingRight = event.localPosition.dx < widget.width - ctl.paddingRight;
                    var notInPaddingBottom = event.localPosition.dy < widget.height - ChartStyle.bottomDateHigh;
                    isLongPress = notInPaddingLeft && notInPaddingRight && notInPaddingBottom;
                    setState(() {});
                  },
                  child: GestureDetector(
                    // // 上下滑动
                    // onVerticalDragStart: (details) {
                    //   scalePoint = details.globalPosition - const Offset(JKStyle.leftMenuWidth + 50 + 1, 0);
                    // },
                    // onVerticalDragUpdate: (details) {
                    //   if (isPointerDown == false) {
                    //     if (ctl.paintManager.currentPaint?.isSelected == true) {
                    //       return;
                    //     }
                    //     handleMouseScroll(details.delta, scalePoint);
                    //   }
                    // },
                    // 新版手势
                    onPanStart: (details) {
                      isTouchSlider = isSliderY(selectPoint.dy);
                    },
                    onPanEnd: (details) {
                      isTouchSlider = false;
                    },
                    onPanUpdate: (details) {
                      //  水平滚动
                      if (details.delta.dx != 0) {
                        if (ctl.paintManager.currentPaint?.isSelected == true) {
                          return;
                        }

                        if (ctl.paintManager.currentPaintType != JKUserPathType.none) {
                          return;
                        }

                        // 处理滚动条
                        if (isTouchSlider) {
                          var rate = details.delta.dx / (widget.width - sliderWidth);
                          var scale = (maxScroll - minScroll) * rate;
                          widget.dataController.scrollX =
                              (widget.dataController.scrollX - scale).clamp(minScroll, maxScroll);
                          // logger.d("滚动条: max:$maxScroll min:$minScroll cur:${widget.dataController.scrollX}, scale: $scale");
                          setState(() {});
                          return;
                        }
                        widget.dataController.scrollX =
                            (details.delta.dx + widget.dataController.scrollX).clamp(minScroll, maxScroll);
                        // logger.d("widget.dataController.scrollX: ${widget.dataController.scrollX}");
                        setState(() {});
                      }
                    },
                    child: Stack(
                      children: <Widget>[
                        RepaintBoundary(
                            child: CustomPaint(
                          size: Size(widget.width, double.infinity),
                          painter: ChartPainter(
                            dataController: widget.dataController,
                            scaleX: scaleX,
                            selectPoint: selectPoint,
                            scalePoint: scalePoint,
                            sliderWidth: sliderWidth,
                            isLongPress: isLongPress,
                            sink: mInfoWindowStream.sink,
                          ),
                        )),
                        _buildInfoDialog().padding(right: ctl.paddingRight, left: ctl.paddingLeft)
                      ],
                    ),
                  )),
            )));
  }

  List<String> infoNames = ["", "开盘", "最高", "最低", "收盘", "涨跌额", "涨跌幅", "成交量"];
  List infos = [];

  Widget _buildInfoDialog() {
    return StreamBuilder<InfoWindowEntity>(
        stream: mInfoWindowStream.stream,
        builder: (context, snapshot) {
          if (!isLongPress || !snapshot.hasData) {
            return const SizedBox();
          }
          KLineEntity entity = snapshot.data!.kLineEntity;
          if (BacktestManager.shared.isEnable && entity.date.compareTo(BacktestManager.shared.startDate) > 0) {
            return const SizedBox();
          }

          double upDown = entity.close - entity.preClose;
          double upDownPercent = (upDown / entity.preClose) * 100;

          if (Debug.displayAll == 1) {
            infos = [
              entity.date,
              entity.open.toString(),
              entity.high.toString(),
              entity.low.toString(),
              entity.close.toString(),
              "${upDown > 0 ? "+" : ""}${NumberUtil.format(upDown)}",
              "${upDownPercent > 0 ? "+" : ''}${upDownPercent.toStringAsFixed(2)}%",
              NumberUtil.volFormat(entity.vol)
            ];
          } else {
            infos = [
              entity.date,
              NumberUtil.format(entity.open),
              NumberUtil.format(entity.high),
              NumberUtil.format(entity.low),
              NumberUtil.format(entity.close),
              "${upDown > 0 ? "+" : ""}${NumberUtil.format(upDown)}",
              "${upDownPercent > 0 ? "+" : ''}${upDownPercent.toStringAsFixed(2)}%",
              NumberUtil.volFormat(entity.vol)
            ];
          }

          var alignment = snapshot.data!.isLeft ? Alignment.topLeft : Alignment.topRight;
          return Align(
            alignment: alignment,
            child: Container(
              margin: EdgeInsets.only(left: 10, right: 10, top: KLineManager.shared.isMultipleFrame ? 35 : 25),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
              decoration: BoxDecoration(
                  color: JKStyle.theme.dividerColor,
                  border: Border.all(color: JKStyle.theme.dividerColorStrong),
                  borderRadius: const BorderRadius.all(Radius.circular(4))),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(infoNames.length, (i) {
                  if (i == 0) {
                    var time = infos[i];

                    if (time.isEmpty) {
                      return _buildItem("info", "infoName");
                    }
                    DateTime dateTime = DateTime.parse(infos[i]);
                    var week = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
                    if (widget.dataController.stockTime.rawValue.item1 < 1400) {
                      String formattedDate = DateFormat('MM-dd HH:mm').format(dateTime);
                      time = "$formattedDate ${week[dateTime.weekday - 1]}";
                    } else {
                      String formattedDate = DateFormat('yyy-MM-dd').format(dateTime);
                      time = "$formattedDate ${week[dateTime.weekday - 1]}";
                    }
                    return _buildItem("", time);
                  } else {
                    return _buildItem(infos[i], infoNames[i]);
                  }
                }),
              ),
            ),
          );
        });
  }

  Widget _buildItem(String info, String infoName) {
    Color color = JKStyle.theme.white;
    if (info.startsWith("+")) {
      color = JKStyle.riseColor;
    } else if (info.startsWith("-")) {
      color = JKStyle.fallColor;
    }

    return Container(
      constraints: const BoxConstraints(minWidth: 95, maxWidth: 110),
      height: 15,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: <Widget>[
          Text(infoName, style: TextStyle(color: JKStyle.theme.white, fontSize: ChartStyle.defaultTextSize)),
          const SizedBox(width: 5),
          Text(info, style: TextStyle(color: color, fontSize: ChartStyle.defaultTextSize)),
        ],
      ),
    );
  }
}

class JKRightMenuItem {
  String title;
  List options = [];
  final void Function(BuildContext, String)? onTap;
  String icon;

  JKRightMenuItem(this.title, {this.icon = "", this.onTap, this.options = const []});
}
