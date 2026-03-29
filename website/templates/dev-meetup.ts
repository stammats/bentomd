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

# 本番で学んだRSC移行
5分でわかる3ヶ月の記録

## {section, bg="#0a0a0a"}

# ある日のこと
Lighthouseスコアが32点だった

## 現実を直視した

### :gauge: Lighthouse **32**点
パフォーマンススコアが赤信号

### :package: バンドル **2.4MB**
クライアントJSが肥大化

### :clock: 初期表示 **6秒**
3G回線のユーザーが離脱

## 当時のアーキテクチャ

### アーキテクチャ（Before） {tall}
\`\`\`mermaid
graph TB
  Browser[Browser] --> Bundle[JS Bundle 2.4MB]
  Bundle --> Chart[Chart 180KB]
  Bundle --> Table[Table 95KB]
  Bundle --> Picker[Picker 62KB]
  Bundle --> API[API Client]
  API --> Server[Backend API]
\`\`\`

### 問題点
- 全コンポーネントがクライアントで実行
- データ取得もクライアント側
- 初期ロードで全JSを配信
- Hydration完了まで操作不能

## {section, bg="#0a0a0a"}

# 犯人はこいつ
全部クライアントで動かしていた

## Before: 肥大化したクライアント

### {6x2}
\`\`\`typescript
// pages/dashboard.tsx — Before
'use client'  // ← これが全てを巻き込む

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

### :package: Chart **180KB**
グラフ描画を全員に配信

### :table: Table **95KB**
データ表示もクライアント側

### :calendar: Picker **62KB**
日付選択すら重い

### :layout: Sidebar **45KB**
静的なのにJSに含まれる

## After: Server Componentで分離

### {6x2}
\`\`\`typescript
// app/dashboard/page.tsx — After
import { Chart } from '@/components/Chart'
import { DataTable } from '@/components/Table'
import { Sidebar } from '@/components/Sidebar'
import { DateFilter } from './DateFilter'

export default async function Dashboard() {
  const data = await db.metrics.findMany()
  return (
    <Layout>
      <Sidebar />        {/* Server Component */}
      <Chart data={data} /> {/* Server Component */}
      <DataTable data={data} />
      <DateFilter />      {/* 'use client' */}
    </Layout>
  )
}
\`\`\`

### Server側で実行
Chart, Table, Sidebarはサーバーで描画。HTMLだけ配信。

### Client最小化
\`use client\` は DateFilter のみ。インタラクティブな部分だけ。

## コンポーネント境界の設計

### Server/Client 境界 {hero}
\`\`\`mermaid
graph LR
  subgraph Server Components
    Page[Dashboard Page]
    Sidebar[Sidebar]
    Chart[Chart SVG]
    Table[Data Table]
  end
  subgraph Client Components
    Filter[Date Filter]
    Toggle[Theme Toggle]
    Toast[Toast Notifications]
  end
  Page --> Sidebar
  Page --> Chart
  Page --> Table
  Page --> Filter
\`\`\`

### 境界のルール
- Server: データ取得・表示系
- Client: ユーザー操作が必要な部分のみ

## {section, bg="#0a0a0a"}

# 移行戦略
段階的に、壊さずに

## 3原則

### 末端から着手 {tall}
子を持たないコンポーネントから移行。依存関係の葉から剪定する。
\`\`\`
移行順序:
1. アイコン、ラベル → Server
2. カード、リスト → Server
3. フォーム、モーダル → Client維持
4. ページ全体 → Server (async)
\`\`\`

### Feature Flagで段階展開
10%→50%→100%の3段階で公開

### 型で境界を守る
Server/Clientの混在をTSで検出

## バンドル変化

### バンドルサイズ推移 {tall}
\`\`\`chart
type: column
colors: #e2e8f0
移行前: 2400
Phase1: 1800
Phase2: 1100
移行後: 780
\`\`\`

### :package: **−68%** 削減
2.4MB → 780KB

### :zap: LCP **1.1s**
6秒 → 1.1秒

## {section, bg="#0a0a0a"}

# Before / After
数字で振り返る

## ビフォーアフター

### :x: Before {tall}
- Lighthouse: **32**点
- バンドル: **2.4MB**
- LCP: **6.0s**
- 直帰率: **52%**
- \`use client\`: **全ページ**

### :check: After {tall}
- Lighthouse: **94**点
- バンドル: **780KB**
- LCP: **1.1s**
- 直帰率: **34%**
- \`use client\`: **12ファイル**

## 最終結果

### :gauge: Lighthouse **94**点
32点 → 94点（+62点）

### :rocket: LCP **1.1s**
初期表示が5倍速に改善

### :trending-down: 直帰率 **−35%**
ユーザー体験が数字に反映

### :package: バンドル **−68%**
2.4MB → 780KBに削減

## {section, bg="#0a0a0a"}

# 一番の学び
use client は伝播する

## 持ち帰ってほしいこと

### 1行で100KB増 {tall}
\`use client\` の配置が全てを決める。親に書くと全子孫がクライアントに巻き込まれる。
\`\`\`typescript
// ❌ ここに書くと全部Client
'use client'
export function Layout({ children }) {
  return <div>{children}</div>
}

// ✅ 必要な箇所だけに書く
'use client'
export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  return <button onClick={...} />
}
\`\`\`

### 境界は設計する
偶然の境界ではなく意図的に引く

### DXを犠牲にしない
RSCはPHP的、それは褒め言葉

## {cover, bg="#0a0a0a"}

# ありがとう！
@yourhandle
`,
}
