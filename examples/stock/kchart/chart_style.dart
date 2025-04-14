import 'package:flutter/material.dart';

class ChartColors {
  ChartColors._();

  //背景颜色
  static const Color bgColor = Color(0xff06141D);
  static const Color kLineColor = Color(0xff4C86CD);
  static const Color gridColor = Color.fromARGB(255, 50, 50, 50);
  static const Color kLineShadowColor = Color.fromARGB(255, 11, 106, 230); //k线阴影渐变
  static const List<Color> kRectShadowColor = [Color(0xFF0E1925), Color(0xFF0E2034)]; //k线阴影渐变
  static const Color ma5Color = Color(0xffC9B885);
  static const Color ma10Color = Color(0xff6CB0A6);
  static const Color ma30Color = Color(0xff9979C6);

  // static const Color upColor = Color.fromARGB(255, 60, 200, 100);
  static const Color upMaxColor = Colors.white;
  // static const Color dnColor = Color.fromARGB(255, 255, 74, 74);
  static const Color dnMaxColor = Colors.purple;

  static const Color volColor = Color(0xff4729AE);

  static const Color macdColor = Color(0xff4729AE);
  static const Color difColor = Color(0xffC9B885);
  static const Color deaColor = Color(0xff6CB0A6);

  static const Color kColor = Color(0xffC9B885);
  static const Color dColor = Color(0xff6CB0A6);
  static const Color jColor = Color(0xff9979C6);
  static const Color rsiColor = Color(0xffC9B885);

  static const Color wrColor = Color(0xffD2D2B4);

  static const Color yAxisTextColor = Color(0xA0E0E3EE); //右边y轴刻度
  static const Color xAxisTextColor = Color(0xff60738E); //下方时间刻度

  static const Color maxMinTextColor = Color(0xffffffff); //最大最小值的颜色

  //深度颜色
  static const Color depthBuyColor = Color(0xff60A893);
  static const Color depthSellColor = Color(0xffC15866);

  //选中后显示值边框颜色
  static const Color markerBorderColor = Color(0xffFFFFFF);

  //选中后显示值背景的填充颜色
  static const Color markerBgColor = Color(0xff0D1722);

  //实时线颜色等
  static const Color realTimeBgColor = Color(0xff0D1722);
  static const Color rightRealTimeTextColor = Color(0xff4C86CD);
  static const Color realTimeTextBorderColor = Color(0xffffffff);
  static const Color realTimeTextColor = Color(0xffffffff);

  //实时线
  static const Color realTimeLineColor = Color(0xffffffff);
  static const Color realTimeLongLineColor = Color(0xff4C86CD);
}

class ChartStyle {
  ChartStyle._();

  //蜡烛之间的间距
  static const double canldeMargin = 1;

  //蜡烛默认宽度
  static double defaultcandleWidth = 8;

  //蜡烛中间线的宽度
  static const double candleLineWidth = 1.5;

  //vol柱子宽度
  static const double volWidth = 8.5;

  //macd柱子宽度
  static const double macdWidth = 8.5;

  //垂直交叉线宽度
  static const double vCrossWidth = 8.5;

  //水平交叉线宽度
  static const double hCrossWidth = 1;

  //水平交叉线宽度
  // static const double rightTextPadding = 50;

  //网格
  static const int gridRows = 6, gridColumns = 6;

  //整个 canvas 的 padding
  static const double topPadding = 0, bottomDateHigh = 20.0, childTopPadding = 10.0;

  // 主图的padding
  static const double mainPaddingTop = 50.0, mainPaddingBottom = 50.0;

  static const double defaultTextSize = 12.0;

  //k线右边价格坐标价格字体
  static double rightTextFontSize = 12.0;
  // return const TextStyle(fontSize: 12, color: ChartColors.yAxisTextColor);
  // }

  //k线底部日期字体样式
  static TextStyle getDateTextStyle() {
    return const TextStyle(fontSize: ChartStyle.defaultTextSize, color: ChartColors.yAxisTextColor);
  }

  //指标列表文字样式
  static TextStyle getIndicatorTextStyle({bool isSelect = false}) {
    if (isSelect) {
      return const TextStyle(fontSize: 13, color: Color(0xffFFFFFF), fontWeight: FontWeight.bold);
    } else {
      return const TextStyle(fontSize: 13, color: Color(0xff3D536c), fontWeight: FontWeight.bold);
    }
  }
}
