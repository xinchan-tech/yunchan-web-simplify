import 'dart:math';
import 'package:flutter/material.dart';
import 'package:mgjkn/desktop/settings_widget.dart';
import 'package:mgjkn/desktop/stock/kchart/kline_manager.dart';
import 'package:mgjkn/desktop/stock/panit/paint_enum.dart';

abstract class JKAppTheme {
  Color get bgColor;
  Color get bgBlackColor;
  Color get subMenuBgColor;
  Color get mainMenuColor;
  // 分割线颜色,指同一个页面内的分割
  Color get dividerColor;
  // 不同页面分割线颜色,更亮一些分出层次感
  Color get dividerColorStrong;
  // Color get stockPickPageDividerColor;
  Color get thumbColor;
  Color get tableHeaderColor;
  Color get tableDividerColor;
  Color get tableHeaderFontColor;
  Color get textGreyColor2;
  Color get textGreyColor3;
  Color get white;
  Color get pinkTextColor;
  // Color get textFieldBgColor;
}

class AppDarkTheme extends JKAppTheme {
  @override
  Color bgColor = const Color.fromARGB(255, 20, 21, 25);
  @override
  Color mainMenuColor = const Color.fromARGB(255, 10, 10, 10);
  @override
  Color bgBlackColor = const Color.fromARGB(255, 20, 21, 25);
  @override
  Color subMenuBgColor = const Color.fromARGB(255, 20, 21, 25);
  @override
  Color dividerColor = const Color.fromARGB(255, 35, 35, 35);
  @override
  Color dividerColorStrong = const Color.fromARGB(255, 60, 60, 60);
  // @override
  // Color stockPickPageDividerColor = const Color.fromARGB(255, 60, 60, 60);
  @override
  Color thumbColor = const Color.fromRGBO(138, 138, 138, 0.2);
  @override
  Color tableHeaderColor = const Color(0xFF1E1F22);
  @override
  Color tableDividerColor = const Color.fromARGB(155, 0, 0, 0);
  @override
  Color tableHeaderFontColor = const Color.fromRGBO(180, 180, 180, 1);
  @override
  Color textGreyColor2 = const Color.fromRGBO(158, 158, 158, 1);
  @override
  Color textGreyColor3 = const Color.fromRGBO(80, 80, 80, 1);
  @override
  Color white = const Color.fromARGB(255, 238, 238, 238);
  // @override
  // Color textFieldBgColor = const Color.fromRGBO(33, 33, 33, 1);

  @override
  Color pinkTextColor = const Color(0xFFEEEEEE);
}

class AppLightTheme extends JKAppTheme {
  @override
  Color bgColor = const Color.fromARGB(255, 255, 255, 255);
  @override
  Color mainMenuColor = const Color.fromARGB(255, 242, 242, 242);
  @override
  Color bgBlackColor = const Color.fromARGB(255, 255, 255, 255);
  @override
  Color subMenuBgColor = const Color.fromARGB(255, 255, 255, 255);
  @override
  Color dividerColor = const Color.fromARGB(255, 238, 238, 238);
  @override
  Color dividerColorStrong = const Color.fromARGB(255, 203, 203, 203);
  @override
  Color thumbColor = const Color.fromRGBO(138, 138, 138, 0.2);
  @override
  Color tableHeaderColor = const Color.fromARGB(255, 242, 242, 242);
  @override
  Color tableDividerColor = const Color.fromARGB(255, 238, 238, 238);
  @override
  Color tableHeaderFontColor = const Color.fromRGBO(180, 180, 180, 1);
  @override
  Color textGreyColor2 = const Color.fromRGBO(158, 158, 158, 1);
  @override
  Color textGreyColor3 = const Color.fromARGB(255, 136, 136, 136);
  @override
  Color pinkTextColor = const Color.fromARGB(255, 18, 18, 18);
  @override
  Color white = const Color.fromARGB(255, 18, 18, 18);
}

class JKStyle {
  static JKAppTheme theme = AppDarkTheme();

  static Color lightWhite = const Color.fromARGB(255, 230, 230, 230);
  static Color chanPenColor = const Color(0xFFCCCCCC);
  static Color chanDashPenColor = const Color(0xFFAAAAAA);

  static Color chanSegmentPenColor = const Color(0xFFFF0000);
  static Color chanSegmentDashPenColor = const Color(0xFFEA06F3);

  static Color chanBlueColor = Color(0xCB315FFF);
  static Color chanPinkColor = Color(0xBCFF1DFC);
  // 上中枢
  static Color normalPivotRiseColor = const Color(0xB2007C37);
  static Color largePivotRiseColor = chanBlueColor;

  // 下中枢
  static Color normalPivotFallColor = const Color(0x9DF50D0D);
  static Color largePivotFallColor = chanPinkColor;

  //3类买点颜色
  static Color largeBuyColor = const Color(0xFF185EFF);
  static Color normalBuyColor = const Color(0xFF00B050);

