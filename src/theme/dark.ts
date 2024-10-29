import type { ThemeConfig } from 'antd'

const theme: ThemeConfig = {
  token: {
    colorBgBase: '#0c0c0c',
    colorTextBase: '#ffffff',
    colorBgContainer: '#202020',
    colorBgElevated: '#202020',
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
    }
  }
}

export default theme
