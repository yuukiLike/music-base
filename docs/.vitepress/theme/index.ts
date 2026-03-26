import DefaultTheme from 'vitepress/theme'
import { inject } from '@vercel/analytics'
import './styles/custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp() {
    if (typeof window !== 'undefined') {
      inject()
    }
  },
}
