import type { ThemeConfig } from 'antd'

const theme: ThemeConfig = {
  token: {
    colorBgBase: '#0c0c0c',
    colorTextBase: '#ffffff',
    colorBgContainer: '#141518',
    colorBgElevated: '#141518',
    colorText: '#fff',
    borderRadius: 2
  },
  components: {
    Spin: {
      colorPrimary: '#fff'
    },
    Button: {
      colorPrimary: '#3156f5',
      algorithm: true,
      primaryShadow: 'none',
      defaultHoverBorderColor: 'var(--border-secondary-color)',
      defaultHoverColor: '#fff',
      defaultBorderColor: 'var(--border-color)',
      
    },
    Tooltip: {
      colorBgSpotlight: '#141518'
    },
    Input: {
      colorBorder: 'var(--border-color)',
      hoverBorderColor: 'var(--border-secondary-color)',
      activeBorderColor: 'var(--border-secondary-color)',
      controlOutline: 'transparent',
    }
  }
}

export default theme
