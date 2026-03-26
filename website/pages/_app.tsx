import type { AppProps } from 'next/app'
import { DebugGridProvider, DebugGridToggle } from '../components/SlidePreview'
import { SlideThemeProvider, ThemeSelector } from '../components/ThemeProvider'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SlideThemeProvider>
      <DebugGridProvider>
        <Component {...pageProps} />
        <ThemeSelector />
        <DebugGridToggle />
      </DebugGridProvider>
    </SlideThemeProvider>
  )
}
