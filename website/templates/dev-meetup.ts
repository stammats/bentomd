import type { Template } from './index'

export const devMeetupTemplate: Template = {
  id: 'dev-meetup',
  name: 'Dev Meetup LT',
  description: 'Lightning talk with code, diagrams, and before/after comparisons',
  category: 'tech',
  thumbnail: {
    background: '#0a0a0a',
    accent: '#e2e8f0',
    style: 'mono',
  },
  content: `---
title: Lightning Talk
theme: mono
style: mono
borderRadius: 16
palette:
  primary: "#e2e8f0"
  background: "#0a0a0a"
  surface: "#18181b"
  text: "#fafafa"
  muted: "#a1a1aa"
fonts:
  heading: "system-ui, sans-serif"
  body: "system-ui, sans-serif"
  mono: "JetBrains Mono, Fira Code, monospace"
defaults:
  pageNumber: true
---

## {cover, bg="#0a0a0a"}

# React Server Components 実践ガイド
クライアントバンドルを68%削減した設計判断

## {section, bg="#0a0a0a"}

# RSCの基本モデル
Server / Client の境界を理解する

## RSCが解決する問題

### 従来のReactの課題 {tall}
SPAではすべてのコンポーネントがクライアントで実行される。データ取得・表示・操作が全てJSバンドルに含まれる。
- HTMLをサーバーで返しても、Hydrationで全JSが必要
- 表示専用のコンポーネントもバンドルに含まれる
- \`useEffect\` + fetch のウォーターフォール問題

### RSCの考え方
Server Componentはサーバーでのみ実行され、HTMLとして配信される。JSバンドルに含まれない。
- \`async/await\` でデータ取得が直接書ける
- クライアントJSはインタラクション部分のみ
- デフォルトがServer、明示的に\`use client\`

## レンダリングモデルの違い

### 従来のSPA {tall}
\`\`\`mermaid
graph TB
  Browser[Browser] --> Bundle[JS Bundle]
  Bundle --> Render[全コンポーネント実行]
  Render --> DOM[DOM構築]
  Bundle --> Fetch[fetch/useEffect]
  Fetch --> API[Backend API]
  API --> Fetch
  Fetch --> Render
\`\`\`

### RSCモデル {tall}
\`\`\`mermaid
graph TB
  Server[Server] --> DB[DB/API直接アクセス]
  DB --> RSC[Server Component実行]
  RSC --> Payload[RSC Payload + HTML]
  Payload --> Browser[Browser]
  Browser --> Hydrate[Client Componentのみ Hydrate]
\`\`\`

## {section, bg="#0a0a0a"}

# 実装パターン
Before / After で見る設計変更

## 典型的なBefore

### {6x2}
\`\`\`typescript
// pages/dashboard.tsx — Before
'use client'  // ← 全てを巻き込む

import { Chart } from '@/components/Chart'
import { DataTable } from '@/components/Table'
import { DatePicker } from '@/components/Picker'
import { Sidebar } from '@/components/Sidebar'

export default function Dashboard() {
  const { data } = useSWR('/api/metrics')
  return (
    <Layout>
      <Sidebar />
      <Chart data={data} />
      <DataTable data={data} />
    </Layout>
  )
}
\`\`\`

### なぜ問題か
\`use client\` をページ上位に書くと、配下の全コンポーネントがクライアントバンドルに含まれる。Chart（180KB）、Table（95KB）など表示専用のものまでJSとして配信される。

### API経由のデータ取得
サーバーにあるデータをわざわざAPIで公開し、クライアントでfetchしている。直接DBから取れるものをネットワーク越しに往復させている。

## RSCで書き直す

### {6x2}
\`\`\`typescript
// app/dashboard/page.tsx — After
import { Chart } from '@/components/Chart'
import { DataTable } from '@/components/Table'
import { Sidebar } from '@/components/Sidebar'
import { DateFilter } from './DateFilter'

// Server Component: async関数として定義
export default async function Dashboard() {
  const data = await db.metrics.findMany()
  return (
    <Layout>
      <Sidebar />
      <Chart data={data} />
      <DataTable data={data} />
      <DateFilter />  {/* これだけ 'use client' */}
    </Layout>
  )
}
\`\`\`

### 変更のポイント
- ページレベルの\`use client\`を除去
- \`useSWR\` → \`await db.metrics.findMany()\`に変更
- Chart, Table, SidebarはServer Componentとして実行
- JSバンドルに含まれるのはDateFilterのみ

### 境界設計の原則
「ユーザー操作が必要か？」で判断する。onClick, onChange, useStateがあればClient。それ以外はServer。

## Server/Client境界の設計

### コンポーネントツリーの境界 {hero}
\`\`\`mermaid
graph LR
  subgraph Server["Server Components（JSなし）"]
    Page[Dashboard Page]
    Sidebar[Sidebar]
    Chart[Chart → SVG]
    Table[Data Table]
  end
  subgraph Client["Client Components（Hydrate対象）"]
    Filter[Date Filter]
    Toggle[Theme Toggle]
    Toast[Toast]
  end
  Page --> Sidebar
  Page --> Chart
  Page --> Table
  Page --> Filter
\`\`\`

### 判断基準
- **Server**: データ表示、静的UI、DBアクセス
- **Client**: フォーム入力、状態管理、ブラウザAPI使用
- 迷ったらServerで始めて、必要になったらClientに移す

## {section, bg="#0a0a0a"}

# 移行の進め方
段階的に、壊さずに

## 移行戦略：末端から着手

### 依存グラフの葉から剪定する {tall}
子を持たないコンポーネントから順にServer化する。親のuse clientを外すのは最後。
\`\`\`
移行順序:
1. Icon, Badge, Label → Server（状態なし）
2. Card, List, Table → Server（表示のみ）
3. Form, Modal, Dropdown → Client維持
4. Page → Server (async) + 部分的にClient
\`\`\`

### Feature Flagで段階展開
Vercel Edge ConfigやLaunchDarklyで段階リリース。10%→50%→100%の3段階で公開し、Core Web Vitalsを監視。

### 型でServer/Client境界を守る
\`\`\`typescript
// server-only パッケージで誤用を防ぐ
import 'server-only'
export async function getMetrics() {
  return db.metrics.findMany()
}
\`\`\`

## バンドルサイズの推移

### フェーズごとの削減量 {tall}
\`\`\`chart
type: column
移行前: 2400
Phase1 末端: 1800
Phase2 中間: 1100
完了: 780
\`\`\`

### 各フェーズでやったこと
- **Phase1**: Icon, Label等の末端をServer化（-600KB）
- **Phase2**: Chart, Tableをサーバー描画に移行（-700KB）
- **完了**: ページレベルのuse clientを除去（-320KB）
- 最終的にクライアントJSは780KB、use clientは12ファイルのみ

## {section, bg="#0a0a0a"}

# ハマりポイント
移行中に遭遇した問題と対処法

## use clientの伝播問題

### 親に書くと全部Clientになる {tall}
\`use client\` の配置が全てを決める。親に書くと全子孫がクライアントに巻き込まれる。
\`\`\`typescript
// ❌ Layoutに書くと全ページがClient
'use client'
export function Layout({ children }) {
  const [theme] = useTheme()
  return <div data-theme={theme}>{children}</div>
}

// ✅ ThemeだけをClientに分離
import { ThemeProvider } from './ThemeProvider'
export function Layout({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
\`\`\`

### Context使用時の注意
ContextはClient Componentでしか使えない。Providerをラップ用の小さなClient Componentに切り出し、中身はServer Componentのままにする。

### serializeできない値
Server → Client の境界ではpropsがJSON serializeされる。Date, Map, 関数は渡せない。

## まとめ

### :lightbulb: 設計原則
- デフォルトはServer Component
- \`use client\` は必要最小限の末端に配置
- データ取得はサーバー側で完結させる

### :tool: 移行のコツ
- 末端コンポーネントから段階的に移行
- \`server-only\` パッケージで境界を型安全に
- Feature Flagで段階リリース

### :book: 参考資料
- [Next.js App Router Docs](https://nextjs.org/docs)
- [React Server Components RFC](https://github.com/reactjs/rfcs)
- [Vercel Blog: Understanding RSC](https://vercel.com/blog)

## 実際の画面

### Lighthouse結果 {contain}
![Lighthouse](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800)

### DevTools Network {contain}
![Network](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800)

### Before / After {contain}
![Compare](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800)

## {cover, bg="#0a0a0a"}

# Thank you!
@yourhandle
`,
}
