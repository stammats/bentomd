import type { AppProps } from 'next/app'
import { DebugGridProvider } from '../components/SlidePreview'
import { SlideThemeProvider } from '../components/ThemeProvider'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SlideThemeProvider>
      <DebugGridProvider>
        <Component {...pageProps} />
      </DebugGridProvider>
    </SlideThemeProvider>
  )
}
