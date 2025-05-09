import React from 'react'

const CookiesPage = () => {
  return (
    <div className="home-content-w-1 mx-auto" style={{ padding: '20px' }}>
      <h1>TodayChart Cookies政策</h1>
      <span className="text-[#808080] text-base">生效日期 2025年3月26日</span>
      <section>
        <h2>一、Cookies的定义及用途</h2>
        <p>
          Cookies
          是指存储在用户本地终端上的小型文本文件，用于记录和存储用户的相关信息。我们在网站中使用Cookies以实现以下功能：
        </p>
        <ol className="pl-4">
          <li>确保网站的正常运行，提升用户体验。</li>
          <li>分析用户行为，优化网站功能。</li>
          <li>提供个性化广告内容。</li>
          <li>其他有助于提升服务质量的功能。</li>
        </ol>
      </section>

      <section>
        <h2>二、Cookies的分类与管理</h2>
        <table style={{ width: '100%', marginTop: '10px' }} className="rounded overflow-hidden" cellSpacing={0}>
          <thead>
            <tr style={{ backgroundColor: '#333', color: '#fff' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>类别</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>用途</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>保留期限</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>管理方式</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-[#1F1F1F]">
              <td style={{ padding: '8px' }}>必要Cookies</td>
              <td style={{ padding: '8px' }}>确保网站的正常运行和安全性</td>
              <td style={{ padding: '8px' }}>会话期间</td>
              <td style={{ padding: '8px' }}>由网站直接管理</td>
            </tr>
            <tr className="bg-[#333]">
              <td style={{ padding: '8px' }}>分析Cookies</td>
              <td style={{ padding: '8px' }}>分析用户行为（Google Analytics）</td>
              <td style={{ padding: '8px' }}>3-6个月</td>
              <td style={{ padding: '8px' }}>用户可选择（设置一次性工具）</td>
            </tr>
            <tr className="bg-[#1F1F1F]">
              <td style={{ padding: '8px' }}>广告Cookies</td>
              <td style={{ padding: '8px' }}>用于推送个性化广告内容</td>
              <td style={{ padding: '8px' }}>3-12个月</td>
              <td style={{ padding: '8px' }}>受第三方管理（广告平台）</td>
            </tr>
            <tr className="bg-[#333]">
              <td style={{ padding: '8px' }}>第三方Cookies</td>
              <td style={{ padding: '8px' }}>由第三方服务提供商管理</td>
              <td style={{ padding: '8px' }}>视具体情况而定</td>
              <td style={{ padding: '8px' }}>由第三方直接管理</td>
            </tr>
          </tbody>
        </table>
        <span className="text-[#808080]">注：Cookies需用户主动同意， 关闭后部分功能可能受限</span>
      </section>

      <section>
        <h2>三、用户权利与操作指南</h2>
        <ol className="pl-4">
          <li>查看/修改Cookies</li>
          <ul className="pl-0">
            <li>路径：浏览器设置 → 隐私与安全 → Cookies管理</li>
            <li>支持浏览器：Chrome、Safari、Firefox、Edge（具体操作见12）</li>
          </ul>
          <li>撤回同意</li>
          <ul className="pl-0">
            <li>通过应用内「设置→隐私→关闭Cookies」限制非必要数据收集。</li>
          </ul>
          <li>删除Cookies</li>
          <ul className="pl-0">
            <li>浏览器提供“清除浏览数据”功能，可一键移除历史Cookies。</li>
          </ul>
        </ol>
      </section>

      <section>
        <h2>四、合规与安全</h2>
        <ol className="pl-4">
          <li>跨境传输</li>
          <ul className="pl-0">
            <li>数据存储于美国及新加坡合规服务器，符合GDPR、CCPA等要求。</li>
            <li>支持浏览器：Chrome、Safari、Firefox、Edge（具体操作见12）</li>
          </ul>
          <li>安全措施</li>
          <ul className="pl-0">
            <li>采用HTTPS加密传输，定期进行安全审计。</li>
          </ul>
          <li>政策更新</li>
          <ul className="pl-0">
            <li>重大变更将通过应用内通知及邮件告知，继续使用即视为同意。</li>
          </ul>
        </ol>
      </section>

      <section>
        <h2>五、联系我们</h2>
        <ul className="pl-4">
          <li>官方邮箱：todaychart2025@gmail.com</li>
          <li>反馈入口：App内「设置→帮助与反馈」</li>
        </ul>

        <p>版本：1.0 | 今日图表团队</p>

        <p>
          附：关键条款说明
          <br />• 必要性原则：禁用必要Cookies将导致核心功能失效。
          <br />• 第三方管理：广告Cookies需通过合作方（如Google）独立设置。
          <br />
        </p>
      </section>
    </div>
  )
}

export default CookiesPage
