import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { DebugGridProvider, DebugGridToggle } from '../components/SlidePreview'
import { SlideThemeProvider, ThemeSelector } from '../components/ThemeProvider'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isEditor = router.pathname === '/editor'

  return (
    <SlideThemeProvider>
      <DebugGridProvider>
        <Component {...pageProps} />
        {!isEditor && <ThemeSelector />}
        {!isEditor && <DebugGridToggle />}
      </DebugGridProvider>
    </SlideThemeProvider>
  )
}
