import 'package:flutter/material.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/panit/base_paint.dart';
import 'package:tuple/tuple.dart';
import 'package:mgjkn/desktop/logger.dart';

enum JKUserPathType {
  none,
  line, // 直线
  segment, // 线段
  ray, // 射线
  rect, // 矩形
  text, // 文本
  note, // 注解
  pencil, // 画笔
  parallel, // 平行线
  arrow, // 箭头
  horizontal, // 水平线
  vertical, // 垂直线
  wave, // 折线
  periodic, //等周期线
  fibonacci, //斐波那契
  golden, //黄金分割
  gann, // 江恩角度线
  wave3,
  wave5,
  wave8,
  amplitude, //幅度尺
  timeruler, //时间尺
  space, // 时空尺
  andrewFork,
  round,
  oval,
  arc,
  riseArrow,
  fallArrow,
  trendArrow,
  channel,
  waveRuler, //波浪尺
  headShoulder, // 头肩线
  speedResistance, // 速阻线
  gridLine, //栅行线
  measuringLine, //度量线
  box,
  wmLine,
  circumCircle, // 外接圆
  priceMark,
  floatingLine, //浮动线
  firewall, //防火墙
  supportLine, //支撑线
  pressureLine, //压力线
}

extension JKUserPathTypeExtension on JKUserPathType {
  /// paintId, 名称, 图片
  Tuple3<int, String, String> get getInfo {
    switch (this) {
      case JKUserPathType.none:
        return const Tuple3<int, String, String>(0, "无", "none");
      case JKUserPathType.line:
        return const Tuple3<int, String, String>(1, "直线", "assets/images/line_1.png");
      case JKUserPathType.segment:
        return const Tuple3<int, String, String>(2, "线段", "assets/images/line_3.png");
      case JKUserPathType.ray:
        return const Tuple3<int, String, String>(3, "射线", "assets/images/line_2.png");
      case JKUserPathType.rect:
        return const Tuple3<int, String, String>(4, "矩形", "assets/images/grap_1.png");
      case JKUserPathType.text:
        return const Tuple3<int, String, String>(5, "文本", "assets/images/tool_1.png");
      case JKUserPathType.note:
        return const Tuple3<int, String, String>(6, "注解", "assets/images/tool_2.png");
      case JKUserPathType.parallel:
        return const Tuple3<int, String, String>(7, "平行线", "assets/images/line_7.png");
      case JKUserPathType.arrow:
        return const Tuple3<int, String, String>(8, "箭头", "assets/images/line_4.png");
      case JKUserPathType.horizontal:
        return const Tuple3<int, String, String>(9, "水平线", "assets/images/line_5.png");
      case JKUserPathType.vertical:
        return const Tuple3<int, String, String>(10, "垂直线", "assets/images/line_6.png");
      case JKUserPathType.wave:
        return const Tuple3<int, String, String>(11, "折线", "assets/images/line_9.png");
      case JKUserPathType.periodic:
        return const Tuple3<int, String, String>(12, "等周期线", "assets/images/space_1.png");
      case JKUserPathType.fibonacci:
        return const Tuple3<int, String, String>(13, "斐波那契", "assets/images/space_2.png");
      case JKUserPathType.golden:
        return const Tuple3<int, String, String>(14, "黄金分割线", "assets/images/space_3.png");
      case JKUserPathType.gann:
        return const Tuple3<int, String, String>(15, "江恩角度线", "assets/images/space_4.png");
      case JKUserPathType.wave3:
        return const Tuple3<int, String, String>(16, "三浪线", "assets/images/space_5.png");
      case JKUserPathType.wave5:
        return const Tuple3<int, String, String>(17, "五浪线", "assets/images/space_6.png");
      case JKUserPathType.wave8:
        return const Tuple3<int, String, String>(18, "八浪线", "assets/images/space_7.png");
      case JKUserPathType.amplitude:
        return const Tuple3<int, String, String>(19, "空间尺", "assets/images/space_8.png");
      case JKUserPathType.timeruler:
        return const Tuple3<int, String, String>(20, "时间尺", "assets/images/space_9.png");
      case JKUserPathType.space:
        return const Tuple3<int, String, String>(21, "时空尺", "assets/images/space_19.png");
      case JKUserPathType.andrewFork:
        return const Tuple3<int, String, String>(22, "安德鲁音叉", "assets/images/space_17.png");
      case JKUserPathType.round:
        return const Tuple3<int, String, String>(23, "圆形", "assets/images/grap_3.png");
      case JKUserPathType.oval:
        return const Tuple3<int, String, String>(24, "椭圆", "assets/images/grap_2.png");
      case JKUserPathType.arc:
        return const Tuple3<int, String, String>(25, "圆弧", "assets/images/grap_4.png");
      case JKUserPathType.riseArrow:
        return const Tuple3<int, String, String>(26, "向上箭头", "assets/images/tool_3.png");
      case JKUserPathType.fallArrow:
        return const Tuple3<int, String, String>(27, "向下箭头", "assets/images/tool_4.png");
      case JKUserPathType.trendArrow:
        return const Tuple3<int, String, String>(28, "趋势箭头", "assets/images/tool_6.png");
      case JKUserPathType.channel:
        return const Tuple3<int, String, String>(29, "通道线", "assets/images/line_8.png");
      case JKUserPathType.waveRuler:
        return const Tuple3<int, String, String>(30, "波浪尺", "assets/images/space_10.png");
      case JKUserPathType.headShoulder:
        return const Tuple3<int, String, String>(31, "头肩形", "assets/images/space_16.png");
      case JKUserPathType.speedResistance:
        return const Tuple3<int, String, String>(32, "速阻线", "assets/images/space_11.png");
      case JKUserPathType.gridLine:
        return const Tuple3<int, String, String>(33, "栅行线", "assets/images/space_18.png");
      case JKUserPathType.measuringLine:
        return const Tuple3<int, String, String>(34, "度量目标线", "assets/images/space_12.png");
      case JKUserPathType.box:
        return const Tuple3<int, String, String>(35, "箱体", "assets/images/space_13.png");
      case JKUserPathType.wmLine:
        return const Tuple3<int, String, String>(36, "M头W底", "assets/images/space_14.png");
      case JKUserPathType.circumCircle:
        return const Tuple3<int, String, String>(37, "外接圆", "assets/images/grap_5.png");
      case JKUserPathType.priceMark:
        return const Tuple3<int, String, String>(38, "标价线", "assets/images/tool_7.png");
      case JKUserPathType.floatingLine:
        return const Tuple3<int, String, String>(39, "浮动止盈线", "assets/images/tool_8.png");
      case JKUserPathType.firewall:
        return const Tuple3<int, String, String>(40, "防火墙", "assets/images/tool_9.png");
      // case JKUserPathType.supportPressure:
      //   return const Tuple3<int, String, String>(41, "支撑压力线", "assets/images/tool_10.png");
      case JKUserPathType.pencil:
        return const Tuple3<int, String, String>(42, "画笔", "assets/images/tool_pen.png");
      case JKUserPathType.supportLine:
        return const Tuple3<int, String, String>(43, "支撑线", "assets/images/tool_10.png");
      case JKUserPathType.pressureLine:
        return const Tuple3<int, String, String>(44, "压力线", "assets/images/tool_10.png");
    }
  }

