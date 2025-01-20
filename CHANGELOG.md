# Changelog

## [1.17.0](https://github.com/xinchan-gx/yunchan-web/compare/1.4.0...1.17.0) (2025-01-20)

### ✨ Features | 新功能

* 调整大盘图表轴标签显示间隔，优化时间格式化逻辑 ([cd9090a](https://github.com/xinchan-gx/yunchan-web/commit/cd9090ae7c39aa265ae07a33d0bcce267621cc9d))
* 调整股票闪烁动画时长，优化价格闪烁逻辑，增加随机延迟效果 ([9fcffbd](https://github.com/xinchan-gx/yunchan-web/commit/9fcffbd6cc708120bdbfa7a03884254809913d4a))
* 更新 Apple 登录重定向 URI，使用环境变量配置 ([bb0b389](https://github.com/xinchan-gx/yunchan-web/commit/bb0b389abf142a457d82fc35ab991bfe9360094d))
* 更新 ECharts 类型定义，添加 StockChartInterval 支持，优化时间处理逻辑 ([035307e](https://github.com/xinchan-gx/yunchan-web/commit/035307e4bf68754785f7faa18e11d67440e238e5))
* 更新 JknIcon 导入方式，添加 rc-table 类型定义，优化代码结构 ([b099825](https://github.com/xinchan-gx/yunchan-web/commit/b099825d52ec16a45725aed287dbf42e37d4e510))
* 更新 klinecharts 依赖至 10.0.0-alpha2，优化缓冲区处理逻辑，增加最大缓冲区限制，重构时间处理函数 ([f934113](https://github.com/xinchan-gx/yunchan-web/commit/f9341133a4287852657c46ff13e3cd86e95af05d))
* 更新 WebSocket URL 构建逻辑，支持动态主机和端口配置 ([d0d5e85](https://github.com/xinchan-gx/yunchan-web/commit/d0d5e8573da74f4245554c48d744416ace4c912c))
* 更新第三方登录接口，添加 appid 参数以支持更好的平台识别 ([52d0fb7](https://github.com/xinchan-gx/yunchan-web/commit/52d0fb712286ee91a25f76f7aba33610b9e6d928))
* 更新股票路径，添加复选框钩子，优化表格数据处理逻辑，新增图标资源 ([c9963e2](https://github.com/xinchan-gx/yunchan-web/commit/c9963e2034e4609ad6e31eaa8c3d62ab39a67e3c))
* 更新股票相关接口，添加 StockExtendResultMap 支持，优化字段引用 ([e308978](https://github.com/xinchan-gx/yunchan-web/commit/e30897831ba85765939b07bf400276cc952fe8be))
* 更新时间存储接口，支持字符串和数字类型，添加新的自定义钩子以管理半控值，优化图表组件和数据处理逻辑 ([59239f0](https://github.com/xinchan-gx/yunchan-web/commit/59239f041b1030be2bb38177bd9211bf9f840b83))
* 更新指标参数处理逻辑，优化相关组件和API调用 ([4e8cce9](https://github.com/xinchan-gx/yunchan-web/commit/4e8cce9201f0ac418912b4bc865ebab5f327f0d8))
* 更新组件样式，优化输入框和表格布局，增强用户体验 ([81c2630](https://github.com/xinchan-gx/yunchan-web/commit/81c2630bd0e32a0eddf84dcfdba3474e44ed710d))
* 将消息队列处理从 requestIdleCallback 更改为 requestAnimationFrame，优化性能 ([a8fde30](https://github.com/xinchan-gx/yunchan-web/commit/a8fde30e98484d934199b6c346268173e2f4541e))
* 添加 dataZoom 事件监听，优化主图指标的动态展示逻辑 ([ec94b5c](https://github.com/xinchan-gx/yunchan-web/commit/ec94b5c8dde54a7c892536b76c2518b0cf341c7a))
* 添加 ECharts 类型扩展，优化绘图逻辑，调整坐标计算，确保图表在边界内绘制 ([867be43](https://github.com/xinchan-gx/yunchan-web/commit/867be4386d949b615de0cab2dea65c1a3d40acec))
* 添加 FRP 配置文件，优化 WebSocket 连接逻辑，更新用户状态管理，增强登录功能 ([aa8092d](https://github.com/xinchan-gx/yunchan-web/commit/aa8092d9bf1a6a822f44e2dcb068a74eb041b3d6))
* 添加 Google 和微信登录功能，优化登录体验 ([c2eec2b](https://github.com/xinchan-gx/yunchan-web/commit/c2eec2b28c753af02e5e4ec326c573d72f72703d))
* 添加 klinecharts 依赖，更新相关锁定文件 ([23f6d4e](https://github.com/xinchan-gx/yunchan-web/commit/23f6d4ef7260de82d6e8015b7ddf1b8fa5b2ae8e))
* 添加 NumSpanSubscribe 组件，优化股票价格和百分比的实时更新逻辑 ([d84d307](https://github.com/xinchan-gx/yunchan-web/commit/d84d307b817154fde5cc308bf3ecd90fc9ea3625))
* 添加 NumSpanSubscribe 组件，优化股票数据订阅逻辑，重构相关引用和更新处理 ([5845fd8](https://github.com/xinchan-gx/yunchan-web/commit/5845fd8c569e5a31da1747a8bf5cfe0d0b94104e))
* 添加 plateId 字段，优化开发环境下的扫描逻辑，移除无用日志，重构股票数据订阅，优化表格数据处理，调整组件样式和逻辑 ([d2fa409](https://github.com/xinchan-gx/yunchan-web/commit/d2fa409411f2548a7c2bd8b9ea348a5b65f777a5))
* 添加 SubscribeSpan 组件以订阅股票数据，优化数据格式化和状态管理逻辑 ([48e7265](https://github.com/xinchan-gx/yunchan-web/commit/48e7265e39b25a25767b22aa48710638ae7331e1))
* 添加 useTableData 钩子，优化表格数据管理和排序功能，更新相关组件以支持新钩子 ([9afa65b](https://github.com/xinchan-gx/yunchan-web/commit/9afa65b946f8ba4387436769c356ecb08f7636ee))
* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/xinchan-gx/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加大盘指数数据获取，优化股票订阅逻辑和图表展示 ([ab06e4c](https://github.com/xinchan-gx/yunchan-web/commit/ab06e4cae553e81bd8b89467c2b2d1fc51857f0a))
* 添加调试日志，优化模态框打开逻辑 ([4b8b69b](https://github.com/xinchan-gx/yunchan-web/commit/4b8b69baf10669eb50d7c94f2f1b39abe15a55e1))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/xinchan-gx/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/xinchan-gx/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加股票订阅处理逻辑，优化数据更新和缓冲区管理 ([e7ba17a](https://github.com/xinchan-gx/yunchan-web/commit/e7ba17a2321be61a6978316b730cf1c074f268ce))
* 添加股票列表项组件，优化股票数据展示和动画效果 ([1389cd8](https://github.com/xinchan-gx/yunchan-web/commit/1389cd8175129e1500ada2918b4c3ce8fbff9230))
* 添加股票数据订阅功能，优化股票列表动态更新逻辑，增强用户体验 ([0bbfd48](https://github.com/xinchan-gx/yunchan-web/commit/0bbfd48601797e92b8b171918a4b6bc93ab14e14))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/xinchan-gx/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))
* 添加均线计算和买卖点计算功能，优化相关逻辑和类型定义 ([373bdd3](https://github.com/xinchan-gx/yunchan-web/commit/373bdd39c320db51a487f3f86d6acb25d679e50b))
* 添加商城功能，包含产品获取和订单创建接口，更新路由和头部组件 ([5de2795](https://github.com/xinchan-gx/yunchan-web/commit/5de2795980a3dc6167e7780bd14f475148dd4e86))
* 添加时间索引选择功能，优化股票图表交互体验 ([555f409](https://github.com/xinchan-gx/yunchan-web/commit/555f40976c7c37b3a026dd5b5e0b85843ce814b5))
* 添加特色推送页面，整合股票推送数据，优化表格展示和交互功能 ([3dc28a8](https://github.com/xinchan-gx/yunchan-web/commit/3dc28a80ac634a96fec4328ecef7c0f484a53033))
* 添加指标参数编辑功能，优化二级指标组件逻辑 ([563b1de](https://github.com/xinchan-gx/yunchan-web/commit/563b1deb1ff371d0156015ee63d52ca3d7ca3f5e))
* 添加字符串宽度计算函数，更新股票数据结构，优化图表渲染逻辑，标记过时方法 ([6ba2a9c](https://github.com/xinchan-gx/yunchan-web/commit/6ba2a9ce14d45d9c15855b8b014a8af116b98010))
* 新增IM WebSocket连接配置，优化群聊页面的连接逻辑 ([ba3bf89](https://github.com/xinchan-gx/yunchan-web/commit/ba3bf895465223389813443a0e6a010230c8f32f))
* 移除调试日志，调整图表和绘制逻辑，优化代码可读性 ([8f7a522](https://github.com/xinchan-gx/yunchan-web/commit/8f7a5222cd301e345d367bf4ecce288f8217faae))
* 移除无用的日志，重构推送页面数据结构，新增推送周期和缠论信号字段，优化日期格式化逻辑，添加 dayjs 插件 ([a71f5ce](https://github.com/xinchan-gx/yunchan-web/commit/a71f5ce91fc569b53400f4fbd97f79f0165ebd7f))
* 优化登录表单，调整提交方式为按钮点击，提升用户体验 ([ba3a28e](https://github.com/xinchan-gx/yunchan-web/commit/ba3a28ea543c9a9fb0bac39b499bbec8b2c98022))
* 优化登录表单逻辑，支持通过用户名、Apple 和 Google 登录，更新登录成功回调 ([f3e0b51](https://github.com/xinchan-gx/yunchan-web/commit/f3e0b516cf66eea21a014bdd45145451b514c589))
* 优化股票池组件，添加排序功能，使用 useRef 存储原始数据，提升性能和可读性 ([98a09fa](https://github.com/xinchan-gx/yunchan-web/commit/98a09fa22643e34d7a86b6f231ea1ee7065663e7))
* 优化股票订阅符号生成逻辑，支持多种时间间隔 ([b19883c](https://github.com/xinchan-gx/yunchan-web/commit/b19883c5b1618b9910851e44d1d910b8ea11fff1))
* 优化股票订阅逻辑，调整缓冲区处理长度，增加最大缓冲区限制，清理无用代码 ([f41a19b](https://github.com/xinchan-gx/yunchan-web/commit/f41a19b3d53f76559ab19d022cd0784c88adf509))
* 优化股票订阅逻辑，移除冗余代码，增强组件性能和可读性 ([f13fd97](https://github.com/xinchan-gx/yunchan-web/commit/f13fd9751a66102d7869a59c26aecd252d2dd134))
* 优化股票价格更新逻辑，确保仅在相关股票数据变更时更新值 ([4fa23af](https://github.com/xinchan-gx/yunchan-web/commit/4fa23af0658a129ecc86e801be402d54c4d55378))
* 优化股票闪烁动画时长，更新 WebSocket 目标地址，重构表格数据更新逻辑，添加时间比较工具函数 ([16f712b](https://github.com/xinchan-gx/yunchan-web/commit/16f712b256aeb29b3a8906f7db7133e4cde550d3))
* 优化股票收集列表和时间管理逻辑，重构相关组件以提升性能和可读性 ([cb5fda2](https://github.com/xinchan-gx/yunchan-web/commit/cb5fda2a0baf812da9c9c48018c6048955c98d76))
* 优化股票数据处理，使用 Decimal 库确保数值精度 ([1b2cba9](https://github.com/xinchan-gx/yunchan-web/commit/1b2cba939f59d808d9d7e7597a54a526f3ae7987))
* 优化股票信息展示，增加交易时段处理逻辑，重构数据状态管理 ([0300f8a](https://github.com/xinchan-gx/yunchan-web/commit/0300f8a03a4064109a5b47e351310151eb3db71d))
* 优化时间处理逻辑，调整时间格式化和交易状态判断 ([3714cc9](https://github.com/xinchan-gx/yunchan-web/commit/3714cc94a8867ffd2ce78dc7cdeb4e07ebacf08c))
* 优化图表数据处理逻辑，调整数据切片长度，重构 JknRcTable 组件，添加虚拟表格支持，改进 useTableData 钩子，清理无用代码 ([a526358](https://github.com/xinchan-gx/yunchan-web/commit/a5263581c562182437536c53cd4bfbf8fc81153f))
* 优化主图和 x 轴图表的连接逻辑，调整 x 轴高度，更新默认选项以改善数据展示 ([252d0db](https://github.com/xinchan-gx/yunchan-web/commit/252d0db2193783b003fb1d69c7483ef59133d344))
* 增加对股票时间间隔的支持，添加半年和季度的比较逻辑，优化日期处理 ([c6981f4](https://github.com/xinchan-gx/yunchan-web/commit/c6981f45637a7f3dcef763d207bbb63328a080e2))
* 重构表格数据处理逻辑，更新相关引用，优化用户中心登出逻辑，调整组件样式，删除无用的 use-table-data 钩子 ([0f75793](https://github.com/xinchan-gx/yunchan-web/commit/0f75793c38f64367f5595a525927df73204799e4))
* 重构股票管理逻辑，更新相关引用为 stockUtils，新增 react-scan 依赖，优化假期和经济数据表格样式 ([1da1297](https://github.com/xinchan-gx/yunchan-web/commit/1da129776893c82b7ac2a357304a5c7cd629e994))
* 重构绘图函数，优化参数传递，简化线条绘制逻辑，移除不必要的计算 ([419908c](https://github.com/xinchan-gx/yunchan-web/commit/419908ce5ad45e73aad5f7afa621387e4dd88f61))
* 重构绘图逻辑，优化 ECharts 实例管理，增加 x 轴图表支持，调整数据更新逻辑 ([68af276](https://github.com/xinchan-gx/yunchan-web/commit/68af27690df59cd24a87bbf5bb9442860cea2dc3))

### 🐛 Bug Fixes | Bug 修复

* 更新股票树组件的面积计算逻辑 ([342e18e](https://github.com/xinchan-gx/yunchan-web/commit/342e18ec07ec703c488e30b80d03b51cb444df28))
* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/xinchan-gx/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))
* 修复若干问题 ([d8d3e7e](https://github.com/xinchan-gx/yunchan-web/commit/d8d3e7e26afa435dfcbe5df9ade4343f4933340a))
* 修复若干问题 ([3581f95](https://github.com/xinchan-gx/yunchan-web/commit/3581f9508658c64212d51e46ff7809a836fcdf88))
* 修复若干问题 ([fa34b90](https://github.com/xinchan-gx/yunchan-web/commit/fa34b90ea229e37d4864ae0c3d434503a4fa3443))
* 修复OSS客户端过期判断逻辑，确保在过期前返回有效客户端 ([a62cc22](https://github.com/xinchan-gx/yunchan-web/commit/a62cc2277c48c2b64af20c0ccee7d673757e3361))
* 修正步骤标题和注册函数的参数类型，优化代码结构 ([21ff825](https://github.com/xinchan-gx/yunchan-web/commit/21ff825e95e0ef87d00372305435d71528f14dce))
* 修正股票交易点击事件的参数，从 'code' 改为 'symbol' ([0d9497a](https://github.com/xinchan-gx/yunchan-web/commit/0d9497a47bfb541f2990a1f54bf09be0a9116cb4))
* trading添加周期判断 ([67b17cb](https://github.com/xinchan-gx/yunchan-web/commit/67b17cbd68bb241d3de3a583d7b2d8eb781aaa91))

### 🎫 Chores | 其他更新

* 移除调试日志，清理代码 ([71af72f](https://github.com/xinchan-gx/yunchan-web/commit/71af72f2db485836e47396bb65301627c76c31e7))
* Release v1.10.0 ([8dfe728](https://github.com/xinchan-gx/yunchan-web/commit/8dfe728de3ea1396d810360898644d44c7f05ce6))
* Release v1.11.0 ([0a95e66](https://github.com/xinchan-gx/yunchan-web/commit/0a95e669033cfdecd015e9747a047bc389931dfe))
* Release v1.12.0 ([2e1cc28](https://github.com/xinchan-gx/yunchan-web/commit/2e1cc28cf6273afd390359078515ac5dbf828ff7))
* Release v1.13.0 ([ae911a5](https://github.com/xinchan-gx/yunchan-web/commit/ae911a52508a1d511ceb8746086aeaacfd7a8023))
* Release v1.14.0 ([1630b65](https://github.com/xinchan-gx/yunchan-web/commit/1630b65f104538da59052a5dafb51c9631a2149f))
* Release v1.15.0 ([cf9c21e](https://github.com/xinchan-gx/yunchan-web/commit/cf9c21e5b1c964ee0d8b715641ebfde3b285d3f2))
* Release v1.16.0 ([6971a0b](https://github.com/xinchan-gx/yunchan-web/commit/6971a0b23276a65b0ca1f19d910d1f31319c5445))
* Release v1.17.0 ([b7931c1](https://github.com/xinchan-gx/yunchan-web/commit/b7931c18f8709a97c2a3fbdf749f2fa66d6953d8))
* Release v1.5.0 ([ec321f7](https://github.com/xinchan-gx/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/xinchan-gx/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))
* Release v1.7.0 ([a570920](https://github.com/xinchan-gx/yunchan-web/commit/a5709201f90e24fcb04df93a6f6d4f247d614576))
* Release v1.8.0 ([e9f1551](https://github.com/xinchan-gx/yunchan-web/commit/e9f15516161d61b36b326aa72b1072f5abb4c539))
* Release v1.8.1 ([7782db2](https://github.com/xinchan-gx/yunchan-web/commit/7782db2aa0ad37d61dc03d278622314fd676f124))
* Release v1.8.2 ([5ab5691](https://github.com/xinchan-gx/yunchan-web/commit/5ab5691efe63c0de666d898f7cdd61cad17fe1d9))
* Release v1.9.0 ([32b5465](https://github.com/xinchan-gx/yunchan-web/commit/32b5465f1b9b1db8defbedcaeebf5ec0e32bde75))

### ♻ Code Refactoring | 代码重构

* 移除未使用的 use-table-selection 和 use-cache-request 钩子，优化代码结构 ([d06d9f0](https://github.com/xinchan-gx/yunchan-web/commit/d06d9f0d608aaa2b4b5c8fd0bb15ab6c5ee09d2e))

## [1.16.0](https://github.com/xinchan-gx/yunchan-web/compare/1.4.0...1.16.0) (2025-01-17)

### ✨ Features | 新功能

* 调整大盘图表轴标签显示间隔，优化时间格式化逻辑 ([cd9090a](https://github.com/xinchan-gx/yunchan-web/commit/cd9090ae7c39aa265ae07a33d0bcce267621cc9d))
* 调整股票闪烁动画时长，优化价格闪烁逻辑，增加随机延迟效果 ([9fcffbd](https://github.com/xinchan-gx/yunchan-web/commit/9fcffbd6cc708120bdbfa7a03884254809913d4a))
* 更新 Apple 登录重定向 URI，使用环境变量配置 ([bb0b389](https://github.com/xinchan-gx/yunchan-web/commit/bb0b389abf142a457d82fc35ab991bfe9360094d))
* 更新 ECharts 类型定义，添加 StockChartInterval 支持，优化时间处理逻辑 ([035307e](https://github.com/xinchan-gx/yunchan-web/commit/035307e4bf68754785f7faa18e11d67440e238e5))
* 更新 JknIcon 导入方式，添加 rc-table 类型定义，优化代码结构 ([b099825](https://github.com/xinchan-gx/yunchan-web/commit/b099825d52ec16a45725aed287dbf42e37d4e510))
* 更新 klinecharts 依赖至 10.0.0-alpha2，优化缓冲区处理逻辑，增加最大缓冲区限制，重构时间处理函数 ([f934113](https://github.com/xinchan-gx/yunchan-web/commit/f9341133a4287852657c46ff13e3cd86e95af05d))
* 更新 WebSocket URL 构建逻辑，支持动态主机和端口配置 ([d0d5e85](https://github.com/xinchan-gx/yunchan-web/commit/d0d5e8573da74f4245554c48d744416ace4c912c))
* 更新第三方登录接口，添加 appid 参数以支持更好的平台识别 ([52d0fb7](https://github.com/xinchan-gx/yunchan-web/commit/52d0fb712286ee91a25f76f7aba33610b9e6d928))
* 更新股票路径，添加复选框钩子，优化表格数据处理逻辑，新增图标资源 ([c9963e2](https://github.com/xinchan-gx/yunchan-web/commit/c9963e2034e4609ad6e31eaa8c3d62ab39a67e3c))
* 更新股票相关接口，添加 StockExtendResultMap 支持，优化字段引用 ([e308978](https://github.com/xinchan-gx/yunchan-web/commit/e30897831ba85765939b07bf400276cc952fe8be))
* 更新时间存储接口，支持字符串和数字类型，添加新的自定义钩子以管理半控值，优化图表组件和数据处理逻辑 ([59239f0](https://github.com/xinchan-gx/yunchan-web/commit/59239f041b1030be2bb38177bd9211bf9f840b83))
* 更新指标参数处理逻辑，优化相关组件和API调用 ([4e8cce9](https://github.com/xinchan-gx/yunchan-web/commit/4e8cce9201f0ac418912b4bc865ebab5f327f0d8))
* 更新组件样式，优化输入框和表格布局，增强用户体验 ([81c2630](https://github.com/xinchan-gx/yunchan-web/commit/81c2630bd0e32a0eddf84dcfdba3474e44ed710d))
* 将消息队列处理从 requestIdleCallback 更改为 requestAnimationFrame，优化性能 ([a8fde30](https://github.com/xinchan-gx/yunchan-web/commit/a8fde30e98484d934199b6c346268173e2f4541e))
* 添加 dataZoom 事件监听，优化主图指标的动态展示逻辑 ([ec94b5c](https://github.com/xinchan-gx/yunchan-web/commit/ec94b5c8dde54a7c892536b76c2518b0cf341c7a))
* 添加 ECharts 类型扩展，优化绘图逻辑，调整坐标计算，确保图表在边界内绘制 ([867be43](https://github.com/xinchan-gx/yunchan-web/commit/867be4386d949b615de0cab2dea65c1a3d40acec))
* 添加 FRP 配置文件，优化 WebSocket 连接逻辑，更新用户状态管理，增强登录功能 ([aa8092d](https://github.com/xinchan-gx/yunchan-web/commit/aa8092d9bf1a6a822f44e2dcb068a74eb041b3d6))
* 添加 Google 和微信登录功能，优化登录体验 ([c2eec2b](https://github.com/xinchan-gx/yunchan-web/commit/c2eec2b28c753af02e5e4ec326c573d72f72703d))
* 添加 klinecharts 依赖，更新相关锁定文件 ([23f6d4e](https://github.com/xinchan-gx/yunchan-web/commit/23f6d4ef7260de82d6e8015b7ddf1b8fa5b2ae8e))
* 添加 NumSpanSubscribe 组件，优化股票价格和百分比的实时更新逻辑 ([d84d307](https://github.com/xinchan-gx/yunchan-web/commit/d84d307b817154fde5cc308bf3ecd90fc9ea3625))
* 添加 NumSpanSubscribe 组件，优化股票数据订阅逻辑，重构相关引用和更新处理 ([5845fd8](https://github.com/xinchan-gx/yunchan-web/commit/5845fd8c569e5a31da1747a8bf5cfe0d0b94104e))
* 添加 plateId 字段，优化开发环境下的扫描逻辑，移除无用日志，重构股票数据订阅，优化表格数据处理，调整组件样式和逻辑 ([d2fa409](https://github.com/xinchan-gx/yunchan-web/commit/d2fa409411f2548a7c2bd8b9ea348a5b65f777a5))
* 添加 SubscribeSpan 组件以订阅股票数据，优化数据格式化和状态管理逻辑 ([48e7265](https://github.com/xinchan-gx/yunchan-web/commit/48e7265e39b25a25767b22aa48710638ae7331e1))
* 添加 useTableData 钩子，优化表格数据管理和排序功能，更新相关组件以支持新钩子 ([9afa65b](https://github.com/xinchan-gx/yunchan-web/commit/9afa65b946f8ba4387436769c356ecb08f7636ee))
* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/xinchan-gx/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加大盘指数数据获取，优化股票订阅逻辑和图表展示 ([ab06e4c](https://github.com/xinchan-gx/yunchan-web/commit/ab06e4cae553e81bd8b89467c2b2d1fc51857f0a))
* 添加调试日志，优化模态框打开逻辑 ([4b8b69b](https://github.com/xinchan-gx/yunchan-web/commit/4b8b69baf10669eb50d7c94f2f1b39abe15a55e1))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/xinchan-gx/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/xinchan-gx/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加股票订阅处理逻辑，优化数据更新和缓冲区管理 ([e7ba17a](https://github.com/xinchan-gx/yunchan-web/commit/e7ba17a2321be61a6978316b730cf1c074f268ce))
* 添加股票列表项组件，优化股票数据展示和动画效果 ([1389cd8](https://github.com/xinchan-gx/yunchan-web/commit/1389cd8175129e1500ada2918b4c3ce8fbff9230))
* 添加股票数据订阅功能，优化股票列表动态更新逻辑，增强用户体验 ([0bbfd48](https://github.com/xinchan-gx/yunchan-web/commit/0bbfd48601797e92b8b171918a4b6bc93ab14e14))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/xinchan-gx/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))
* 添加均线计算和买卖点计算功能，优化相关逻辑和类型定义 ([373bdd3](https://github.com/xinchan-gx/yunchan-web/commit/373bdd39c320db51a487f3f86d6acb25d679e50b))
* 添加时间索引选择功能，优化股票图表交互体验 ([555f409](https://github.com/xinchan-gx/yunchan-web/commit/555f40976c7c37b3a026dd5b5e0b85843ce814b5))
* 添加特色推送页面，整合股票推送数据，优化表格展示和交互功能 ([3dc28a8](https://github.com/xinchan-gx/yunchan-web/commit/3dc28a80ac634a96fec4328ecef7c0f484a53033))
* 添加指标参数编辑功能，优化二级指标组件逻辑 ([563b1de](https://github.com/xinchan-gx/yunchan-web/commit/563b1deb1ff371d0156015ee63d52ca3d7ca3f5e))
* 添加字符串宽度计算函数，更新股票数据结构，优化图表渲染逻辑，标记过时方法 ([6ba2a9c](https://github.com/xinchan-gx/yunchan-web/commit/6ba2a9ce14d45d9c15855b8b014a8af116b98010))
* 新增IM WebSocket连接配置，优化群聊页面的连接逻辑 ([ba3bf89](https://github.com/xinchan-gx/yunchan-web/commit/ba3bf895465223389813443a0e6a010230c8f32f))
* 移除调试日志，调整图表和绘制逻辑，优化代码可读性 ([8f7a522](https://github.com/xinchan-gx/yunchan-web/commit/8f7a5222cd301e345d367bf4ecce288f8217faae))
* 移除无用的日志，重构推送页面数据结构，新增推送周期和缠论信号字段，优化日期格式化逻辑，添加 dayjs 插件 ([a71f5ce](https://github.com/xinchan-gx/yunchan-web/commit/a71f5ce91fc569b53400f4fbd97f79f0165ebd7f))
* 优化登录表单，调整提交方式为按钮点击，提升用户体验 ([ba3a28e](https://github.com/xinchan-gx/yunchan-web/commit/ba3a28ea543c9a9fb0bac39b499bbec8b2c98022))
* 优化登录表单逻辑，支持通过用户名、Apple 和 Google 登录，更新登录成功回调 ([f3e0b51](https://github.com/xinchan-gx/yunchan-web/commit/f3e0b516cf66eea21a014bdd45145451b514c589))
* 优化股票池组件，添加排序功能，使用 useRef 存储原始数据，提升性能和可读性 ([98a09fa](https://github.com/xinchan-gx/yunchan-web/commit/98a09fa22643e34d7a86b6f231ea1ee7065663e7))
* 优化股票订阅符号生成逻辑，支持多种时间间隔 ([b19883c](https://github.com/xinchan-gx/yunchan-web/commit/b19883c5b1618b9910851e44d1d910b8ea11fff1))
* 优化股票订阅逻辑，调整缓冲区处理长度，增加最大缓冲区限制，清理无用代码 ([f41a19b](https://github.com/xinchan-gx/yunchan-web/commit/f41a19b3d53f76559ab19d022cd0784c88adf509))
* 优化股票订阅逻辑，移除冗余代码，增强组件性能和可读性 ([f13fd97](https://github.com/xinchan-gx/yunchan-web/commit/f13fd9751a66102d7869a59c26aecd252d2dd134))
* 优化股票价格更新逻辑，确保仅在相关股票数据变更时更新值 ([4fa23af](https://github.com/xinchan-gx/yunchan-web/commit/4fa23af0658a129ecc86e801be402d54c4d55378))
* 优化股票闪烁动画时长，更新 WebSocket 目标地址，重构表格数据更新逻辑，添加时间比较工具函数 ([16f712b](https://github.com/xinchan-gx/yunchan-web/commit/16f712b256aeb29b3a8906f7db7133e4cde550d3))
* 优化股票收集列表和时间管理逻辑，重构相关组件以提升性能和可读性 ([cb5fda2](https://github.com/xinchan-gx/yunchan-web/commit/cb5fda2a0baf812da9c9c48018c6048955c98d76))
* 优化股票数据处理，使用 Decimal 库确保数值精度 ([1b2cba9](https://github.com/xinchan-gx/yunchan-web/commit/1b2cba939f59d808d9d7e7597a54a526f3ae7987))
* 优化股票信息展示，增加交易时段处理逻辑，重构数据状态管理 ([0300f8a](https://github.com/xinchan-gx/yunchan-web/commit/0300f8a03a4064109a5b47e351310151eb3db71d))
* 优化时间处理逻辑，调整时间格式化和交易状态判断 ([3714cc9](https://github.com/xinchan-gx/yunchan-web/commit/3714cc94a8867ffd2ce78dc7cdeb4e07ebacf08c))
* 优化图表数据处理逻辑，调整数据切片长度，重构 JknRcTable 组件，添加虚拟表格支持，改进 useTableData 钩子，清理无用代码 ([a526358](https://github.com/xinchan-gx/yunchan-web/commit/a5263581c562182437536c53cd4bfbf8fc81153f))
* 优化主图和 x 轴图表的连接逻辑，调整 x 轴高度，更新默认选项以改善数据展示 ([252d0db](https://github.com/xinchan-gx/yunchan-web/commit/252d0db2193783b003fb1d69c7483ef59133d344))
* 增加对股票时间间隔的支持，添加半年和季度的比较逻辑，优化日期处理 ([c6981f4](https://github.com/xinchan-gx/yunchan-web/commit/c6981f45637a7f3dcef763d207bbb63328a080e2))
* 重构表格数据处理逻辑，更新相关引用，优化用户中心登出逻辑，调整组件样式，删除无用的 use-table-data 钩子 ([0f75793](https://github.com/xinchan-gx/yunchan-web/commit/0f75793c38f64367f5595a525927df73204799e4))
* 重构股票管理逻辑，更新相关引用为 stockUtils，新增 react-scan 依赖，优化假期和经济数据表格样式 ([1da1297](https://github.com/xinchan-gx/yunchan-web/commit/1da129776893c82b7ac2a357304a5c7cd629e994))
* 重构绘图函数，优化参数传递，简化线条绘制逻辑，移除不必要的计算 ([419908c](https://github.com/xinchan-gx/yunchan-web/commit/419908ce5ad45e73aad5f7afa621387e4dd88f61))
* 重构绘图逻辑，优化 ECharts 实例管理，增加 x 轴图表支持，调整数据更新逻辑 ([68af276](https://github.com/xinchan-gx/yunchan-web/commit/68af27690df59cd24a87bbf5bb9442860cea2dc3))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/xinchan-gx/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))
* 修复若干问题 ([d8d3e7e](https://github.com/xinchan-gx/yunchan-web/commit/d8d3e7e26afa435dfcbe5df9ade4343f4933340a))
* 修复若干问题 ([3581f95](https://github.com/xinchan-gx/yunchan-web/commit/3581f9508658c64212d51e46ff7809a836fcdf88))
* 修复若干问题 ([fa34b90](https://github.com/xinchan-gx/yunchan-web/commit/fa34b90ea229e37d4864ae0c3d434503a4fa3443))
* 修复OSS客户端过期判断逻辑，确保在过期前返回有效客户端 ([a62cc22](https://github.com/xinchan-gx/yunchan-web/commit/a62cc2277c48c2b64af20c0ccee7d673757e3361))
* 修正股票交易点击事件的参数，从 'code' 改为 'symbol' ([0d9497a](https://github.com/xinchan-gx/yunchan-web/commit/0d9497a47bfb541f2990a1f54bf09be0a9116cb4))
* trading添加周期判断 ([67b17cb](https://github.com/xinchan-gx/yunchan-web/commit/67b17cbd68bb241d3de3a583d7b2d8eb781aaa91))

### 🎫 Chores | 其他更新

* 移除调试日志，清理代码 ([71af72f](https://github.com/xinchan-gx/yunchan-web/commit/71af72f2db485836e47396bb65301627c76c31e7))
* Release v1.10.0 ([8dfe728](https://github.com/xinchan-gx/yunchan-web/commit/8dfe728de3ea1396d810360898644d44c7f05ce6))
* Release v1.11.0 ([0a95e66](https://github.com/xinchan-gx/yunchan-web/commit/0a95e669033cfdecd015e9747a047bc389931dfe))
* Release v1.12.0 ([2e1cc28](https://github.com/xinchan-gx/yunchan-web/commit/2e1cc28cf6273afd390359078515ac5dbf828ff7))
* Release v1.13.0 ([ae911a5](https://github.com/xinchan-gx/yunchan-web/commit/ae911a52508a1d511ceb8746086aeaacfd7a8023))
* Release v1.14.0 ([1630b65](https://github.com/xinchan-gx/yunchan-web/commit/1630b65f104538da59052a5dafb51c9631a2149f))
* Release v1.15.0 ([cf9c21e](https://github.com/xinchan-gx/yunchan-web/commit/cf9c21e5b1c964ee0d8b715641ebfde3b285d3f2))
* Release v1.5.0 ([ec321f7](https://github.com/xinchan-gx/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/xinchan-gx/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))
* Release v1.7.0 ([a570920](https://github.com/xinchan-gx/yunchan-web/commit/a5709201f90e24fcb04df93a6f6d4f247d614576))
* Release v1.8.0 ([e9f1551](https://github.com/xinchan-gx/yunchan-web/commit/e9f15516161d61b36b326aa72b1072f5abb4c539))
* Release v1.8.1 ([7782db2](https://github.com/xinchan-gx/yunchan-web/commit/7782db2aa0ad37d61dc03d278622314fd676f124))
* Release v1.8.2 ([5ab5691](https://github.com/xinchan-gx/yunchan-web/commit/5ab5691efe63c0de666d898f7cdd61cad17fe1d9))
* Release v1.9.0 ([32b5465](https://github.com/xinchan-gx/yunchan-web/commit/32b5465f1b9b1db8defbedcaeebf5ec0e32bde75))

### ♻ Code Refactoring | 代码重构

* 移除未使用的 use-table-selection 和 use-cache-request 钩子，优化代码结构 ([d06d9f0](https://github.com/xinchan-gx/yunchan-web/commit/d06d9f0d608aaa2b4b5c8fd0bb15ab6c5ee09d2e))

## [1.15.0](https://github.com/xinchan-gx/yunchan-web/compare/1.4.0...1.15.0) (2025-01-16)

### ✨ Features | 新功能

* 调整大盘图表轴标签显示间隔，优化时间格式化逻辑 ([cd9090a](https://github.com/xinchan-gx/yunchan-web/commit/cd9090ae7c39aa265ae07a33d0bcce267621cc9d))
* 调整股票闪烁动画时长，优化价格闪烁逻辑，增加随机延迟效果 ([9fcffbd](https://github.com/xinchan-gx/yunchan-web/commit/9fcffbd6cc708120bdbfa7a03884254809913d4a))
* 更新 Apple 登录重定向 URI，使用环境变量配置 ([bb0b389](https://github.com/xinchan-gx/yunchan-web/commit/bb0b389abf142a457d82fc35ab991bfe9360094d))
* 更新 ECharts 类型定义，添加 StockChartInterval 支持，优化时间处理逻辑 ([035307e](https://github.com/xinchan-gx/yunchan-web/commit/035307e4bf68754785f7faa18e11d67440e238e5))
* 更新 JknIcon 导入方式，添加 rc-table 类型定义，优化代码结构 ([b099825](https://github.com/xinchan-gx/yunchan-web/commit/b099825d52ec16a45725aed287dbf42e37d4e510))
* 更新 klinecharts 依赖至 10.0.0-alpha2，优化缓冲区处理逻辑，增加最大缓冲区限制，重构时间处理函数 ([f934113](https://github.com/xinchan-gx/yunchan-web/commit/f9341133a4287852657c46ff13e3cd86e95af05d))
* 更新 WebSocket URL 构建逻辑，支持动态主机和端口配置 ([d0d5e85](https://github.com/xinchan-gx/yunchan-web/commit/d0d5e8573da74f4245554c48d744416ace4c912c))
* 更新第三方登录接口，添加 appid 参数以支持更好的平台识别 ([52d0fb7](https://github.com/xinchan-gx/yunchan-web/commit/52d0fb712286ee91a25f76f7aba33610b9e6d928))
* 更新股票路径，添加复选框钩子，优化表格数据处理逻辑，新增图标资源 ([c9963e2](https://github.com/xinchan-gx/yunchan-web/commit/c9963e2034e4609ad6e31eaa8c3d62ab39a67e3c))
* 更新股票相关接口，添加 StockExtendResultMap 支持，优化字段引用 ([e308978](https://github.com/xinchan-gx/yunchan-web/commit/e30897831ba85765939b07bf400276cc952fe8be))
* 更新时间存储接口，支持字符串和数字类型，添加新的自定义钩子以管理半控值，优化图表组件和数据处理逻辑 ([59239f0](https://github.com/xinchan-gx/yunchan-web/commit/59239f041b1030be2bb38177bd9211bf9f840b83))
* 更新指标参数处理逻辑，优化相关组件和API调用 ([4e8cce9](https://github.com/xinchan-gx/yunchan-web/commit/4e8cce9201f0ac418912b4bc865ebab5f327f0d8))
* 更新组件样式，优化输入框和表格布局，增强用户体验 ([81c2630](https://github.com/xinchan-gx/yunchan-web/commit/81c2630bd0e32a0eddf84dcfdba3474e44ed710d))
* 将消息队列处理从 requestIdleCallback 更改为 requestAnimationFrame，优化性能 ([a8fde30](https://github.com/xinchan-gx/yunchan-web/commit/a8fde30e98484d934199b6c346268173e2f4541e))
* 添加 dataZoom 事件监听，优化主图指标的动态展示逻辑 ([ec94b5c](https://github.com/xinchan-gx/yunchan-web/commit/ec94b5c8dde54a7c892536b76c2518b0cf341c7a))
* 添加 ECharts 类型扩展，优化绘图逻辑，调整坐标计算，确保图表在边界内绘制 ([867be43](https://github.com/xinchan-gx/yunchan-web/commit/867be4386d949b615de0cab2dea65c1a3d40acec))
* 添加 FRP 配置文件，优化 WebSocket 连接逻辑，更新用户状态管理，增强登录功能 ([aa8092d](https://github.com/xinchan-gx/yunchan-web/commit/aa8092d9bf1a6a822f44e2dcb068a74eb041b3d6))
* 添加 Google 和微信登录功能，优化登录体验 ([c2eec2b](https://github.com/xinchan-gx/yunchan-web/commit/c2eec2b28c753af02e5e4ec326c573d72f72703d))
* 添加 klinecharts 依赖，更新相关锁定文件 ([23f6d4e](https://github.com/xinchan-gx/yunchan-web/commit/23f6d4ef7260de82d6e8015b7ddf1b8fa5b2ae8e))
* 添加 NumSpanSubscribe 组件，优化股票价格和百分比的实时更新逻辑 ([d84d307](https://github.com/xinchan-gx/yunchan-web/commit/d84d307b817154fde5cc308bf3ecd90fc9ea3625))
* 添加 NumSpanSubscribe 组件，优化股票数据订阅逻辑，重构相关引用和更新处理 ([5845fd8](https://github.com/xinchan-gx/yunchan-web/commit/5845fd8c569e5a31da1747a8bf5cfe0d0b94104e))
* 添加 plateId 字段，优化开发环境下的扫描逻辑，移除无用日志，重构股票数据订阅，优化表格数据处理，调整组件样式和逻辑 ([d2fa409](https://github.com/xinchan-gx/yunchan-web/commit/d2fa409411f2548a7c2bd8b9ea348a5b65f777a5))
* 添加 SubscribeSpan 组件以订阅股票数据，优化数据格式化和状态管理逻辑 ([48e7265](https://github.com/xinchan-gx/yunchan-web/commit/48e7265e39b25a25767b22aa48710638ae7331e1))
* 添加 useTableData 钩子，优化表格数据管理和排序功能，更新相关组件以支持新钩子 ([9afa65b](https://github.com/xinchan-gx/yunchan-web/commit/9afa65b946f8ba4387436769c356ecb08f7636ee))
* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/xinchan-gx/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加大盘指数数据获取，优化股票订阅逻辑和图表展示 ([ab06e4c](https://github.com/xinchan-gx/yunchan-web/commit/ab06e4cae553e81bd8b89467c2b2d1fc51857f0a))
* 添加调试日志，优化模态框打开逻辑 ([4b8b69b](https://github.com/xinchan-gx/yunchan-web/commit/4b8b69baf10669eb50d7c94f2f1b39abe15a55e1))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/xinchan-gx/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/xinchan-gx/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加股票订阅处理逻辑，优化数据更新和缓冲区管理 ([e7ba17a](https://github.com/xinchan-gx/yunchan-web/commit/e7ba17a2321be61a6978316b730cf1c074f268ce))
* 添加股票列表项组件，优化股票数据展示和动画效果 ([1389cd8](https://github.com/xinchan-gx/yunchan-web/commit/1389cd8175129e1500ada2918b4c3ce8fbff9230))
* 添加股票数据订阅功能，优化股票列表动态更新逻辑，增强用户体验 ([0bbfd48](https://github.com/xinchan-gx/yunchan-web/commit/0bbfd48601797e92b8b171918a4b6bc93ab14e14))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/xinchan-gx/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))
* 添加均线计算和买卖点计算功能，优化相关逻辑和类型定义 ([373bdd3](https://github.com/xinchan-gx/yunchan-web/commit/373bdd39c320db51a487f3f86d6acb25d679e50b))
* 添加时间索引选择功能，优化股票图表交互体验 ([555f409](https://github.com/xinchan-gx/yunchan-web/commit/555f40976c7c37b3a026dd5b5e0b85843ce814b5))
* 添加特色推送页面，整合股票推送数据，优化表格展示和交互功能 ([3dc28a8](https://github.com/xinchan-gx/yunchan-web/commit/3dc28a80ac634a96fec4328ecef7c0f484a53033))
* 添加指标参数编辑功能，优化二级指标组件逻辑 ([563b1de](https://github.com/xinchan-gx/yunchan-web/commit/563b1deb1ff371d0156015ee63d52ca3d7ca3f5e))
* 移除调试日志，调整图表和绘制逻辑，优化代码可读性 ([8f7a522](https://github.com/xinchan-gx/yunchan-web/commit/8f7a5222cd301e345d367bf4ecce288f8217faae))
* 移除无用的日志，重构推送页面数据结构，新增推送周期和缠论信号字段，优化日期格式化逻辑，添加 dayjs 插件 ([a71f5ce](https://github.com/xinchan-gx/yunchan-web/commit/a71f5ce91fc569b53400f4fbd97f79f0165ebd7f))
* 优化登录表单，调整提交方式为按钮点击，提升用户体验 ([ba3a28e](https://github.com/xinchan-gx/yunchan-web/commit/ba3a28ea543c9a9fb0bac39b499bbec8b2c98022))
* 优化登录表单逻辑，支持通过用户名、Apple 和 Google 登录，更新登录成功回调 ([f3e0b51](https://github.com/xinchan-gx/yunchan-web/commit/f3e0b516cf66eea21a014bdd45145451b514c589))
* 优化股票池组件，添加排序功能，使用 useRef 存储原始数据，提升性能和可读性 ([98a09fa](https://github.com/xinchan-gx/yunchan-web/commit/98a09fa22643e34d7a86b6f231ea1ee7065663e7))
* 优化股票订阅符号生成逻辑，支持多种时间间隔 ([b19883c](https://github.com/xinchan-gx/yunchan-web/commit/b19883c5b1618b9910851e44d1d910b8ea11fff1))
* 优化股票订阅逻辑，调整缓冲区处理长度，增加最大缓冲区限制，清理无用代码 ([f41a19b](https://github.com/xinchan-gx/yunchan-web/commit/f41a19b3d53f76559ab19d022cd0784c88adf509))
* 优化股票订阅逻辑，移除冗余代码，增强组件性能和可读性 ([f13fd97](https://github.com/xinchan-gx/yunchan-web/commit/f13fd9751a66102d7869a59c26aecd252d2dd134))
* 优化股票价格更新逻辑，确保仅在相关股票数据变更时更新值 ([4fa23af](https://github.com/xinchan-gx/yunchan-web/commit/4fa23af0658a129ecc86e801be402d54c4d55378))
* 优化股票闪烁动画时长，更新 WebSocket 目标地址，重构表格数据更新逻辑，添加时间比较工具函数 ([16f712b](https://github.com/xinchan-gx/yunchan-web/commit/16f712b256aeb29b3a8906f7db7133e4cde550d3))
* 优化股票收集列表和时间管理逻辑，重构相关组件以提升性能和可读性 ([cb5fda2](https://github.com/xinchan-gx/yunchan-web/commit/cb5fda2a0baf812da9c9c48018c6048955c98d76))
* 优化股票数据处理，使用 Decimal 库确保数值精度 ([1b2cba9](https://github.com/xinchan-gx/yunchan-web/commit/1b2cba939f59d808d9d7e7597a54a526f3ae7987))
* 优化股票信息展示，增加交易时段处理逻辑，重构数据状态管理 ([0300f8a](https://github.com/xinchan-gx/yunchan-web/commit/0300f8a03a4064109a5b47e351310151eb3db71d))
* 优化时间处理逻辑，调整时间格式化和交易状态判断 ([3714cc9](https://github.com/xinchan-gx/yunchan-web/commit/3714cc94a8867ffd2ce78dc7cdeb4e07ebacf08c))
* 优化图表数据处理逻辑，调整数据切片长度，重构 JknRcTable 组件，添加虚拟表格支持，改进 useTableData 钩子，清理无用代码 ([a526358](https://github.com/xinchan-gx/yunchan-web/commit/a5263581c562182437536c53cd4bfbf8fc81153f))
* 优化主图和 x 轴图表的连接逻辑，调整 x 轴高度，更新默认选项以改善数据展示 ([252d0db](https://github.com/xinchan-gx/yunchan-web/commit/252d0db2193783b003fb1d69c7483ef59133d344))
* 增加对股票时间间隔的支持，添加半年和季度的比较逻辑，优化日期处理 ([c6981f4](https://github.com/xinchan-gx/yunchan-web/commit/c6981f45637a7f3dcef763d207bbb63328a080e2))
* 重构表格数据处理逻辑，更新相关引用，优化用户中心登出逻辑，调整组件样式，删除无用的 use-table-data 钩子 ([0f75793](https://github.com/xinchan-gx/yunchan-web/commit/0f75793c38f64367f5595a525927df73204799e4))
* 重构股票管理逻辑，更新相关引用为 stockUtils，新增 react-scan 依赖，优化假期和经济数据表格样式 ([1da1297](https://github.com/xinchan-gx/yunchan-web/commit/1da129776893c82b7ac2a357304a5c7cd629e994))
* 重构绘图函数，优化参数传递，简化线条绘制逻辑，移除不必要的计算 ([419908c](https://github.com/xinchan-gx/yunchan-web/commit/419908ce5ad45e73aad5f7afa621387e4dd88f61))
* 重构绘图逻辑，优化 ECharts 实例管理，增加 x 轴图表支持，调整数据更新逻辑 ([68af276](https://github.com/xinchan-gx/yunchan-web/commit/68af27690df59cd24a87bbf5bb9442860cea2dc3))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/xinchan-gx/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))
* 修复若干问题 ([d8d3e7e](https://github.com/xinchan-gx/yunchan-web/commit/d8d3e7e26afa435dfcbe5df9ade4343f4933340a))
* 修复若干问题 ([3581f95](https://github.com/xinchan-gx/yunchan-web/commit/3581f9508658c64212d51e46ff7809a836fcdf88))
* 修复若干问题 ([fa34b90](https://github.com/xinchan-gx/yunchan-web/commit/fa34b90ea229e37d4864ae0c3d434503a4fa3443))
* 修正股票交易点击事件的参数，从 'code' 改为 'symbol' ([0d9497a](https://github.com/xinchan-gx/yunchan-web/commit/0d9497a47bfb541f2990a1f54bf09be0a9116cb4))

### 🎫 Chores | 其他更新

* 移除调试日志，清理代码 ([71af72f](https://github.com/xinchan-gx/yunchan-web/commit/71af72f2db485836e47396bb65301627c76c31e7))
* Release v1.10.0 ([8dfe728](https://github.com/xinchan-gx/yunchan-web/commit/8dfe728de3ea1396d810360898644d44c7f05ce6))
* Release v1.11.0 ([0a95e66](https://github.com/xinchan-gx/yunchan-web/commit/0a95e669033cfdecd015e9747a047bc389931dfe))
* Release v1.12.0 ([2e1cc28](https://github.com/xinchan-gx/yunchan-web/commit/2e1cc28cf6273afd390359078515ac5dbf828ff7))
* Release v1.13.0 ([ae911a5](https://github.com/xinchan-gx/yunchan-web/commit/ae911a52508a1d511ceb8746086aeaacfd7a8023))
* Release v1.14.0 ([1630b65](https://github.com/xinchan-gx/yunchan-web/commit/1630b65f104538da59052a5dafb51c9631a2149f))
* Release v1.5.0 ([ec321f7](https://github.com/xinchan-gx/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/xinchan-gx/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))
* Release v1.7.0 ([a570920](https://github.com/xinchan-gx/yunchan-web/commit/a5709201f90e24fcb04df93a6f6d4f247d614576))
* Release v1.8.0 ([e9f1551](https://github.com/xinchan-gx/yunchan-web/commit/e9f15516161d61b36b326aa72b1072f5abb4c539))
* Release v1.8.1 ([7782db2](https://github.com/xinchan-gx/yunchan-web/commit/7782db2aa0ad37d61dc03d278622314fd676f124))
* Release v1.8.2 ([5ab5691](https://github.com/xinchan-gx/yunchan-web/commit/5ab5691efe63c0de666d898f7cdd61cad17fe1d9))
* Release v1.9.0 ([32b5465](https://github.com/xinchan-gx/yunchan-web/commit/32b5465f1b9b1db8defbedcaeebf5ec0e32bde75))

### ♻ Code Refactoring | 代码重构

* 移除未使用的 use-table-selection 和 use-cache-request 钩子，优化代码结构 ([d06d9f0](https://github.com/xinchan-gx/yunchan-web/commit/d06d9f0d608aaa2b4b5c8fd0bb15ab6c5ee09d2e))

## [1.14.0](https://github.com/xinchan-gx/yunchan-web/compare/1.4.0...1.14.0) (2025-01-15)

### ✨ Features | 新功能

* 调整大盘图表轴标签显示间隔，优化时间格式化逻辑 ([cd9090a](https://github.com/xinchan-gx/yunchan-web/commit/cd9090ae7c39aa265ae07a33d0bcce267621cc9d))
* 调整股票闪烁动画时长，优化价格闪烁逻辑，增加随机延迟效果 ([9fcffbd](https://github.com/xinchan-gx/yunchan-web/commit/9fcffbd6cc708120bdbfa7a03884254809913d4a))
* 更新 ECharts 类型定义，添加 StockChartInterval 支持，优化时间处理逻辑 ([035307e](https://github.com/xinchan-gx/yunchan-web/commit/035307e4bf68754785f7faa18e11d67440e238e5))
* 更新 JknIcon 导入方式，添加 rc-table 类型定义，优化代码结构 ([b099825](https://github.com/xinchan-gx/yunchan-web/commit/b099825d52ec16a45725aed287dbf42e37d4e510))
* 更新 klinecharts 依赖至 10.0.0-alpha2，优化缓冲区处理逻辑，增加最大缓冲区限制，重构时间处理函数 ([f934113](https://github.com/xinchan-gx/yunchan-web/commit/f9341133a4287852657c46ff13e3cd86e95af05d))
* 更新 WebSocket URL 构建逻辑，支持动态主机和端口配置 ([d0d5e85](https://github.com/xinchan-gx/yunchan-web/commit/d0d5e8573da74f4245554c48d744416ace4c912c))
* 更新第三方登录接口，添加 appid 参数以支持更好的平台识别 ([52d0fb7](https://github.com/xinchan-gx/yunchan-web/commit/52d0fb712286ee91a25f76f7aba33610b9e6d928))
* 更新股票路径，添加复选框钩子，优化表格数据处理逻辑，新增图标资源 ([c9963e2](https://github.com/xinchan-gx/yunchan-web/commit/c9963e2034e4609ad6e31eaa8c3d62ab39a67e3c))
* 更新股票相关接口，添加 StockExtendResultMap 支持，优化字段引用 ([e308978](https://github.com/xinchan-gx/yunchan-web/commit/e30897831ba85765939b07bf400276cc952fe8be))
* 更新时间存储接口，支持字符串和数字类型，添加新的自定义钩子以管理半控值，优化图表组件和数据处理逻辑 ([59239f0](https://github.com/xinchan-gx/yunchan-web/commit/59239f041b1030be2bb38177bd9211bf9f840b83))
* 更新指标参数处理逻辑，优化相关组件和API调用 ([4e8cce9](https://github.com/xinchan-gx/yunchan-web/commit/4e8cce9201f0ac418912b4bc865ebab5f327f0d8))
* 更新组件样式，优化输入框和表格布局，增强用户体验 ([81c2630](https://github.com/xinchan-gx/yunchan-web/commit/81c2630bd0e32a0eddf84dcfdba3474e44ed710d))
* 将消息队列处理从 requestIdleCallback 更改为 requestAnimationFrame，优化性能 ([a8fde30](https://github.com/xinchan-gx/yunchan-web/commit/a8fde30e98484d934199b6c346268173e2f4541e))
* 添加 dataZoom 事件监听，优化主图指标的动态展示逻辑 ([ec94b5c](https://github.com/xinchan-gx/yunchan-web/commit/ec94b5c8dde54a7c892536b76c2518b0cf341c7a))
* 添加 ECharts 类型扩展，优化绘图逻辑，调整坐标计算，确保图表在边界内绘制 ([867be43](https://github.com/xinchan-gx/yunchan-web/commit/867be4386d949b615de0cab2dea65c1a3d40acec))
* 添加 FRP 配置文件，优化 WebSocket 连接逻辑，更新用户状态管理，增强登录功能 ([aa8092d](https://github.com/xinchan-gx/yunchan-web/commit/aa8092d9bf1a6a822f44e2dcb068a74eb041b3d6))
* 添加 Google 和微信登录功能，优化登录体验 ([c2eec2b](https://github.com/xinchan-gx/yunchan-web/commit/c2eec2b28c753af02e5e4ec326c573d72f72703d))
* 添加 klinecharts 依赖，更新相关锁定文件 ([23f6d4e](https://github.com/xinchan-gx/yunchan-web/commit/23f6d4ef7260de82d6e8015b7ddf1b8fa5b2ae8e))
* 添加 NumSpanSubscribe 组件，优化股票价格和百分比的实时更新逻辑 ([d84d307](https://github.com/xinchan-gx/yunchan-web/commit/d84d307b817154fde5cc308bf3ecd90fc9ea3625))
* 添加 NumSpanSubscribe 组件，优化股票数据订阅逻辑，重构相关引用和更新处理 ([5845fd8](https://github.com/xinchan-gx/yunchan-web/commit/5845fd8c569e5a31da1747a8bf5cfe0d0b94104e))
* 添加 plateId 字段，优化开发环境下的扫描逻辑，移除无用日志，重构股票数据订阅，优化表格数据处理，调整组件样式和逻辑 ([d2fa409](https://github.com/xinchan-gx/yunchan-web/commit/d2fa409411f2548a7c2bd8b9ea348a5b65f777a5))
* 添加 SubscribeSpan 组件以订阅股票数据，优化数据格式化和状态管理逻辑 ([48e7265](https://github.com/xinchan-gx/yunchan-web/commit/48e7265e39b25a25767b22aa48710638ae7331e1))
* 添加 useTableData 钩子，优化表格数据管理和排序功能，更新相关组件以支持新钩子 ([9afa65b](https://github.com/xinchan-gx/yunchan-web/commit/9afa65b946f8ba4387436769c356ecb08f7636ee))
* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/xinchan-gx/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加大盘指数数据获取，优化股票订阅逻辑和图表展示 ([ab06e4c](https://github.com/xinchan-gx/yunchan-web/commit/ab06e4cae553e81bd8b89467c2b2d1fc51857f0a))
* 添加调试日志，优化模态框打开逻辑 ([4b8b69b](https://github.com/xinchan-gx/yunchan-web/commit/4b8b69baf10669eb50d7c94f2f1b39abe15a55e1))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/xinchan-gx/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/xinchan-gx/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加股票订阅处理逻辑，优化数据更新和缓冲区管理 ([e7ba17a](https://github.com/xinchan-gx/yunchan-web/commit/e7ba17a2321be61a6978316b730cf1c074f268ce))
* 添加股票列表项组件，优化股票数据展示和动画效果 ([1389cd8](https://github.com/xinchan-gx/yunchan-web/commit/1389cd8175129e1500ada2918b4c3ce8fbff9230))
* 添加股票数据订阅功能，优化股票列表动态更新逻辑，增强用户体验 ([0bbfd48](https://github.com/xinchan-gx/yunchan-web/commit/0bbfd48601797e92b8b171918a4b6bc93ab14e14))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/xinchan-gx/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))
* 添加均线计算和买卖点计算功能，优化相关逻辑和类型定义 ([373bdd3](https://github.com/xinchan-gx/yunchan-web/commit/373bdd39c320db51a487f3f86d6acb25d679e50b))
* 添加时间索引选择功能，优化股票图表交互体验 ([555f409](https://github.com/xinchan-gx/yunchan-web/commit/555f40976c7c37b3a026dd5b5e0b85843ce814b5))
* 添加特色推送页面，整合股票推送数据，优化表格展示和交互功能 ([3dc28a8](https://github.com/xinchan-gx/yunchan-web/commit/3dc28a80ac634a96fec4328ecef7c0f484a53033))
* 添加指标参数编辑功能，优化二级指标组件逻辑 ([563b1de](https://github.com/xinchan-gx/yunchan-web/commit/563b1deb1ff371d0156015ee63d52ca3d7ca3f5e))
* 移除调试日志，调整图表和绘制逻辑，优化代码可读性 ([8f7a522](https://github.com/xinchan-gx/yunchan-web/commit/8f7a5222cd301e345d367bf4ecce288f8217faae))
* 移除无用的日志，重构推送页面数据结构，新增推送周期和缠论信号字段，优化日期格式化逻辑，添加 dayjs 插件 ([a71f5ce](https://github.com/xinchan-gx/yunchan-web/commit/a71f5ce91fc569b53400f4fbd97f79f0165ebd7f))
* 优化登录表单逻辑，支持通过用户名、Apple 和 Google 登录，更新登录成功回调 ([f3e0b51](https://github.com/xinchan-gx/yunchan-web/commit/f3e0b516cf66eea21a014bdd45145451b514c589))
* 优化股票池组件，添加排序功能，使用 useRef 存储原始数据，提升性能和可读性 ([98a09fa](https://github.com/xinchan-gx/yunchan-web/commit/98a09fa22643e34d7a86b6f231ea1ee7065663e7))
* 优化股票订阅符号生成逻辑，支持多种时间间隔 ([b19883c](https://github.com/xinchan-gx/yunchan-web/commit/b19883c5b1618b9910851e44d1d910b8ea11fff1))
* 优化股票订阅逻辑，调整缓冲区处理长度，增加最大缓冲区限制，清理无用代码 ([f41a19b](https://github.com/xinchan-gx/yunchan-web/commit/f41a19b3d53f76559ab19d022cd0784c88adf509))
* 优化股票订阅逻辑，移除冗余代码，增强组件性能和可读性 ([f13fd97](https://github.com/xinchan-gx/yunchan-web/commit/f13fd9751a66102d7869a59c26aecd252d2dd134))
* 优化股票价格更新逻辑，确保仅在相关股票数据变更时更新值 ([4fa23af](https://github.com/xinchan-gx/yunchan-web/commit/4fa23af0658a129ecc86e801be402d54c4d55378))
* 优化股票闪烁动画时长，更新 WebSocket 目标地址，重构表格数据更新逻辑，添加时间比较工具函数 ([16f712b](https://github.com/xinchan-gx/yunchan-web/commit/16f712b256aeb29b3a8906f7db7133e4cde550d3))
* 优化股票收集列表和时间管理逻辑，重构相关组件以提升性能和可读性 ([cb5fda2](https://github.com/xinchan-gx/yunchan-web/commit/cb5fda2a0baf812da9c9c48018c6048955c98d76))
* 优化股票信息展示，增加交易时段处理逻辑，重构数据状态管理 ([0300f8a](https://github.com/xinchan-gx/yunchan-web/commit/0300f8a03a4064109a5b47e351310151eb3db71d))
* 优化图表数据处理逻辑，调整数据切片长度，重构 JknRcTable 组件，添加虚拟表格支持，改进 useTableData 钩子，清理无用代码 ([a526358](https://github.com/xinchan-gx/yunchan-web/commit/a5263581c562182437536c53cd4bfbf8fc81153f))
* 优化主图和 x 轴图表的连接逻辑，调整 x 轴高度，更新默认选项以改善数据展示 ([252d0db](https://github.com/xinchan-gx/yunchan-web/commit/252d0db2193783b003fb1d69c7483ef59133d344))
* 增加对股票时间间隔的支持，添加半年和季度的比较逻辑，优化日期处理 ([c6981f4](https://github.com/xinchan-gx/yunchan-web/commit/c6981f45637a7f3dcef763d207bbb63328a080e2))
* 重构表格数据处理逻辑，更新相关引用，优化用户中心登出逻辑，调整组件样式，删除无用的 use-table-data 钩子 ([0f75793](https://github.com/xinchan-gx/yunchan-web/commit/0f75793c38f64367f5595a525927df73204799e4))
* 重构股票管理逻辑，更新相关引用为 stockUtils，新增 react-scan 依赖，优化假期和经济数据表格样式 ([1da1297](https://github.com/xinchan-gx/yunchan-web/commit/1da129776893c82b7ac2a357304a5c7cd629e994))
* 重构绘图函数，优化参数传递，简化线条绘制逻辑，移除不必要的计算 ([419908c](https://github.com/xinchan-gx/yunchan-web/commit/419908ce5ad45e73aad5f7afa621387e4dd88f61))
* 重构绘图逻辑，优化 ECharts 实例管理，增加 x 轴图表支持，调整数据更新逻辑 ([68af276](https://github.com/xinchan-gx/yunchan-web/commit/68af27690df59cd24a87bbf5bb9442860cea2dc3))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/xinchan-gx/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))
* 修复若干问题 ([d8d3e7e](https://github.com/xinchan-gx/yunchan-web/commit/d8d3e7e26afa435dfcbe5df9ade4343f4933340a))
* 修复若干问题 ([3581f95](https://github.com/xinchan-gx/yunchan-web/commit/3581f9508658c64212d51e46ff7809a836fcdf88))
* 修复若干问题 ([fa34b90](https://github.com/xinchan-gx/yunchan-web/commit/fa34b90ea229e37d4864ae0c3d434503a4fa3443))

### 🎫 Chores | 其他更新

* Release v1.10.0 ([8dfe728](https://github.com/xinchan-gx/yunchan-web/commit/8dfe728de3ea1396d810360898644d44c7f05ce6))
* Release v1.11.0 ([0a95e66](https://github.com/xinchan-gx/yunchan-web/commit/0a95e669033cfdecd015e9747a047bc389931dfe))
* Release v1.12.0 ([2e1cc28](https://github.com/xinchan-gx/yunchan-web/commit/2e1cc28cf6273afd390359078515ac5dbf828ff7))
* Release v1.13.0 ([ae911a5](https://github.com/xinchan-gx/yunchan-web/commit/ae911a52508a1d511ceb8746086aeaacfd7a8023))
* Release v1.5.0 ([ec321f7](https://github.com/xinchan-gx/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/xinchan-gx/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))
* Release v1.7.0 ([a570920](https://github.com/xinchan-gx/yunchan-web/commit/a5709201f90e24fcb04df93a6f6d4f247d614576))
* Release v1.8.0 ([e9f1551](https://github.com/xinchan-gx/yunchan-web/commit/e9f15516161d61b36b326aa72b1072f5abb4c539))
* Release v1.8.1 ([7782db2](https://github.com/xinchan-gx/yunchan-web/commit/7782db2aa0ad37d61dc03d278622314fd676f124))
* Release v1.8.2 ([5ab5691](https://github.com/xinchan-gx/yunchan-web/commit/5ab5691efe63c0de666d898f7cdd61cad17fe1d9))
* Release v1.9.0 ([32b5465](https://github.com/xinchan-gx/yunchan-web/commit/32b5465f1b9b1db8defbedcaeebf5ec0e32bde75))

### ♻ Code Refactoring | 代码重构

* 移除未使用的 use-table-selection 和 use-cache-request 钩子，优化代码结构 ([d06d9f0](https://github.com/xinchan-gx/yunchan-web/commit/d06d9f0d608aaa2b4b5c8fd0bb15ab6c5ee09d2e))

## [1.13.0](https://github.com/xinchan-gx/yunchan-web/compare/1.4.0...1.13.0) (2025-01-14)

### ✨ Features | 新功能

* 调整大盘图表轴标签显示间隔，优化时间格式化逻辑 ([cd9090a](https://github.com/xinchan-gx/yunchan-web/commit/cd9090ae7c39aa265ae07a33d0bcce267621cc9d))
* 调整股票闪烁动画时长，优化价格闪烁逻辑，增加随机延迟效果 ([9fcffbd](https://github.com/xinchan-gx/yunchan-web/commit/9fcffbd6cc708120bdbfa7a03884254809913d4a))
* 更新 ECharts 类型定义，添加 StockChartInterval 支持，优化时间处理逻辑 ([035307e](https://github.com/xinchan-gx/yunchan-web/commit/035307e4bf68754785f7faa18e11d67440e238e5))
* 更新 JknIcon 导入方式，添加 rc-table 类型定义，优化代码结构 ([b099825](https://github.com/xinchan-gx/yunchan-web/commit/b099825d52ec16a45725aed287dbf42e37d4e510))
* 更新 klinecharts 依赖至 10.0.0-alpha2，优化缓冲区处理逻辑，增加最大缓冲区限制，重构时间处理函数 ([f934113](https://github.com/xinchan-gx/yunchan-web/commit/f9341133a4287852657c46ff13e3cd86e95af05d))
* 更新 WebSocket URL 构建逻辑，支持动态主机和端口配置 ([d0d5e85](https://github.com/xinchan-gx/yunchan-web/commit/d0d5e8573da74f4245554c48d744416ace4c912c))
* 更新股票路径，添加复选框钩子，优化表格数据处理逻辑，新增图标资源 ([c9963e2](https://github.com/xinchan-gx/yunchan-web/commit/c9963e2034e4609ad6e31eaa8c3d62ab39a67e3c))
* 更新股票相关接口，添加 StockExtendResultMap 支持，优化字段引用 ([e308978](https://github.com/xinchan-gx/yunchan-web/commit/e30897831ba85765939b07bf400276cc952fe8be))
* 更新时间存储接口，支持字符串和数字类型，添加新的自定义钩子以管理半控值，优化图表组件和数据处理逻辑 ([59239f0](https://github.com/xinchan-gx/yunchan-web/commit/59239f041b1030be2bb38177bd9211bf9f840b83))
* 更新指标参数处理逻辑，优化相关组件和API调用 ([4e8cce9](https://github.com/xinchan-gx/yunchan-web/commit/4e8cce9201f0ac418912b4bc865ebab5f327f0d8))
* 更新组件样式，优化输入框和表格布局，增强用户体验 ([81c2630](https://github.com/xinchan-gx/yunchan-web/commit/81c2630bd0e32a0eddf84dcfdba3474e44ed710d))
* 将消息队列处理从 requestIdleCallback 更改为 requestAnimationFrame，优化性能 ([a8fde30](https://github.com/xinchan-gx/yunchan-web/commit/a8fde30e98484d934199b6c346268173e2f4541e))
* 添加 dataZoom 事件监听，优化主图指标的动态展示逻辑 ([ec94b5c](https://github.com/xinchan-gx/yunchan-web/commit/ec94b5c8dde54a7c892536b76c2518b0cf341c7a))
* 添加 ECharts 类型扩展，优化绘图逻辑，调整坐标计算，确保图表在边界内绘制 ([867be43](https://github.com/xinchan-gx/yunchan-web/commit/867be4386d949b615de0cab2dea65c1a3d40acec))
* 添加 klinecharts 依赖，更新相关锁定文件 ([23f6d4e](https://github.com/xinchan-gx/yunchan-web/commit/23f6d4ef7260de82d6e8015b7ddf1b8fa5b2ae8e))
* 添加 NumSpanSubscribe 组件，优化股票价格和百分比的实时更新逻辑 ([d84d307](https://github.com/xinchan-gx/yunchan-web/commit/d84d307b817154fde5cc308bf3ecd90fc9ea3625))
* 添加 NumSpanSubscribe 组件，优化股票数据订阅逻辑，重构相关引用和更新处理 ([5845fd8](https://github.com/xinchan-gx/yunchan-web/commit/5845fd8c569e5a31da1747a8bf5cfe0d0b94104e))
* 添加 plateId 字段，优化开发环境下的扫描逻辑，移除无用日志，重构股票数据订阅，优化表格数据处理，调整组件样式和逻辑 ([d2fa409](https://github.com/xinchan-gx/yunchan-web/commit/d2fa409411f2548a7c2bd8b9ea348a5b65f777a5))
* 添加 SubscribeSpan 组件以订阅股票数据，优化数据格式化和状态管理逻辑 ([48e7265](https://github.com/xinchan-gx/yunchan-web/commit/48e7265e39b25a25767b22aa48710638ae7331e1))
* 添加 useTableData 钩子，优化表格数据管理和排序功能，更新相关组件以支持新钩子 ([9afa65b](https://github.com/xinchan-gx/yunchan-web/commit/9afa65b946f8ba4387436769c356ecb08f7636ee))
* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/xinchan-gx/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加大盘指数数据获取，优化股票订阅逻辑和图表展示 ([ab06e4c](https://github.com/xinchan-gx/yunchan-web/commit/ab06e4cae553e81bd8b89467c2b2d1fc51857f0a))
* 添加调试日志，优化模态框打开逻辑 ([4b8b69b](https://github.com/xinchan-gx/yunchan-web/commit/4b8b69baf10669eb50d7c94f2f1b39abe15a55e1))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/xinchan-gx/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/xinchan-gx/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加股票订阅处理逻辑，优化数据更新和缓冲区管理 ([e7ba17a](https://github.com/xinchan-gx/yunchan-web/commit/e7ba17a2321be61a6978316b730cf1c074f268ce))
* 添加股票列表项组件，优化股票数据展示和动画效果 ([1389cd8](https://github.com/xinchan-gx/yunchan-web/commit/1389cd8175129e1500ada2918b4c3ce8fbff9230))
* 添加股票数据订阅功能，优化股票列表动态更新逻辑，增强用户体验 ([0bbfd48](https://github.com/xinchan-gx/yunchan-web/commit/0bbfd48601797e92b8b171918a4b6bc93ab14e14))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/xinchan-gx/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))
* 添加均线计算和买卖点计算功能，优化相关逻辑和类型定义 ([373bdd3](https://github.com/xinchan-gx/yunchan-web/commit/373bdd39c320db51a487f3f86d6acb25d679e50b))
* 添加时间索引选择功能，优化股票图表交互体验 ([555f409](https://github.com/xinchan-gx/yunchan-web/commit/555f40976c7c37b3a026dd5b5e0b85843ce814b5))
* 添加特色推送页面，整合股票推送数据，优化表格展示和交互功能 ([3dc28a8](https://github.com/xinchan-gx/yunchan-web/commit/3dc28a80ac634a96fec4328ecef7c0f484a53033))
* 添加指标参数编辑功能，优化二级指标组件逻辑 ([563b1de](https://github.com/xinchan-gx/yunchan-web/commit/563b1deb1ff371d0156015ee63d52ca3d7ca3f5e))
* 移除调试日志，调整图表和绘制逻辑，优化代码可读性 ([8f7a522](https://github.com/xinchan-gx/yunchan-web/commit/8f7a5222cd301e345d367bf4ecce288f8217faae))
* 移除无用的日志，重构推送页面数据结构，新增推送周期和缠论信号字段，优化日期格式化逻辑，添加 dayjs 插件 ([a71f5ce](https://github.com/xinchan-gx/yunchan-web/commit/a71f5ce91fc569b53400f4fbd97f79f0165ebd7f))
* 优化股票池组件，添加排序功能，使用 useRef 存储原始数据，提升性能和可读性 ([98a09fa](https://github.com/xinchan-gx/yunchan-web/commit/98a09fa22643e34d7a86b6f231ea1ee7065663e7))
* 优化股票订阅符号生成逻辑，支持多种时间间隔 ([b19883c](https://github.com/xinchan-gx/yunchan-web/commit/b19883c5b1618b9910851e44d1d910b8ea11fff1))
* 优化股票订阅逻辑，调整缓冲区处理长度，增加最大缓冲区限制，清理无用代码 ([f41a19b](https://github.com/xinchan-gx/yunchan-web/commit/f41a19b3d53f76559ab19d022cd0784c88adf509))
* 优化股票订阅逻辑，移除冗余代码，增强组件性能和可读性 ([f13fd97](https://github.com/xinchan-gx/yunchan-web/commit/f13fd9751a66102d7869a59c26aecd252d2dd134))
* 优化股票价格更新逻辑，确保仅在相关股票数据变更时更新值 ([4fa23af](https://github.com/xinchan-gx/yunchan-web/commit/4fa23af0658a129ecc86e801be402d54c4d55378))
* 优化股票闪烁动画时长，更新 WebSocket 目标地址，重构表格数据更新逻辑，添加时间比较工具函数 ([16f712b](https://github.com/xinchan-gx/yunchan-web/commit/16f712b256aeb29b3a8906f7db7133e4cde550d3))
* 优化股票收集列表和时间管理逻辑，重构相关组件以提升性能和可读性 ([cb5fda2](https://github.com/xinchan-gx/yunchan-web/commit/cb5fda2a0baf812da9c9c48018c6048955c98d76))
* 优化股票信息展示，增加交易时段处理逻辑，重构数据状态管理 ([0300f8a](https://github.com/xinchan-gx/yunchan-web/commit/0300f8a03a4064109a5b47e351310151eb3db71d))
* 优化图表数据处理逻辑，调整数据切片长度，重构 JknRcTable 组件，添加虚拟表格支持，改进 useTableData 钩子，清理无用代码 ([a526358](https://github.com/xinchan-gx/yunchan-web/commit/a5263581c562182437536c53cd4bfbf8fc81153f))
* 优化主图和 x 轴图表的连接逻辑，调整 x 轴高度，更新默认选项以改善数据展示 ([252d0db](https://github.com/xinchan-gx/yunchan-web/commit/252d0db2193783b003fb1d69c7483ef59133d344))
* 重构表格数据处理逻辑，更新相关引用，优化用户中心登出逻辑，调整组件样式，删除无用的 use-table-data 钩子 ([0f75793](https://github.com/xinchan-gx/yunchan-web/commit/0f75793c38f64367f5595a525927df73204799e4))
* 重构股票管理逻辑，更新相关引用为 stockUtils，新增 react-scan 依赖，优化假期和经济数据表格样式 ([1da1297](https://github.com/xinchan-gx/yunchan-web/commit/1da129776893c82b7ac2a357304a5c7cd629e994))
* 重构绘图函数，优化参数传递，简化线条绘制逻辑，移除不必要的计算 ([419908c](https://github.com/xinchan-gx/yunchan-web/commit/419908ce5ad45e73aad5f7afa621387e4dd88f61))
* 重构绘图逻辑，优化 ECharts 实例管理，增加 x 轴图表支持，调整数据更新逻辑 ([68af276](https://github.com/xinchan-gx/yunchan-web/commit/68af27690df59cd24a87bbf5bb9442860cea2dc3))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/xinchan-gx/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))
* 修复若干问题 ([d8d3e7e](https://github.com/xinchan-gx/yunchan-web/commit/d8d3e7e26afa435dfcbe5df9ade4343f4933340a))
* 修复若干问题 ([3581f95](https://github.com/xinchan-gx/yunchan-web/commit/3581f9508658c64212d51e46ff7809a836fcdf88))
* 修复若干问题 ([fa34b90](https://github.com/xinchan-gx/yunchan-web/commit/fa34b90ea229e37d4864ae0c3d434503a4fa3443))

### 🎫 Chores | 其他更新

* Release v1.10.0 ([8dfe728](https://github.com/xinchan-gx/yunchan-web/commit/8dfe728de3ea1396d810360898644d44c7f05ce6))
* Release v1.11.0 ([0a95e66](https://github.com/xinchan-gx/yunchan-web/commit/0a95e669033cfdecd015e9747a047bc389931dfe))
* Release v1.12.0 ([2e1cc28](https://github.com/xinchan-gx/yunchan-web/commit/2e1cc28cf6273afd390359078515ac5dbf828ff7))
* Release v1.5.0 ([ec321f7](https://github.com/xinchan-gx/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/xinchan-gx/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))
* Release v1.7.0 ([a570920](https://github.com/xinchan-gx/yunchan-web/commit/a5709201f90e24fcb04df93a6f6d4f247d614576))
* Release v1.8.0 ([e9f1551](https://github.com/xinchan-gx/yunchan-web/commit/e9f15516161d61b36b326aa72b1072f5abb4c539))
* Release v1.8.1 ([7782db2](https://github.com/xinchan-gx/yunchan-web/commit/7782db2aa0ad37d61dc03d278622314fd676f124))
* Release v1.8.2 ([5ab5691](https://github.com/xinchan-gx/yunchan-web/commit/5ab5691efe63c0de666d898f7cdd61cad17fe1d9))
* Release v1.9.0 ([32b5465](https://github.com/xinchan-gx/yunchan-web/commit/32b5465f1b9b1db8defbedcaeebf5ec0e32bde75))

### ♻ Code Refactoring | 代码重构

* 移除未使用的 use-table-selection 和 use-cache-request 钩子，优化代码结构 ([d06d9f0](https://github.com/xinchan-gx/yunchan-web/commit/d06d9f0d608aaa2b4b5c8fd0bb15ab6c5ee09d2e))

## [1.12.0](https://github.com/xinchan-gx/yunchan-web/compare/1.4.0...1.12.0) (2025-01-13)

### ✨ Features | 新功能

* 调整大盘图表轴标签显示间隔，优化时间格式化逻辑 ([cd9090a](https://github.com/xinchan-gx/yunchan-web/commit/cd9090ae7c39aa265ae07a33d0bcce267621cc9d))
* 调整股票闪烁动画时长，优化价格闪烁逻辑，增加随机延迟效果 ([9fcffbd](https://github.com/xinchan-gx/yunchan-web/commit/9fcffbd6cc708120bdbfa7a03884254809913d4a))
* 更新 ECharts 类型定义，添加 StockChartInterval 支持，优化时间处理逻辑 ([035307e](https://github.com/xinchan-gx/yunchan-web/commit/035307e4bf68754785f7faa18e11d67440e238e5))
* 更新 JknIcon 导入方式，添加 rc-table 类型定义，优化代码结构 ([b099825](https://github.com/xinchan-gx/yunchan-web/commit/b099825d52ec16a45725aed287dbf42e37d4e510))
* 更新 klinecharts 依赖至 10.0.0-alpha2，优化缓冲区处理逻辑，增加最大缓冲区限制，重构时间处理函数 ([f934113](https://github.com/xinchan-gx/yunchan-web/commit/f9341133a4287852657c46ff13e3cd86e95af05d))
* 更新 WebSocket URL 构建逻辑，支持动态主机和端口配置 ([d0d5e85](https://github.com/xinchan-gx/yunchan-web/commit/d0d5e8573da74f4245554c48d744416ace4c912c))
* 更新股票路径，添加复选框钩子，优化表格数据处理逻辑，新增图标资源 ([c9963e2](https://github.com/xinchan-gx/yunchan-web/commit/c9963e2034e4609ad6e31eaa8c3d62ab39a67e3c))
* 更新股票相关接口，添加 StockExtendResultMap 支持，优化字段引用 ([e308978](https://github.com/xinchan-gx/yunchan-web/commit/e30897831ba85765939b07bf400276cc952fe8be))
* 更新时间存储接口，支持字符串和数字类型，添加新的自定义钩子以管理半控值，优化图表组件和数据处理逻辑 ([59239f0](https://github.com/xinchan-gx/yunchan-web/commit/59239f041b1030be2bb38177bd9211bf9f840b83))
* 更新指标参数处理逻辑，优化相关组件和API调用 ([4e8cce9](https://github.com/xinchan-gx/yunchan-web/commit/4e8cce9201f0ac418912b4bc865ebab5f327f0d8))
* 将消息队列处理从 requestIdleCallback 更改为 requestAnimationFrame，优化性能 ([a8fde30](https://github.com/xinchan-gx/yunchan-web/commit/a8fde30e98484d934199b6c346268173e2f4541e))
* 添加 dataZoom 事件监听，优化主图指标的动态展示逻辑 ([ec94b5c](https://github.com/xinchan-gx/yunchan-web/commit/ec94b5c8dde54a7c892536b76c2518b0cf341c7a))
* 添加 ECharts 类型扩展，优化绘图逻辑，调整坐标计算，确保图表在边界内绘制 ([867be43](https://github.com/xinchan-gx/yunchan-web/commit/867be4386d949b615de0cab2dea65c1a3d40acec))
* 添加 klinecharts 依赖，更新相关锁定文件 ([23f6d4e](https://github.com/xinchan-gx/yunchan-web/commit/23f6d4ef7260de82d6e8015b7ddf1b8fa5b2ae8e))
* 添加 NumSpanSubscribe 组件，优化股票数据订阅逻辑，重构相关引用和更新处理 ([5845fd8](https://github.com/xinchan-gx/yunchan-web/commit/5845fd8c569e5a31da1747a8bf5cfe0d0b94104e))
* 添加 plateId 字段，优化开发环境下的扫描逻辑，移除无用日志，重构股票数据订阅，优化表格数据处理，调整组件样式和逻辑 ([d2fa409](https://github.com/xinchan-gx/yunchan-web/commit/d2fa409411f2548a7c2bd8b9ea348a5b65f777a5))
* 添加 SubscribeSpan 组件以订阅股票数据，优化数据格式化和状态管理逻辑 ([48e7265](https://github.com/xinchan-gx/yunchan-web/commit/48e7265e39b25a25767b22aa48710638ae7331e1))
* 添加 useTableData 钩子，优化表格数据管理和排序功能，更新相关组件以支持新钩子 ([9afa65b](https://github.com/xinchan-gx/yunchan-web/commit/9afa65b946f8ba4387436769c356ecb08f7636ee))
* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/xinchan-gx/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加大盘指数数据获取，优化股票订阅逻辑和图表展示 ([ab06e4c](https://github.com/xinchan-gx/yunchan-web/commit/ab06e4cae553e81bd8b89467c2b2d1fc51857f0a))
* 添加调试日志，优化模态框打开逻辑 ([4b8b69b](https://github.com/xinchan-gx/yunchan-web/commit/4b8b69baf10669eb50d7c94f2f1b39abe15a55e1))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/xinchan-gx/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/xinchan-gx/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加股票订阅处理逻辑，优化数据更新和缓冲区管理 ([e7ba17a](https://github.com/xinchan-gx/yunchan-web/commit/e7ba17a2321be61a6978316b730cf1c074f268ce))
* 添加股票列表项组件，优化股票数据展示和动画效果 ([1389cd8](https://github.com/xinchan-gx/yunchan-web/commit/1389cd8175129e1500ada2918b4c3ce8fbff9230))
* 添加股票数据订阅功能，优化股票列表动态更新逻辑，增强用户体验 ([0bbfd48](https://github.com/xinchan-gx/yunchan-web/commit/0bbfd48601797e92b8b171918a4b6bc93ab14e14))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/xinchan-gx/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))
* 添加均线计算和买卖点计算功能，优化相关逻辑和类型定义 ([373bdd3](https://github.com/xinchan-gx/yunchan-web/commit/373bdd39c320db51a487f3f86d6acb25d679e50b))
* 添加特色推送页面，整合股票推送数据，优化表格展示和交互功能 ([3dc28a8](https://github.com/xinchan-gx/yunchan-web/commit/3dc28a80ac634a96fec4328ecef7c0f484a53033))
* 添加指标参数编辑功能，优化二级指标组件逻辑 ([563b1de](https://github.com/xinchan-gx/yunchan-web/commit/563b1deb1ff371d0156015ee63d52ca3d7ca3f5e))
* 移除调试日志，调整图表和绘制逻辑，优化代码可读性 ([8f7a522](https://github.com/xinchan-gx/yunchan-web/commit/8f7a5222cd301e345d367bf4ecce288f8217faae))
* 移除无用的日志，重构推送页面数据结构，新增推送周期和缠论信号字段，优化日期格式化逻辑，添加 dayjs 插件 ([a71f5ce](https://github.com/xinchan-gx/yunchan-web/commit/a71f5ce91fc569b53400f4fbd97f79f0165ebd7f))
* 优化股票池组件，添加排序功能，使用 useRef 存储原始数据，提升性能和可读性 ([98a09fa](https://github.com/xinchan-gx/yunchan-web/commit/98a09fa22643e34d7a86b6f231ea1ee7065663e7))
* 优化股票订阅逻辑，调整缓冲区处理长度，增加最大缓冲区限制，清理无用代码 ([f41a19b](https://github.com/xinchan-gx/yunchan-web/commit/f41a19b3d53f76559ab19d022cd0784c88adf509))
* 优化股票订阅逻辑，移除冗余代码，增强组件性能和可读性 ([f13fd97](https://github.com/xinchan-gx/yunchan-web/commit/f13fd9751a66102d7869a59c26aecd252d2dd134))
* 优化股票闪烁动画时长，更新 WebSocket 目标地址，重构表格数据更新逻辑，添加时间比较工具函数 ([16f712b](https://github.com/xinchan-gx/yunchan-web/commit/16f712b256aeb29b3a8906f7db7133e4cde550d3))
* 优化股票收集列表和时间管理逻辑，重构相关组件以提升性能和可读性 ([cb5fda2](https://github.com/xinchan-gx/yunchan-web/commit/cb5fda2a0baf812da9c9c48018c6048955c98d76))
* 优化股票信息展示，增加交易时段处理逻辑，重构数据状态管理 ([0300f8a](https://github.com/xinchan-gx/yunchan-web/commit/0300f8a03a4064109a5b47e351310151eb3db71d))
* 优化图表数据处理逻辑，调整数据切片长度，重构 JknRcTable 组件，添加虚拟表格支持，改进 useTableData 钩子，清理无用代码 ([a526358](https://github.com/xinchan-gx/yunchan-web/commit/a5263581c562182437536c53cd4bfbf8fc81153f))
* 优化主图和 x 轴图表的连接逻辑，调整 x 轴高度，更新默认选项以改善数据展示 ([252d0db](https://github.com/xinchan-gx/yunchan-web/commit/252d0db2193783b003fb1d69c7483ef59133d344))
* 重构表格数据处理逻辑，更新相关引用，优化用户中心登出逻辑，调整组件样式，删除无用的 use-table-data 钩子 ([0f75793](https://github.com/xinchan-gx/yunchan-web/commit/0f75793c38f64367f5595a525927df73204799e4))
* 重构股票管理逻辑，更新相关引用为 stockUtils，新增 react-scan 依赖，优化假期和经济数据表格样式 ([1da1297](https://github.com/xinchan-gx/yunchan-web/commit/1da129776893c82b7ac2a357304a5c7cd629e994))
* 重构绘图函数，优化参数传递，简化线条绘制逻辑，移除不必要的计算 ([419908c](https://github.com/xinchan-gx/yunchan-web/commit/419908ce5ad45e73aad5f7afa621387e4dd88f61))
* 重构绘图逻辑，优化 ECharts 实例管理，增加 x 轴图表支持，调整数据更新逻辑 ([68af276](https://github.com/xinchan-gx/yunchan-web/commit/68af27690df59cd24a87bbf5bb9442860cea2dc3))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/xinchan-gx/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))
* 修复若干问题 ([d8d3e7e](https://github.com/xinchan-gx/yunchan-web/commit/d8d3e7e26afa435dfcbe5df9ade4343f4933340a))
* 修复若干问题 ([3581f95](https://github.com/xinchan-gx/yunchan-web/commit/3581f9508658c64212d51e46ff7809a836fcdf88))
* 修复若干问题 ([fa34b90](https://github.com/xinchan-gx/yunchan-web/commit/fa34b90ea229e37d4864ae0c3d434503a4fa3443))

### 🎫 Chores | 其他更新

* Release v1.10.0 ([8dfe728](https://github.com/xinchan-gx/yunchan-web/commit/8dfe728de3ea1396d810360898644d44c7f05ce6))
* Release v1.11.0 ([0a95e66](https://github.com/xinchan-gx/yunchan-web/commit/0a95e669033cfdecd015e9747a047bc389931dfe))
* Release v1.5.0 ([ec321f7](https://github.com/xinchan-gx/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/xinchan-gx/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))
* Release v1.7.0 ([a570920](https://github.com/xinchan-gx/yunchan-web/commit/a5709201f90e24fcb04df93a6f6d4f247d614576))
* Release v1.8.0 ([e9f1551](https://github.com/xinchan-gx/yunchan-web/commit/e9f15516161d61b36b326aa72b1072f5abb4c539))
* Release v1.8.1 ([7782db2](https://github.com/xinchan-gx/yunchan-web/commit/7782db2aa0ad37d61dc03d278622314fd676f124))
* Release v1.8.2 ([5ab5691](https://github.com/xinchan-gx/yunchan-web/commit/5ab5691efe63c0de666d898f7cdd61cad17fe1d9))
* Release v1.9.0 ([32b5465](https://github.com/xinchan-gx/yunchan-web/commit/32b5465f1b9b1db8defbedcaeebf5ec0e32bde75))

### ♻ Code Refactoring | 代码重构

* 移除未使用的 use-table-selection 和 use-cache-request 钩子，优化代码结构 ([d06d9f0](https://github.com/xinchan-gx/yunchan-web/commit/d06d9f0d608aaa2b4b5c8fd0bb15ab6c5ee09d2e))

## [1.11.0](https://github.com/xinchan-gx/yunchan-web/compare/1.4.0...1.11.0) (2025-01-13)

### ✨ Features | 新功能

* 调整大盘图表轴标签显示间隔，优化时间格式化逻辑 ([cd9090a](https://github.com/xinchan-gx/yunchan-web/commit/cd9090ae7c39aa265ae07a33d0bcce267621cc9d))
* 调整股票闪烁动画时长，优化价格闪烁逻辑，增加随机延迟效果 ([9fcffbd](https://github.com/xinchan-gx/yunchan-web/commit/9fcffbd6cc708120bdbfa7a03884254809913d4a))
* 更新 ECharts 类型定义，添加 StockChartInterval 支持，优化时间处理逻辑 ([035307e](https://github.com/xinchan-gx/yunchan-web/commit/035307e4bf68754785f7faa18e11d67440e238e5))
* 更新 JknIcon 导入方式，添加 rc-table 类型定义，优化代码结构 ([b099825](https://github.com/xinchan-gx/yunchan-web/commit/b099825d52ec16a45725aed287dbf42e37d4e510))
* 更新 klinecharts 依赖至 10.0.0-alpha2，优化缓冲区处理逻辑，增加最大缓冲区限制，重构时间处理函数 ([f934113](https://github.com/xinchan-gx/yunchan-web/commit/f9341133a4287852657c46ff13e3cd86e95af05d))
* 更新 WebSocket URL 构建逻辑，支持动态主机和端口配置 ([d0d5e85](https://github.com/xinchan-gx/yunchan-web/commit/d0d5e8573da74f4245554c48d744416ace4c912c))
* 更新股票路径，添加复选框钩子，优化表格数据处理逻辑，新增图标资源 ([c9963e2](https://github.com/xinchan-gx/yunchan-web/commit/c9963e2034e4609ad6e31eaa8c3d62ab39a67e3c))
* 更新时间存储接口，支持字符串和数字类型，添加新的自定义钩子以管理半控值，优化图表组件和数据处理逻辑 ([59239f0](https://github.com/xinchan-gx/yunchan-web/commit/59239f041b1030be2bb38177bd9211bf9f840b83))
* 更新指标参数处理逻辑，优化相关组件和API调用 ([4e8cce9](https://github.com/xinchan-gx/yunchan-web/commit/4e8cce9201f0ac418912b4bc865ebab5f327f0d8))
* 将消息队列处理从 requestIdleCallback 更改为 requestAnimationFrame，优化性能 ([a8fde30](https://github.com/xinchan-gx/yunchan-web/commit/a8fde30e98484d934199b6c346268173e2f4541e))
* 添加 dataZoom 事件监听，优化主图指标的动态展示逻辑 ([ec94b5c](https://github.com/xinchan-gx/yunchan-web/commit/ec94b5c8dde54a7c892536b76c2518b0cf341c7a))
* 添加 ECharts 类型扩展，优化绘图逻辑，调整坐标计算，确保图表在边界内绘制 ([867be43](https://github.com/xinchan-gx/yunchan-web/commit/867be4386d949b615de0cab2dea65c1a3d40acec))
* 添加 klinecharts 依赖，更新相关锁定文件 ([23f6d4e](https://github.com/xinchan-gx/yunchan-web/commit/23f6d4ef7260de82d6e8015b7ddf1b8fa5b2ae8e))
* 添加 NumSpanSubscribe 组件，优化股票数据订阅逻辑，重构相关引用和更新处理 ([5845fd8](https://github.com/xinchan-gx/yunchan-web/commit/5845fd8c569e5a31da1747a8bf5cfe0d0b94104e))
* 添加 plateId 字段，优化开发环境下的扫描逻辑，移除无用日志，重构股票数据订阅，优化表格数据处理，调整组件样式和逻辑 ([d2fa409](https://github.com/xinchan-gx/yunchan-web/commit/d2fa409411f2548a7c2bd8b9ea348a5b65f777a5))
* 添加 SubscribeSpan 组件以订阅股票数据，优化数据格式化和状态管理逻辑 ([48e7265](https://github.com/xinchan-gx/yunchan-web/commit/48e7265e39b25a25767b22aa48710638ae7331e1))
* 添加 useTableData 钩子，优化表格数据管理和排序功能，更新相关组件以支持新钩子 ([9afa65b](https://github.com/xinchan-gx/yunchan-web/commit/9afa65b946f8ba4387436769c356ecb08f7636ee))
* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/xinchan-gx/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加大盘指数数据获取，优化股票订阅逻辑和图表展示 ([ab06e4c](https://github.com/xinchan-gx/yunchan-web/commit/ab06e4cae553e81bd8b89467c2b2d1fc51857f0a))
* 添加调试日志，优化模态框打开逻辑 ([4b8b69b](https://github.com/xinchan-gx/yunchan-web/commit/4b8b69baf10669eb50d7c94f2f1b39abe15a55e1))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/xinchan-gx/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/xinchan-gx/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加股票订阅处理逻辑，优化数据更新和缓冲区管理 ([e7ba17a](https://github.com/xinchan-gx/yunchan-web/commit/e7ba17a2321be61a6978316b730cf1c074f268ce))
* 添加股票列表项组件，优化股票数据展示和动画效果 ([1389cd8](https://github.com/xinchan-gx/yunchan-web/commit/1389cd8175129e1500ada2918b4c3ce8fbff9230))
* 添加股票数据订阅功能，优化股票列表动态更新逻辑，增强用户体验 ([0bbfd48](https://github.com/xinchan-gx/yunchan-web/commit/0bbfd48601797e92b8b171918a4b6bc93ab14e14))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/xinchan-gx/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))
* 添加均线计算和买卖点计算功能，优化相关逻辑和类型定义 ([373bdd3](https://github.com/xinchan-gx/yunchan-web/commit/373bdd39c320db51a487f3f86d6acb25d679e50b))
* 添加特色推送页面，整合股票推送数据，优化表格展示和交互功能 ([3dc28a8](https://github.com/xinchan-gx/yunchan-web/commit/3dc28a80ac634a96fec4328ecef7c0f484a53033))
* 添加指标参数编辑功能，优化二级指标组件逻辑 ([563b1de](https://github.com/xinchan-gx/yunchan-web/commit/563b1deb1ff371d0156015ee63d52ca3d7ca3f5e))
* 移除调试日志，调整图表和绘制逻辑，优化代码可读性 ([8f7a522](https://github.com/xinchan-gx/yunchan-web/commit/8f7a5222cd301e345d367bf4ecce288f8217faae))
* 移除无用的日志，重构推送页面数据结构，新增推送周期和缠论信号字段，优化日期格式化逻辑，添加 dayjs 插件 ([a71f5ce](https://github.com/xinchan-gx/yunchan-web/commit/a71f5ce91fc569b53400f4fbd97f79f0165ebd7f))
* 优化股票池组件，添加排序功能，使用 useRef 存储原始数据，提升性能和可读性 ([98a09fa](https://github.com/xinchan-gx/yunchan-web/commit/98a09fa22643e34d7a86b6f231ea1ee7065663e7))
* 优化股票订阅逻辑，调整缓冲区处理长度，增加最大缓冲区限制，清理无用代码 ([f41a19b](https://github.com/xinchan-gx/yunchan-web/commit/f41a19b3d53f76559ab19d022cd0784c88adf509))
* 优化股票订阅逻辑，移除冗余代码，增强组件性能和可读性 ([f13fd97](https://github.com/xinchan-gx/yunchan-web/commit/f13fd9751a66102d7869a59c26aecd252d2dd134))
* 优化股票闪烁动画时长，更新 WebSocket 目标地址，重构表格数据更新逻辑，添加时间比较工具函数 ([16f712b](https://github.com/xinchan-gx/yunchan-web/commit/16f712b256aeb29b3a8906f7db7133e4cde550d3))
* 优化股票收集列表和时间管理逻辑，重构相关组件以提升性能和可读性 ([cb5fda2](https://github.com/xinchan-gx/yunchan-web/commit/cb5fda2a0baf812da9c9c48018c6048955c98d76))
* 优化股票信息展示，增加交易时段处理逻辑，重构数据状态管理 ([0300f8a](https://github.com/xinchan-gx/yunchan-web/commit/0300f8a03a4064109a5b47e351310151eb3db71d))
* 优化图表数据处理逻辑，调整数据切片长度，重构 JknRcTable 组件，添加虚拟表格支持，改进 useTableData 钩子，清理无用代码 ([a526358](https://github.com/xinchan-gx/yunchan-web/commit/a5263581c562182437536c53cd4bfbf8fc81153f))
* 优化主图和 x 轴图表的连接逻辑，调整 x 轴高度，更新默认选项以改善数据展示 ([252d0db](https://github.com/xinchan-gx/yunchan-web/commit/252d0db2193783b003fb1d69c7483ef59133d344))
* 重构表格数据处理逻辑，更新相关引用，优化用户中心登出逻辑，调整组件样式，删除无用的 use-table-data 钩子 ([0f75793](https://github.com/xinchan-gx/yunchan-web/commit/0f75793c38f64367f5595a525927df73204799e4))
* 重构股票管理逻辑，更新相关引用为 stockUtils，新增 react-scan 依赖，优化假期和经济数据表格样式 ([1da1297](https://github.com/xinchan-gx/yunchan-web/commit/1da129776893c82b7ac2a357304a5c7cd629e994))
* 重构绘图函数，优化参数传递，简化线条绘制逻辑，移除不必要的计算 ([419908c](https://github.com/xinchan-gx/yunchan-web/commit/419908ce5ad45e73aad5f7afa621387e4dd88f61))
* 重构绘图逻辑，优化 ECharts 实例管理，增加 x 轴图表支持，调整数据更新逻辑 ([68af276](https://github.com/xinchan-gx/yunchan-web/commit/68af27690df59cd24a87bbf5bb9442860cea2dc3))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/xinchan-gx/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))
* 修复若干问题 ([d8d3e7e](https://github.com/xinchan-gx/yunchan-web/commit/d8d3e7e26afa435dfcbe5df9ade4343f4933340a))
* 修复若干问题 ([3581f95](https://github.com/xinchan-gx/yunchan-web/commit/3581f9508658c64212d51e46ff7809a836fcdf88))
* 修复若干问题 ([fa34b90](https://github.com/xinchan-gx/yunchan-web/commit/fa34b90ea229e37d4864ae0c3d434503a4fa3443))

### 🎫 Chores | 其他更新

* Release v1.10.0 ([8dfe728](https://github.com/xinchan-gx/yunchan-web/commit/8dfe728de3ea1396d810360898644d44c7f05ce6))
* Release v1.5.0 ([ec321f7](https://github.com/xinchan-gx/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/xinchan-gx/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))
* Release v1.7.0 ([a570920](https://github.com/xinchan-gx/yunchan-web/commit/a5709201f90e24fcb04df93a6f6d4f247d614576))
* Release v1.8.0 ([e9f1551](https://github.com/xinchan-gx/yunchan-web/commit/e9f15516161d61b36b326aa72b1072f5abb4c539))
* Release v1.8.1 ([7782db2](https://github.com/xinchan-gx/yunchan-web/commit/7782db2aa0ad37d61dc03d278622314fd676f124))
* Release v1.8.2 ([5ab5691](https://github.com/xinchan-gx/yunchan-web/commit/5ab5691efe63c0de666d898f7cdd61cad17fe1d9))
* Release v1.9.0 ([32b5465](https://github.com/xinchan-gx/yunchan-web/commit/32b5465f1b9b1db8defbedcaeebf5ec0e32bde75))

### ♻ Code Refactoring | 代码重构

* 移除未使用的 use-table-selection 和 use-cache-request 钩子，优化代码结构 ([d06d9f0](https://github.com/xinchan-gx/yunchan-web/commit/d06d9f0d608aaa2b4b5c8fd0bb15ab6c5ee09d2e))

## [1.10.0](https://github.com/xinchan-gx/yunchan-web/compare/1.4.0...1.10.0) (2025-01-08)

### ✨ Features | 新功能

* 调整大盘图表轴标签显示间隔，优化时间格式化逻辑 ([cd9090a](https://github.com/xinchan-gx/yunchan-web/commit/cd9090ae7c39aa265ae07a33d0bcce267621cc9d))
* 调整股票闪烁动画时长，优化价格闪烁逻辑，增加随机延迟效果 ([9fcffbd](https://github.com/xinchan-gx/yunchan-web/commit/9fcffbd6cc708120bdbfa7a03884254809913d4a))
* 更新 JknIcon 导入方式，添加 rc-table 类型定义，优化代码结构 ([b099825](https://github.com/xinchan-gx/yunchan-web/commit/b099825d52ec16a45725aed287dbf42e37d4e510))
* 更新 WebSocket URL 构建逻辑，支持动态主机和端口配置 ([d0d5e85](https://github.com/xinchan-gx/yunchan-web/commit/d0d5e8573da74f4245554c48d744416ace4c912c))
* 更新股票路径，添加复选框钩子，优化表格数据处理逻辑，新增图标资源 ([c9963e2](https://github.com/xinchan-gx/yunchan-web/commit/c9963e2034e4609ad6e31eaa8c3d62ab39a67e3c))
* 更新指标参数处理逻辑，优化相关组件和API调用 ([4e8cce9](https://github.com/xinchan-gx/yunchan-web/commit/4e8cce9201f0ac418912b4bc865ebab5f327f0d8))
* 将消息队列处理从 requestIdleCallback 更改为 requestAnimationFrame，优化性能 ([a8fde30](https://github.com/xinchan-gx/yunchan-web/commit/a8fde30e98484d934199b6c346268173e2f4541e))
* 添加 dataZoom 事件监听，优化主图指标的动态展示逻辑 ([ec94b5c](https://github.com/xinchan-gx/yunchan-web/commit/ec94b5c8dde54a7c892536b76c2518b0cf341c7a))
* 添加 plateId 字段，优化开发环境下的扫描逻辑，移除无用日志，重构股票数据订阅，优化表格数据处理，调整组件样式和逻辑 ([d2fa409](https://github.com/xinchan-gx/yunchan-web/commit/d2fa409411f2548a7c2bd8b9ea348a5b65f777a5))
* 添加 useTableData 钩子，优化表格数据管理和排序功能，更新相关组件以支持新钩子 ([9afa65b](https://github.com/xinchan-gx/yunchan-web/commit/9afa65b946f8ba4387436769c356ecb08f7636ee))
* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/xinchan-gx/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加大盘指数数据获取，优化股票订阅逻辑和图表展示 ([ab06e4c](https://github.com/xinchan-gx/yunchan-web/commit/ab06e4cae553e81bd8b89467c2b2d1fc51857f0a))
* 添加调试日志，优化模态框打开逻辑 ([4b8b69b](https://github.com/xinchan-gx/yunchan-web/commit/4b8b69baf10669eb50d7c94f2f1b39abe15a55e1))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/xinchan-gx/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/xinchan-gx/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加股票数据订阅功能，优化股票列表动态更新逻辑，增强用户体验 ([0bbfd48](https://github.com/xinchan-gx/yunchan-web/commit/0bbfd48601797e92b8b171918a4b6bc93ab14e14))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/xinchan-gx/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))
* 添加均线计算和买卖点计算功能，优化相关逻辑和类型定义 ([373bdd3](https://github.com/xinchan-gx/yunchan-web/commit/373bdd39c320db51a487f3f86d6acb25d679e50b))
* 添加特色推送页面，整合股票推送数据，优化表格展示和交互功能 ([3dc28a8](https://github.com/xinchan-gx/yunchan-web/commit/3dc28a80ac634a96fec4328ecef7c0f484a53033))
* 添加指标参数编辑功能，优化二级指标组件逻辑 ([563b1de](https://github.com/xinchan-gx/yunchan-web/commit/563b1deb1ff371d0156015ee63d52ca3d7ca3f5e))
* 移除调试日志，调整图表和绘制逻辑，优化代码可读性 ([8f7a522](https://github.com/xinchan-gx/yunchan-web/commit/8f7a5222cd301e345d367bf4ecce288f8217faae))
* 移除无用的日志，重构推送页面数据结构，新增推送周期和缠论信号字段，优化日期格式化逻辑，添加 dayjs 插件 ([a71f5ce](https://github.com/xinchan-gx/yunchan-web/commit/a71f5ce91fc569b53400f4fbd97f79f0165ebd7f))
* 优化股票池组件，添加排序功能，使用 useRef 存储原始数据，提升性能和可读性 ([98a09fa](https://github.com/xinchan-gx/yunchan-web/commit/98a09fa22643e34d7a86b6f231ea1ee7065663e7))
* 优化股票订阅逻辑，移除冗余代码，增强组件性能和可读性 ([f13fd97](https://github.com/xinchan-gx/yunchan-web/commit/f13fd9751a66102d7869a59c26aecd252d2dd134))
* 优化股票闪烁动画时长，更新 WebSocket 目标地址，重构表格数据更新逻辑，添加时间比较工具函数 ([16f712b](https://github.com/xinchan-gx/yunchan-web/commit/16f712b256aeb29b3a8906f7db7133e4cde550d3))
* 优化股票收集列表和时间管理逻辑，重构相关组件以提升性能和可读性 ([cb5fda2](https://github.com/xinchan-gx/yunchan-web/commit/cb5fda2a0baf812da9c9c48018c6048955c98d76))
* 重构表格数据处理逻辑，更新相关引用，优化用户中心登出逻辑，调整组件样式，删除无用的 use-table-data 钩子 ([0f75793](https://github.com/xinchan-gx/yunchan-web/commit/0f75793c38f64367f5595a525927df73204799e4))
* 重构股票管理逻辑，更新相关引用为 stockUtils，新增 react-scan 依赖，优化假期和经济数据表格样式 ([1da1297](https://github.com/xinchan-gx/yunchan-web/commit/1da129776893c82b7ac2a357304a5c7cd629e994))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/xinchan-gx/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))

### 🎫 Chores | 其他更新

* Release v1.5.0 ([ec321f7](https://github.com/xinchan-gx/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/xinchan-gx/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))
* Release v1.7.0 ([a570920](https://github.com/xinchan-gx/yunchan-web/commit/a5709201f90e24fcb04df93a6f6d4f247d614576))
* Release v1.8.0 ([e9f1551](https://github.com/xinchan-gx/yunchan-web/commit/e9f15516161d61b36b326aa72b1072f5abb4c539))
* Release v1.8.1 ([7782db2](https://github.com/xinchan-gx/yunchan-web/commit/7782db2aa0ad37d61dc03d278622314fd676f124))
* Release v1.8.2 ([5ab5691](https://github.com/xinchan-gx/yunchan-web/commit/5ab5691efe63c0de666d898f7cdd61cad17fe1d9))
* Release v1.9.0 ([32b5465](https://github.com/xinchan-gx/yunchan-web/commit/32b5465f1b9b1db8defbedcaeebf5ec0e32bde75))

### ♻ Code Refactoring | 代码重构

* 移除未使用的 use-table-selection 和 use-cache-request 钩子，优化代码结构 ([d06d9f0](https://github.com/xinchan-gx/yunchan-web/commit/d06d9f0d608aaa2b4b5c8fd0bb15ab6c5ee09d2e))

## [1.9.0](https://github.com/xinchan-gx/yunchan-web/compare/1.4.0...1.9.0) (2025-01-07)

### ✨ Features | 新功能

* 调整大盘图表轴标签显示间隔，优化时间格式化逻辑 ([cd9090a](https://github.com/xinchan-gx/yunchan-web/commit/cd9090ae7c39aa265ae07a33d0bcce267621cc9d))
* 调整股票闪烁动画时长，优化价格闪烁逻辑，增加随机延迟效果 ([9fcffbd](https://github.com/xinchan-gx/yunchan-web/commit/9fcffbd6cc708120bdbfa7a03884254809913d4a))
* 更新 JknIcon 导入方式，添加 rc-table 类型定义，优化代码结构 ([b099825](https://github.com/xinchan-gx/yunchan-web/commit/b099825d52ec16a45725aed287dbf42e37d4e510))
* 更新 WebSocket URL 构建逻辑，支持动态主机和端口配置 ([d0d5e85](https://github.com/xinchan-gx/yunchan-web/commit/d0d5e8573da74f4245554c48d744416ace4c912c))
* 更新股票路径，添加复选框钩子，优化表格数据处理逻辑，新增图标资源 ([c9963e2](https://github.com/xinchan-gx/yunchan-web/commit/c9963e2034e4609ad6e31eaa8c3d62ab39a67e3c))
* 更新指标参数处理逻辑，优化相关组件和API调用 ([4e8cce9](https://github.com/xinchan-gx/yunchan-web/commit/4e8cce9201f0ac418912b4bc865ebab5f327f0d8))
* 将消息队列处理从 requestIdleCallback 更改为 requestAnimationFrame，优化性能 ([a8fde30](https://github.com/xinchan-gx/yunchan-web/commit/a8fde30e98484d934199b6c346268173e2f4541e))
* 添加 dataZoom 事件监听，优化主图指标的动态展示逻辑 ([ec94b5c](https://github.com/xinchan-gx/yunchan-web/commit/ec94b5c8dde54a7c892536b76c2518b0cf341c7a))
* 添加 useTableData 钩子，优化表格数据管理和排序功能，更新相关组件以支持新钩子 ([9afa65b](https://github.com/xinchan-gx/yunchan-web/commit/9afa65b946f8ba4387436769c356ecb08f7636ee))
* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/xinchan-gx/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加大盘指数数据获取，优化股票订阅逻辑和图表展示 ([ab06e4c](https://github.com/xinchan-gx/yunchan-web/commit/ab06e4cae553e81bd8b89467c2b2d1fc51857f0a))
* 添加调试日志，优化模态框打开逻辑 ([4b8b69b](https://github.com/xinchan-gx/yunchan-web/commit/4b8b69baf10669eb50d7c94f2f1b39abe15a55e1))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/xinchan-gx/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/xinchan-gx/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加股票数据订阅功能，优化股票列表动态更新逻辑，增强用户体验 ([0bbfd48](https://github.com/xinchan-gx/yunchan-web/commit/0bbfd48601797e92b8b171918a4b6bc93ab14e14))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/xinchan-gx/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))
* 添加均线计算和买卖点计算功能，优化相关逻辑和类型定义 ([373bdd3](https://github.com/xinchan-gx/yunchan-web/commit/373bdd39c320db51a487f3f86d6acb25d679e50b))
* 添加特色推送页面，整合股票推送数据，优化表格展示和交互功能 ([3dc28a8](https://github.com/xinchan-gx/yunchan-web/commit/3dc28a80ac634a96fec4328ecef7c0f484a53033))
* 添加指标参数编辑功能，优化二级指标组件逻辑 ([563b1de](https://github.com/xinchan-gx/yunchan-web/commit/563b1deb1ff371d0156015ee63d52ca3d7ca3f5e))
* 移除调试日志，调整图表和绘制逻辑，优化代码可读性 ([8f7a522](https://github.com/xinchan-gx/yunchan-web/commit/8f7a5222cd301e345d367bf4ecce288f8217faae))
* 移除无用的日志，重构推送页面数据结构，新增推送周期和缠论信号字段，优化日期格式化逻辑，添加 dayjs 插件 ([a71f5ce](https://github.com/xinchan-gx/yunchan-web/commit/a71f5ce91fc569b53400f4fbd97f79f0165ebd7f))
* 优化股票池组件，添加排序功能，使用 useRef 存储原始数据，提升性能和可读性 ([98a09fa](https://github.com/xinchan-gx/yunchan-web/commit/98a09fa22643e34d7a86b6f231ea1ee7065663e7))
* 优化股票订阅逻辑，移除冗余代码，增强组件性能和可读性 ([f13fd97](https://github.com/xinchan-gx/yunchan-web/commit/f13fd9751a66102d7869a59c26aecd252d2dd134))
* 优化股票闪烁动画时长，更新 WebSocket 目标地址，重构表格数据更新逻辑，添加时间比较工具函数 ([16f712b](https://github.com/xinchan-gx/yunchan-web/commit/16f712b256aeb29b3a8906f7db7133e4cde550d3))
* 优化股票收集列表和时间管理逻辑，重构相关组件以提升性能和可读性 ([cb5fda2](https://github.com/xinchan-gx/yunchan-web/commit/cb5fda2a0baf812da9c9c48018c6048955c98d76))
* 重构股票管理逻辑，更新相关引用为 stockUtils，新增 react-scan 依赖，优化假期和经济数据表格样式 ([1da1297](https://github.com/xinchan-gx/yunchan-web/commit/1da129776893c82b7ac2a357304a5c7cd629e994))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/xinchan-gx/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))

### 🎫 Chores | 其他更新

* Release v1.5.0 ([ec321f7](https://github.com/xinchan-gx/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/xinchan-gx/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))
* Release v1.7.0 ([a570920](https://github.com/xinchan-gx/yunchan-web/commit/a5709201f90e24fcb04df93a6f6d4f247d614576))
* Release v1.8.0 ([e9f1551](https://github.com/xinchan-gx/yunchan-web/commit/e9f15516161d61b36b326aa72b1072f5abb4c539))
* Release v1.8.1 ([7782db2](https://github.com/xinchan-gx/yunchan-web/commit/7782db2aa0ad37d61dc03d278622314fd676f124))
* Release v1.8.2 ([5ab5691](https://github.com/xinchan-gx/yunchan-web/commit/5ab5691efe63c0de666d898f7cdd61cad17fe1d9))

### ♻ Code Refactoring | 代码重构

* 移除未使用的 use-table-selection 和 use-cache-request 钩子，优化代码结构 ([d06d9f0](https://github.com/xinchan-gx/yunchan-web/commit/d06d9f0d608aaa2b4b5c8fd0bb15ab6c5ee09d2e))

## [1.8.2](https://github.com/xinchan-gx/yunchan-web/compare/1.4.0...1.8.2) (2025-01-03)

### ✨ Features | 新功能

* 更新指标参数处理逻辑，优化相关组件和API调用 ([4e8cce9](https://github.com/xinchan-gx/yunchan-web/commit/4e8cce9201f0ac418912b4bc865ebab5f327f0d8))
* 添加 dataZoom 事件监听，优化主图指标的动态展示逻辑 ([ec94b5c](https://github.com/xinchan-gx/yunchan-web/commit/ec94b5c8dde54a7c892536b76c2518b0cf341c7a))
* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/xinchan-gx/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加大盘指数数据获取，优化股票订阅逻辑和图表展示 ([ab06e4c](https://github.com/xinchan-gx/yunchan-web/commit/ab06e4cae553e81bd8b89467c2b2d1fc51857f0a))
* 添加调试日志，优化模态框打开逻辑 ([4b8b69b](https://github.com/xinchan-gx/yunchan-web/commit/4b8b69baf10669eb50d7c94f2f1b39abe15a55e1))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/xinchan-gx/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/xinchan-gx/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加股票数据订阅功能，优化股票列表动态更新逻辑，增强用户体验 ([a72bdc7](https://github.com/xinchan-gx/yunchan-web/commit/a72bdc74af3f65e2f9d70fc8d8c77d5a88b7b2f7))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/xinchan-gx/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))
* 添加均线计算和买卖点计算功能，优化相关逻辑和类型定义 ([373bdd3](https://github.com/xinchan-gx/yunchan-web/commit/373bdd39c320db51a487f3f86d6acb25d679e50b))
* 添加指标参数编辑功能，优化二级指标组件逻辑 ([563b1de](https://github.com/xinchan-gx/yunchan-web/commit/563b1deb1ff371d0156015ee63d52ca3d7ca3f5e))
* 移除调试日志，调整图表和绘制逻辑，优化代码可读性 ([8f7a522](https://github.com/xinchan-gx/yunchan-web/commit/8f7a5222cd301e345d367bf4ecce288f8217faae))
* 优化股票订阅逻辑，移除冗余代码，增强组件性能和可读性 ([f13fd97](https://github.com/xinchan-gx/yunchan-web/commit/f13fd9751a66102d7869a59c26aecd252d2dd134))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/xinchan-gx/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))

### 🎫 Chores | 其他更新

* Release v1.5.0 ([ec321f7](https://github.com/xinchan-gx/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/xinchan-gx/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))
* Release v1.7.0 ([a570920](https://github.com/xinchan-gx/yunchan-web/commit/a5709201f90e24fcb04df93a6f6d4f247d614576))
* Release v1.8.0 ([e9f1551](https://github.com/xinchan-gx/yunchan-web/commit/e9f15516161d61b36b326aa72b1072f5abb4c539))
* Release v1.8.1 ([7782db2](https://github.com/xinchan-gx/yunchan-web/commit/7782db2aa0ad37d61dc03d278622314fd676f124))

### ♻ Code Refactoring | 代码重构

* 移除未使用的 use-table-selection 和 use-cache-request 钩子，优化代码结构 ([d06d9f0](https://github.com/xinchan-gx/yunchan-web/commit/d06d9f0d608aaa2b4b5c8fd0bb15ab6c5ee09d2e))

## [1.8.1](https://github.com/lrdmatrix/yunchan-web/compare/1.4.0...1.8.1) (2025-01-02)

### ✨ Features | 新功能

* 更新指标参数处理逻辑，优化相关组件和API调用 ([4e8cce9](https://github.com/lrdmatrix/yunchan-web/commit/4e8cce9201f0ac418912b4bc865ebab5f327f0d8))
* 添加 dataZoom 事件监听，优化主图指标的动态展示逻辑 ([ec94b5c](https://github.com/lrdmatrix/yunchan-web/commit/ec94b5c8dde54a7c892536b76c2518b0cf341c7a))
* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/lrdmatrix/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加调试日志，优化模态框打开逻辑 ([4b8b69b](https://github.com/lrdmatrix/yunchan-web/commit/4b8b69baf10669eb50d7c94f2f1b39abe15a55e1))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/lrdmatrix/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/lrdmatrix/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/lrdmatrix/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))
* 添加均线计算和买卖点计算功能，优化相关逻辑和类型定义 ([373bdd3](https://github.com/lrdmatrix/yunchan-web/commit/373bdd39c320db51a487f3f86d6acb25d679e50b))
* 添加指标参数编辑功能，优化二级指标组件逻辑 ([563b1de](https://github.com/lrdmatrix/yunchan-web/commit/563b1deb1ff371d0156015ee63d52ca3d7ca3f5e))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/lrdmatrix/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))

### 🎫 Chores | 其他更新

* Release v1.5.0 ([ec321f7](https://github.com/lrdmatrix/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/lrdmatrix/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))
* Release v1.7.0 ([a570920](https://github.com/lrdmatrix/yunchan-web/commit/a5709201f90e24fcb04df93a6f6d4f247d614576))
* Release v1.8.0 ([e9f1551](https://github.com/lrdmatrix/yunchan-web/commit/e9f15516161d61b36b326aa72b1072f5abb4c539))

### ♻ Code Refactoring | 代码重构

* 移除未使用的 use-table-selection 和 use-cache-request 钩子，优化代码结构 ([d06d9f0](https://github.com/lrdmatrix/yunchan-web/commit/d06d9f0d608aaa2b4b5c8fd0bb15ab6c5ee09d2e))

## [1.8.0](https://github.com/lrdmatrix/yunchan-web/compare/1.4.0...1.8.0) (2024-12-31)

### ✨ Features | 新功能

* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/lrdmatrix/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/lrdmatrix/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/lrdmatrix/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/lrdmatrix/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))
* 添加均线计算和买卖点计算功能，优化相关逻辑和类型定义 ([373bdd3](https://github.com/lrdmatrix/yunchan-web/commit/373bdd39c320db51a487f3f86d6acb25d679e50b))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/lrdmatrix/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))

### 🎫 Chores | 其他更新

* Release v1.5.0 ([ec321f7](https://github.com/lrdmatrix/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/lrdmatrix/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))
* Release v1.7.0 ([a570920](https://github.com/lrdmatrix/yunchan-web/commit/a5709201f90e24fcb04df93a6f6d4f247d614576))

## [1.7.0](https://github.com/lrdmatrix/yunchan-web/compare/1.4.0...1.7.0) (2024-12-31)

### ✨ Features | 新功能

* 添加财务统计功能，更新财务页面路由，优化表格组件 ([2011050](https://github.com/lrdmatrix/yunchan-web/commit/201105096035ee3dcde74ab1b76bd109b18eca4f))
* 添加股票 WebSocket 支持，更新环境变量，优化组件导入 ([ecdbe39](https://github.com/lrdmatrix/yunchan-web/commit/ecdbe39179804f0b6e57be65806c6a8a8ffb9d9e))
* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/lrdmatrix/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/lrdmatrix/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/lrdmatrix/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))

### 🎫 Chores | 其他更新

* Release v1.5.0 ([ec321f7](https://github.com/lrdmatrix/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))
* Release v1.6.0 ([1f1ec90](https://github.com/lrdmatrix/yunchan-web/commit/1f1ec90f3f18331c10c8a57406fdff48555ae8c7))

## [1.5.0](https://github.com/lrdmatrix/yunchan-web/compare/1.4.0...null) (2024-12-28)

### ✨ Features | 新功能

* 添加股票财务估值功能，更新财务页面路由，优化切换标签 ([781c824](https://github.com/lrdmatrix/yunchan-web/commit/781c824f8e3870682f82b14a3a77db5b8f772a2c))
* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/lrdmatrix/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))

### 🐛 Bug Fixes | Bug 修复

* 修复类型定义，更新组件导入方式 ([dafffdf](https://github.com/lrdmatrix/yunchan-web/commit/dafffdf6e4cda56ff4206aa3f86c44c72623acba))

### 🎫 Chores | 其他更新

* Release v1.5.0 ([ec321f7](https://github.com/lrdmatrix/yunchan-web/commit/ec321f70ec3ae04aad23e3daf85fa1ed1e8ee1be))

## [1.5.0](https://github.com/lrdmatrix/yunchan-web/compare/1.4.0...1.5.0) (2024-12-28)

### ✨ Features | 新功能

* 添加进度条组件，更新主题颜色变量，修复类型定义，优化样式处理 ([ba8fb1a](https://github.com/lrdmatrix/yunchan-web/commit/ba8fb1a7fda9b09e218df0e93efd152454ceacb6))

## [1.4.0](https://github.com/lrdmatrix/yunchan-web/compare/1.1.0...1.4.0) (2024-12-27)

### ✨ Features | 新功能

* 更新 release-it 配置，添加新功能类型以支持更详细的变更日志 ([70f4df1](https://github.com/lrdmatrix/yunchan-web/commit/70f4df1a32aad76ffcddaa732509ea81b4946b40))
* 使用 react-query 重构登录表单，优化数据处理逻辑并提升用户体验 ([4834356](https://github.com/lrdmatrix/yunchan-web/commit/483435602861e98315f2d2fb22f68bc43564b89b))
* 添加财务估值页面，重构股票页面路由，优化查询参数处理 ([7d05e11](https://github.com/lrdmatrix/yunchan-web/commit/7d05e11f911774ce81b9278cdd491820b9d52afc))
* 添加消息已读标记功能，优化消息中心组件，增加 WebSocket 消息处理 ([2c6855a](https://github.com/lrdmatrix/yunchan-web/commit/2c6855a725cb3928e85009db45486ad7d43ede80))

### 🎫 Chores | 其他更新

* Release v1.2.0 ([aebaabe](https://github.com/lrdmatrix/yunchan-web/commit/aebaabef3e5afccde9c9676be87fc6b24c97d1a6))
* Release v1.3.0 ([35fc22e](https://github.com/lrdmatrix/yunchan-web/commit/35fc22e5747e1ff83876ae1a3380e30ddca9bbb5))

## [1.3.0](https://github.com/lrdmatrix/yunchan-web/compare/1.1.0...1.3.0) (2024-12-27)

### ✨ Features | 新功能

* 更新 release-it 配置，添加新功能类型以支持更详细的变更日志 ([70f4df1](https://github.com/lrdmatrix/yunchan-web/commit/70f4df1a32aad76ffcddaa732509ea81b4946b40))
* 使用 react-query 重构登录表单，优化数据处理逻辑并提升用户体验 ([4834356](https://github.com/lrdmatrix/yunchan-web/commit/483435602861e98315f2d2fb22f68bc43564b89b))
* 添加消息已读标记功能，优化消息中心组件，增加 WebSocket 消息处理 ([2c6855a](https://github.com/lrdmatrix/yunchan-web/commit/2c6855a725cb3928e85009db45486ad7d43ede80))

### 🎫 Chores | 其他更新

* Release v1.2.0 ([aebaabe](https://github.com/lrdmatrix/yunchan-web/commit/aebaabef3e5afccde9c9676be87fc6b24c97d1a6))

## [1.2.0](https://github.com/lrdmatrix/yunchan-web/compare/1.1.0...1.2.0) (2024-12-26)

### ✨ Features | 新功能

* 更新 release-it 配置，添加新功能类型以支持更详细的变更日志 ([70f4df1](https://github.com/lrdmatrix/yunchan-web/commit/70f4df1a32aad76ffcddaa732509ea81b4946b40))
* 添加消息已读标记功能，优化消息中心组件，增加 WebSocket 消息处理 ([2c6855a](https://github.com/lrdmatrix/yunchan-web/commit/2c6855a725cb3928e85009db45486ad7d43ede80))

## 1.1.0 (2024-12-26)

### Features

* 添加 compression-webpack-plugin 以支持资源压缩 ([e218b2f](https://github.com/lrdmatrix/yunchan-web/commit/e218b2f83cf79a6be36a4e0293a3e75ec3bdeb1e))
* 添加 WebSocket URL 配置，移除服务器相关组件和逻辑 ([68f4fe8](https://github.com/lrdmatrix/yunchan-web/commit/68f4fe847ca881bf7b5699fc66e8a27a4fd2f2d0))
* 添加部署脚本以支持自动化部署，更新 package.json 配置 ([38af82a](https://github.com/lrdmatrix/yunchan-web/commit/38af82ab55e95b93300a1878e7e55dee47bac812))
* 添加发布标签插件，更新构建配置以支持版本信息显示 ([fd36ff5](https://github.com/lrdmatrix/yunchan-web/commit/fd36ff59f9586caa4f6fb0be79ddb61697b72e37))
* 添加首页标题，更新 HTML 标题和图标，优化组件结构，增加中概股数据获取功能 ([9699d50](https://github.com/lrdmatrix/yunchan-web/commit/9699d5026498a7f327bc5846ac52db798bf7de5f))
* 优化背景颜色 ([3bbbde2](https://github.com/lrdmatrix/yunchan-web/commit/3bbbde280dfc0b20abc4ab2d38ebd7b542a2dc68))
* 重构应用主题和样式 ([c994039](https://github.com/lrdmatrix/yunchan-web/commit/c9940394a99ff9d406dedc606f507f580e9c03c2))
* **api:** 新增报警日志接口并优化相关功能 ([53f558c](https://github.com/lrdmatrix/yunchan-web/commit/53f558c725873d1529df89c732794513bcdd24bf))
* **api:** 优化报警日志接口并添加价格报警功能 ([d0d097c](https://github.com/lrdmatrix/yunchan-web/commit/d0d097c6c55d069b244e62c3dde06f071abdfc9c))
* **calendar:** 新增经济数据详情和休市信息功能 ([465f620](https://github.com/lrdmatrix/yunchan-web/commit/465f620f63a0413121f1e31b16c2dfc054f2b30b))
* **components:** 新增大V快评和AI报警功能 ([703f471](https://github.com/lrdmatrix/yunchan-web/commit/703f471de7857b445feab67a67876679a4c87acf))
* **components:** 新增滚动区域组件并优化表格功能 ([c14e355](https://github.com/lrdmatrix/yunchan-web/commit/c14e355f3373aac7bb555080328a2b3b52ebedfa))
* **components:** 新增选择框和切换按钮组件 ([df2b641](https://github.com/lrdmatrix/yunchan-web/commit/df2b641a06323ddc6fc161040d55900982d114f5))
* **components:** 新增组件并优化现有组件功能 ([facd211](https://github.com/lrdmatrix/yunchan-web/commit/facd211f8a4eafb3f9f5284684db4e2948d3092f))
* **config:** 添加系统设置功能 ([bb13835](https://github.com/lrdmatrix/yunchan-web/commit/bb138357efce0efeef704c948c99782b7b301efa))
* **dashboard:** 优化仪表盘页面功能和样式 ([87f42c6](https://github.com/lrdmatrix/yunchan-web/commit/87f42c6a801b36f10e0fca2bcc030798e39c3cac))
* **decimal:** 更新 toShortCN 方法以支持可选小数位数；优化价格单位转换逻辑 ([e8327a7](https://github.com/lrdmatrix/yunchan-web/commit/e8327a775bcfd39866b642a6c3ac4b722a5789ba))
* **decimal:** 添加 toShortCN 方法，优化价格单位转换逻辑；更新相关组件以支持 Decimal 类型 ([223d5ca](https://github.com/lrdmatrix/yunchan-web/commit/223d5ca9b117fc69e15ccf11bd599e21920022a7))
* **dialog:** 优化对话框组件功能和性能 ([8c1b560](https://github.com/lrdmatrix/yunchan-web/commit/8c1b5604b2d16b63b501fbcdcee2cf9fec37f6a9))
* **icon:** 添加多个图标资源并更新图标类型定义 ([1383c52](https://github.com/lrdmatrix/yunchan-web/commit/1383c52f2fba1a2fdaa034d1f590b177ce5d309d))
* **large-cap:** 优化大型股图表功能 ([30bd259](https://github.com/lrdmatrix/yunchan-web/commit/30bd259f8c7fca46e2e822d0ba5d0882367b33a6))
* **star:** 将新建金池按钮替换为自定义样式的 div 组件 ([26d1a0f](https://github.com/lrdmatrix/yunchan-web/commit/26d1a0f0225e88a88ea7b72e6f353edb07ea2b47))
* **stock:** 更新股票图表功能，优化数据类型和绘制逻辑 ([952ad23](https://github.com/lrdmatrix/yunchan-web/commit/952ad23c7ad9435cc5a7c57e372fa0cc04492fa7))
* **stock:** 更新股票选择参数为可选，优化因子步骤组件的状态管理 ([e1aebf0](https://github.com/lrdmatrix/yunchan-web/commit/e1aebf0e5596a7bc0f40077a042c4d746c61cf12))
* **stock:** 更新时间指数选择逻辑，优化主图和副图指标数据处理，添加时间转换工具函数 ([afb28f5](https://github.com/lrdmatrix/yunchan-web/commit/afb28f559cc6e9c299aa986f9f31c924046575b6))
* **stock:** 精简代码，移除未使用的导入和状态管理逻辑，优化附图指标处理 ([a3c3662](https://github.com/lrdmatrix/yunchan-web/commit/a3c36621b65a23749e7714be20dda01ad2566950))
* **stock:** 实现股票 K 线图组件 ([0acaf57](https://github.com/lrdmatrix/yunchan-web/commit/0acaf57478cfb823b5e751019f95dd2fee9382eb))
* **stock:** 使用 Decimal.js 优化价格和百分比的计算，改善数据展示 ([816499c](https://github.com/lrdmatrix/yunchan-web/commit/816499c96419f5d296dd87355075bcb96cac5b58))
* **stock:** 添加本地计算指标判断，优化绘制逻辑，调整数据结构 ([860c241](https://github.com/lrdmatrix/yunchan-web/commit/860c2412c47dcae8e9f93c70957864de9869d40a))
* **stock:** 添加叠加标记功能，优化搜索列表和主图渲染逻辑 ([fcead5f](https://github.com/lrdmatrix/yunchan-web/commit/fcead5f2fa4b2d267d6d892ed0603c608a1cea26))
* **stock:** 添加副图渲染功能，优化指标数据处理和样式转换 ([d4b8445](https://github.com/lrdmatrix/yunchan-web/commit/d4b8445ebd2af08961e803fe845d6aaf67b90de2))
* **stock:** 添加股票代码获取方法，优化股票记录管理逻辑 ([1949483](https://github.com/lrdmatrix/yunchan-web/commit/19494830525755eb04c649e387b502711657d26b))
* **stock:** 添加股票基本信息查询，优化市值和财务指标显示逻辑 ([d2f9cfb](https://github.com/lrdmatrix/yunchan-web/commit/d2f9cfb80818de2e4d4482c06545ec2c184c4391))
* **stock:** 添加股票交易周期和热力图功能 ([fb575d9](https://github.com/lrdmatrix/yunchan-web/commit/fb575d999a0fb1947403fecba9a96fd7fa907903))
* **stock:** 添加股票日历功能并优化相关组件 ([8a44746](https://github.com/lrdmatrix/yunchan-web/commit/8a44746002f0e0e99065e6892083c8041bbe017d))
* **stock:** 添加股票详情页面 ([03c101f](https://github.com/lrdmatrix/yunchan-web/commit/03c101f814656f5940c60a17c90aa3daaa9b44ae))
* **stock:** 添加美股数据接口和图标 ([06cc41b](https://github.com/lrdmatrix/yunchan-web/commit/06cc41bef109d7d6d7b16c23dfc85bf018b3a5d6))
* **stock:** 添加深度实体和信息窗口实体，更新主图和数据结构，优化数据处理逻辑 ([e10e489](https://github.com/lrdmatrix/yunchan-web/commit/e10e4897ee6deeafe41772f8e790faa3d9eebb39))
* **stock:** 添加时间指标菜单组件，优化图表上下文管理，增加坐标轴设置功能 ([3e0a8ea](https://github.com/lrdmatrix/yunchan-web/commit/3e0a8ea9452d61cd89587fb3111d76badd9804f9))
* **stock:** 添加时间指数选择组件，优化主图和副图指标渲染逻辑 ([48f4a28](https://github.com/lrdmatrix/yunchan-web/commit/48f4a2836dcd26a0b323875d6eff00a2c43a91ca))
* **stock:** 添加水印功能，优化指标数据结构，简化最大值计算逻辑 ([fd557b7](https://github.com/lrdmatrix/yunchan-web/commit/fd557b78956ee654aa6b743003a38595d1d36935))
* **stock:** 添加巫日数据获取功能，优化日历组件结构 ([e5e24f1](https://github.com/lrdmatrix/yunchan-web/commit/e5e24f17420a772194a14b044162ad9f479e0816))
* **stock:** 移除不必要的 stock 导入，优化相关组件的代码结构 ([fc21ce1](https://github.com/lrdmatrix/yunchan-web/commit/fc21ce1afc629e9f1312856ee487b8e9869fb63b))
* **stock:** 优化副图渲染逻辑，调整数据结构合并绘制方式 ([2693bfc](https://github.com/lrdmatrix/yunchan-web/commit/2693bfc5bbee8222f8f8aad7c423665d4f28fcc2))
* **stock:** 优化股票订阅和 WebSocket 连接 ([873a92e](https://github.com/lrdmatrix/yunchan-web/commit/873a92e7cfd1d78413f0193df25e33fa58447728))
* **stock:** 优化股票金池功能 ([099d281](https://github.com/lrdmatrix/yunchan-web/commit/099d281fabd7e5584f6a165e821ae8b0399dd9f7))
* **stock:** 优化股票数据处理和时间判断 ([f56c980](https://github.com/lrdmatrix/yunchan-web/commit/f56c980c4fd690c8823b231da74bf24fac865757))
* **stock:** 优化渐变绘制逻辑，简化数据处理，移除未使用的叠加标记功能 ([468d3c8](https://github.com/lrdmatrix/yunchan-web/commit/468d3c883ef4fbe5ec412eabeae3f899b19a7a9f))
* **stock:** 优化图表上下文管理，简化状态获取逻辑，调整默认状态创建 ([b9c8625](https://github.com/lrdmatrix/yunchan-web/commit/b9c86252e29316206a14aa00c85f9ca2901ec609))
* **stock:** 增强 K 线图功能，添加图表实例支持和文本绘制功能 ([878bafc](https://github.com/lrdmatrix/yunchan-web/commit/878bafc670c89c4dd15385ea4060b1e664c75dc5))
* **stock:** 重构 K 线图表功能 ([ed88bb7](https://github.com/lrdmatrix/yunchan-web/commit/ed88bb775d71bda3c01b718194e35d9c2262f034))
* **super:** 实现选股功能 ([74c3204](https://github.com/lrdmatrix/yunchan-web/commit/74c3204fcb0c28d200ee92745911d00a88bacceb))
* **table:** 调整表格列宽和样式，优化数据展示和用户体验 ([d419caa](https://github.com/lrdmatrix/yunchan-web/commit/d419caa707ab4f8ed96735093d75a77ad4a7e177))
* **table:** 添加水平溢出隐藏样式，优化虚拟化表格组件的布局 ([38c0a43](https://github.com/lrdmatrix/yunchan-web/commit/38c0a43b9aa1a588a9602dbbdc9a6bff431eefeb))
* **table:** 优化单表组件，调整列宽和样式，改善用户体验 ([d982f18](https://github.com/lrdmatrix/yunchan-web/commit/d982f189238188a9bb830b1241492acc11ae6643))
* **table:** 优化虚拟化表格组件，调整列宽计算逻辑，改善无数据状态展示 ([e595166](https://github.com/lrdmatrix/yunchan-web/commit/e59516639d802c9f69707e1d50b0449a72015b37))
* **table:** 优化虚拟化表格组件，调整列宽设置，改进数据处理逻辑 ([ec3cc7f](https://github.com/lrdmatrix/yunchan-web/commit/ec3cc7f6df56da63ae2fc4f163c901130888d04b))
* **user:** 实现用户信息缓存及查询 ([c231c4b](https://github.com/lrdmatrix/yunchan-web/commit/c231c4bed88321f4742c82a4b301314c1b0f973c))
* **ws:** 重构 WebSocket 连接管理 ([27952fb](https://github.com/lrdmatrix/yunchan-web/commit/27952fb44e20634aabad5f20d95f55d02b96d95e))

### Bug Fixes

* 优化首页K线图显示 ([310e3a0](https://github.com/lrdmatrix/yunchan-web/commit/310e3a0e99e51fb7aafb7709d95e5c7c14c5f207))