  //3类卖点颜色
  static Color largeSaleColor = const Color(0xFFF323C5);
  static Color normalSaleColor = const Color(0xFFFE1818);

  // 中枢2颜色
  static Color pivot2ExtRiseColor = chanBlueColor;
  static Color pivot2ExtFallColor = chanPinkColor;

  // 中枢4颜色
  static Color pivot4ExtRiseColor = chanBlueColor;
  static Color pivot4ExtFallColor = chanPinkColor;

  static Color stockRed = Color(0xFFFF3248);
  static Color stockGreen = Color(0xFF00b058);

  static Color themeColor = const Color(0xFF3861F6);

  // static const Color bgColor = Color.fromARGB(255, 20, 21, 25);
  // static Color bgBlackColor = bgColor;
  // static Color subMenuBgColor = bgColor;
  // static const Color dividerColor = Color.fromRGBO(108, 108, 108, 0.2); //Color.fromARGB(155, 0, 0, 0);
  // static const Color thumbColor = Color.fromRGBO(138, 138, 138, 0.2);

  // static const Color tableHeaderColor = Color(0xFF1E1F22);
  // static const Color tableDividerColor = Color.fromARGB(155, 0, 0, 0);
  // static const Color tableHeaderFontColor = Color.fromRGBO(180, 180, 180, 1);

  // not controll
  static const double leftMenuWidth = 270;
  static const double rightMenuWidth = 280;
  static const double defaultChartHeight = 135.0;
  static double indicatorChartHeight = defaultChartHeight;

  static caculateIndicatorChart(double canvasHeight, int length) {
    var chartHeight = defaultChartHeight;
    if (KLineManager.shared.isMultipleFrame) {
      chartHeight = 70;
    }
    var mainChartHeight = canvasHeight - length * chartHeight;
    if (mainChartHeight < canvasHeight * 0.4) {
      indicatorChartHeight = canvasHeight * 0.6 / length;
    } else {
      indicatorChartHeight = chartHeight;
    }
  }

  static const Color redTextColor = Color.fromARGB(255, 255, 0, 128);

  static const double subTitleRowHeight = 25;

  static Color get riseColor {
    return Settings.greenUpRedDown ? JKStyle.stockGreen : JKStyle.stockRed;
  }

  static Color get fallColor {
    return Settings.greenUpRedDown ? JKStyle.stockRed : JKStyle.stockGreen;
  }

  static String colorImageName(String name, bool isRise) {
    if (isRise) {
      return "$name${Settings.greenUpRedDown ? "_green" : "_red"}";
    }
    return "$name${Settings.greenUpRedDown ? "_red" : "_green"}";
  }

  static Widget colorArrowImage(String increse, double size) {
    var i = double.tryParse(increse);
    if (i == null) {
      return const SizedBox();
    }
    var color = i > 0 ? riseColor : fallColor;
    var angle = (i > 0 ? 0 : 180) * pi / 180;
    return Transform.rotate(
        angle: angle,
        child: Image.asset(
          "assets/images/ic_up_arrow.png",
          width: size,
          height: size,
          color: color,
          isAntiAlias: true,
        ));
  }

  static int klinePageRightMenuType = 0;

  static const trendMenu = [
    JKUserPathType.line,
    JKUserPathType.ray,
    JKUserPathType.arrow,
    JKUserPathType.horizontal,
    JKUserPathType.vertical,
    JKUserPathType.parallel,
    JKUserPathType.channel,
    JKUserPathType.wave,
    JKUserPathType.wave3,
    JKUserPathType.wave5,
    JKUserPathType.wave8,
  ];

  static const graphicsMenu = [
    JKUserPathType.rect,
    JKUserPathType.round,
    JKUserPathType.oval,
    JKUserPathType.arc,
    JKUserPathType.circumCircle,
  ];

  static const spaceMenu = [
    JKUserPathType.periodic,
    JKUserPathType.fibonacci,
    JKUserPathType.golden,
    JKUserPathType.gann,
    JKUserPathType.amplitude,
    JKUserPathType.timeruler,
    JKUserPathType.space,
    JKUserPathType.waveRuler,
    JKUserPathType.speedResistance,
    JKUserPathType.measuringLine,
    JKUserPathType.box,
    JKUserPathType.wmLine,
    JKUserPathType.headShoulder,
    JKUserPathType.andrewFork,
    JKUserPathType.gridLine,
  ];

  static const toolMenu = [
    JKUserPathType.pencil,
    JKUserPathType.text,
    JKUserPathType.note,
    JKUserPathType.priceMark,
    JKUserPathType.riseArrow,
    JKUserPathType.fallArrow,
    JKUserPathType.trendArrow,
    JKUserPathType.floatingLine,
    JKUserPathType.firewall,
    JKUserPathType.supportLine,
    JKUserPathType.pressureLine,
  ];
}