  static JKUserPathType from({required int paintId}) {
    for (var element in JKUserPathType.values) {
      if (element.getInfo.item1 == paintId) {
        return element;
      }
    }
    return JKUserPathType.none;
  }
}

extension JKUserPathInitExtension on JKUserPathType {
  /// 获取实例
  ShapeComponent get getPath {
    var ctl = KLineManager.shared.selectedChartController;
    var id = getInfo.item1;
    switch (this) {
      case JKUserPathType.none:
        return NoneComponent(dataController: ctl, paintId: id);
      case JKUserPathType.line:
        return LineComponent(dataController: ctl, paintId: id);
      case JKUserPathType.segment:
        return SegmentComponent(dataController: ctl, paintId: id);
      case JKUserPathType.ray:
        return RayComponent(dataController: ctl, paintId: id);
      case JKUserPathType.rect:
        return RectComponent(dataController: ctl, paintId: id);
      case JKUserPathType.text:
        return TextComponent(dataController: ctl, paintId: id);
      case JKUserPathType.note:
        return TextComponent(dataController: ctl, background: true, paintId: id);
      case JKUserPathType.parallel:
        return ParallelComponent(dataController: ctl, paintId: id);
      case JKUserPathType.arrow:
        return ArrowComponent(dataController: ctl, arrowType: 3, paintId: id);
      case JKUserPathType.horizontal:
        return HorizontalComponent(dataController: ctl, paintId: id);
      case JKUserPathType.vertical:
        return VerticalComponent(dataController: ctl, paintId: id);
      case JKUserPathType.wave:
        return WaveComponent(dataController: ctl, paintId: id);
      case JKUserPathType.periodic:
        return PeriodicComponent(dataController: ctl, paintId: id);
      case JKUserPathType.fibonacci:
        return FibonacciComponent(dataController: ctl, paintId: id);
      case JKUserPathType.golden:
        return GoldenComponent(dataController: ctl, paintId: id);
      case JKUserPathType.gann:
        return GannComponent(dataController: ctl, paintId: id);
      case JKUserPathType.wave3:
        return WaveComponent(waveNum: 3, dataController: ctl, free: false, paintId: id);
      case JKUserPathType.wave5:
        return WaveComponent(waveNum: 5, dataController: ctl, free: false, paintId: id);
      case JKUserPathType.wave8:
        return WaveComponent(waveNum: 8, dataController: ctl, free: false, paintId: id);
      case JKUserPathType.amplitude:
        return RulerComponent(dataController: ctl, isV: true, paintId: id);
      case JKUserPathType.timeruler:
        return RulerComponent(dataController: ctl, isH: true, paintId: id);
      case JKUserPathType.space:
        return RulerComponent(dataController: ctl, isH: true, isV: true, paintId: id);
      case JKUserPathType.andrewFork:
        return AndrewForkComponent(dataController: ctl, paintId: id);
      case JKUserPathType.round:
        return RoundComponent(dataController: ctl, paintId: id);
      case JKUserPathType.oval:
        return OvalComponent(dataController: ctl, paintId: id);
      case JKUserPathType.arc:
        return ArcComponent(dataController: ctl, paintId: id);
      case JKUserPathType.riseArrow:
        return ArrowComponent(dataController: ctl, arrowType: 1, paintId: id);
      case JKUserPathType.fallArrow:
        return ArrowComponent(dataController: ctl, arrowType: 2, paintId: id);
      case JKUserPathType.trendArrow:
        return ArrowComponent(dataController: ctl, arrowType: 0, paintId: id);
      case JKUserPathType.channel:
        return ParallelComponent(dataController: ctl, count: 2, paintId: id);
      case JKUserPathType.waveRuler:
        return WaveRluerComponent(dataController: ctl, paintId: id);
      case JKUserPathType.headShoulder:
        return HeadShoulderComponent(dataController: ctl, paintId: id);
      case JKUserPathType.speedResistance:
        return SpeedResistanceComponent(dataController: ctl, paintId: id);
      case JKUserPathType.gridLine:
        return ParallelComponent(dataController: ctl, count: 30, paintId: id);
      case JKUserPathType.measuringLine:
        return MeasuringLineComponent(dataController: ctl, paintId: id);
      case JKUserPathType.box:
        return BoxComponent(dataController: ctl, paintId: id);
      case JKUserPathType.wmLine:
        return WaveComponent(dataController: ctl, free: false, isWm: true, waveNum: 4, paintId: id);
      case JKUserPathType.circumCircle:
        return CircumCircleComponent(dataController: ctl, paintId: id);
      case JKUserPathType.priceMark:
        return PriceMarkComponent(dataController: ctl, paintId: id);
      case JKUserPathType.floatingLine:
        return HorizontalWithTextComponent(
            dataController: ctl, titles: ["浮动止盈"], paintId: id, textBackgroundColor: [JKStyle.fallColor]);
      case JKUserPathType.firewall:
        return HorizontalWithTextComponent(
            dataController: ctl,
            titles: ["止盈位", "买入位", "止损位"],
            textBackgroundColor: [Colors.blue, JKStyle.riseColor, JKStyle.fallColor],
            paintId: id);
      case JKUserPathType.supportLine:
        return HorizontalWithTextComponent(
            dataController: ctl, titles: ["支撑点"], textBackgroundColor: [Colors.blue], paintId: id);
      case JKUserPathType.pressureLine:
        return HorizontalWithTextComponent(
            dataController: ctl, titles: ["压力点"], textBackgroundColor: [Colors.purple], paintId: id);
      case JKUserPathType.pencil:
        return PencilComponent(dataController: ctl, paintId: id);
      default:
        logger.d("No Component Found.");
        return RectComponent(dataController: ctl, paintId: id);
    }
  }
}
