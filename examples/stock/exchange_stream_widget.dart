import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:mgjkn/debug.dart';
import 'package:mgjkn/desktop/jk_style.dart';
import 'package:mgjkn/desktop/stock/stock_update_manager.dart';
import 'package:mgjkn/extensions/extension_widget.dart';
import 'package:mgjkn/network/network.dart';
import 'package:mgjkn/notification.dart';
import 'package:mgjkn/Util/utils.dart';
import 'package:mgjkn/widgets/widget.dart';

class ExchangeStreamWidget extends StatefulWidget {
  const ExchangeStreamWidget({required this.code, this.preClose, super.key});
  final String code;
  final String? preClose;

  @override
  State<ExchangeStreamWidget> createState() => _ExchangeStreamWidgetState();
}

class _ExchangeStreamWidgetState extends State<ExchangeStreamWidget> {
  late Timer timer;

  var dataList = [];
  final ScrollController _scrollController = ScrollController();

  late StreamSubscription<StockVolChangeEvent> eBus;

  @override
  void initState() {
    updateList();
    eBus = eventBus.on<StockVolChangeEvent>().listen((event) {
      if (event.data.first == widget.code && mounted) {
        //  0 股票  1时间  2价格 3数量
        var li = [event.data[1], event.data[2], event.data[3]];
        dataList.insert(0, li);
        setState(() {});
      }
    });
    Debug.marketRefreshMap["ExchangeStreamWidget"] = () {
      updateList();
    };

    StockUpdateManager.shared.subscribeVol(widget.code, hashCode);
    super.initState();
  }

  updateList() {
    network.getRealTimeVol(widget.code).then((ResultData res) {
      if (res.success) {
        var l = (res.json["data"] as List?) ?? [];
        dataList.clear();
        for (var item in l) {
          dataList.add([item["t"], item["p"], item["v"]]);
        }
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    StockUpdateManager.shared.unSubscribeVol(widget.code, hashCode);
    eBus.cancel();
    Debug.marketRefreshMap.remove("ExchangeStreamWidget");
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
        reverse: true,
        itemCount: dataList.length,
        controller: _scrollController,
        physics: const NeverScrollableScrollPhysics(),
        itemBuilder: (context, index) {
          var item = dataList[index];
          var time = item[0].toString().substring(10, 19);
          var price = item[1].toString();
          var vol = item[2].toString();
          var color = JKStyle.theme.white;
          if (widget.preClose != null) {
            var info = Utils.getStockChanged(widget.preClose, price);
            color = info.item4;
          }
          return Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              JKText(time, textAlign: TextAlign.left).board(width: 100),
              JKText(vol, color: color).board(width: 50),
              JKText(price.asFixed(3), color: color, textAlign: TextAlign.right)
                  .board(width: 60),
            ],
          ).padding(vertical: 2, horizontal: 10);
        });
  }
}
