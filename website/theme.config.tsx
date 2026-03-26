import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <strong>bentomd</strong>,
  project: {
    link: 'https://github.com/bentomd/bentomd',
  },
  docsRepositoryBase: 'https://github.com/bentomd/bentomd/tree/main/website',
  footer: {
    text: 'bentomd — Modular slide decks from Markdown + YAML',
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
  useNextSeoProps() {
    return { titleTemplate: '%s — bentomd' }
  },
}

export default config
