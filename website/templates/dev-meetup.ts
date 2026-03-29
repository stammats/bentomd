import type { Template } from './index'

export const devMeetupTemplate: Template = {
  id: 'dev-meetup',
  name: 'Dev Meetup LT',
  description: 'Lightning talk with narrative flow for tech meetups',
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

### :gauge: Lighthouse **32** 点
パフォーマンススコアが赤信号

### :package: **2.4MB** の壁
クライアントJSが肥大化

### :clock: 初期表示 **6秒**
3G回線のユーザーが離脱

## {section, bg="#0a0a0a"}

# 原因はシンプルだった
全部クライアントで動かしていた

## 犯人はこいつ

### {6x2}
\`\`\`typescript
// pages/dashboard.tsx
import { Chart } from '@/components/Chart'
import { DataTable } from '@/components/Table'
import { DatePicker } from '@/components/Picker'

export default function Dashboard() {
  const { data } = useSWR('/api/metrics')
  return <Chart data={data} />
}
\`\`\`

### :package: Chart **180KB**
グラフ描画を全員に配信

### :table: Table **95KB**
データ表示もクライアント側

### :calendar: Picker **62KB**
日付選択すら重い

## {section, bg="#0a0a0a"}

# 3ヶ月かけて移行した
段階的に、壊さずに

## 移行の3原則

### :leaf: 末端から
子を持たないコンポーネントから着手

### :flag: 10%ずつ公開
Feature Flagで段階的に適用

### :shield: 型で守る
Server/Clientの境界をTSで明示

## 結果

### :zap: **780KB** に削減
バンドルサイズ −68%

### :rocket: LCP **1.1s**
初期表示が5倍速に改善

### :gauge: Lighthouse **94** 点
32点 → 94点の劇的改善

### :trending-up: 直帰率 **−35%**
ユーザー体験が数字に反映

## {section, bg="#0a0a0a"}

# 一番の学び
use client は伝播する

## 持ち帰ってほしいこと

### :alert-triangle: 1行で100KB増
use client の配置が全てを決める

### :git-branch: 境界は設計する
偶然の境界ではなく意図的に引く

### :heart: DXを犠牲にしない
RSCはPHP的、それは褒め言葉

## {cover, bg="#0a0a0a"}

# ありがとう！
@yourhandle
`,
}
