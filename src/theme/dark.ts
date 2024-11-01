import type { ThemeConfig } from 'antd'

const theme: ThemeConfig = {
  token: {
    colorBgBase: '#0c0c0c',
    colorTextBase: '#ffffff',
    colorBgContainer: '#141518',
    colorBgElevated: '#141518',
    colorText: '#fff',
    borderRadius: 4
  },
  components: {
    Spin: {
      colorPrimary: '#fff'
    },
    Button: {
      colorPrimary: '#3156f5',
      algorithm: true,
      primaryShadow: 'none',
      defaultHoverBorderColor: '#fff',
      defaultHoverColor: '#fff',
    },
    Tooltip: {
      colorBgSpotlight: '#141518'
    }
  }
}

export default theme
