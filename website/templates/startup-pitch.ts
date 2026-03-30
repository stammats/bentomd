import type { Template } from './index'

export const startupPitchTemplate: Template = {
  id: 'startup-pitch',
  name: 'Startup Pitch Deck',
  description: 'Investor pitch with metrics, problem/solution, and team',
  category: 'business',
  thumbnail: {
    background: '#0f172a',
    accent: '#38bdf8',
    style: 'mono',
  },
  content: `---
title: Pitch Deck
theme: ocean
style: mono
borderRadius: 24
palette:
  primary: "#38bdf8"
  background: "#0f172a"
  surface: "#1e293b"
  text: "#f8fafc"
  muted: "#94a3b8"
defaults:
  pageNumber: true
---

## {cover, bg="#0f172a"}

# YourApp
チームコラボを再定義する

## 課題

### :alert-triangle: **73%** が週5h浪費 {hero}
ツール分断で10+アプリを毎日切り替え

### :clock: **$12K** /人/年の損失
ツール分断の隠れたコスト

### :users: **500M** 人の市場
巨大な未開拓セグメント

## 解決策

### 統合プラットフォーム {hero}
チャット・ドキュメント・タスク・コードを一つに

### :zap: **3x** 高速化
統合ワークフローで開発速度3倍

### コンテキスト維持
すべてが繋がり、切り替え不要

## トラクション

### :trending-up: **$2.4M** ARR
MoM 25% 成長

### :users: **15K** チーム
スタートアップから Fortune 500 まで

### :heart: NPS **72**
業界トップクラスの満足度

### :repeat: **95%** 継続率
年間コホート全セグメント

## チーム

### CEO — Jane Smith
![Jane Smith](https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400)
Ex-Stripe。開発ツール領域10年。前回Exit $50M。

### CTO — Alex Chen
![Alex Chen](https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400)
Ex-Google Chrome DevTools。15年のプラットフォーム開発。

### COO — Maria Lopez
![Maria Lopez](https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400)
Ex-Notion。10→500名のスケーリング経験。

## {cover, bg="#0f172a"}

# Series A $10M 調達中
一緒に未来をつくりましょう
`,
}
