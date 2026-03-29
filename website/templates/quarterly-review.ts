import type { Template } from './index'

export const quarterlyReviewTemplate: Template = {
  id: 'quarterly-review',
  name: 'Quarterly Review',
  description: 'Business metrics, milestones, and team updates',
  category: 'business',
  thumbnail: {
    background: '#eef2ff',
    accent: '#0017cb',
    style: 'white',
  },
  content: `---
title: Quarterly Review
style: white
borderRadius: 40
palette:
  primary: "#0017cb"
  background: "#eef2ff"
defaults:
  pageNumber: true
---

## {cover, bg="#0017cb"}

# Q2 2026 振り返り
四半期レビュー

## ハイライト

### :trending-up: **+38%** 売上成長
エンタープライズ拡大とセルフサーブの両輪で達成

### :users: **12K** 新規ユーザー
PLG施策による過去最高の月間獲得数

### :zap: **99.99%** 稼働率
全リージョンで重大インシデントゼロ

## プロダクト成果

### :rocket: API v2 リリース
REST/GraphQL刷新、スループット3倍

### :shield: SOC 2 取得
Type II認証を前倒しで達成

### :globe: APAC展開
東京・シンガポール・シドニー稼働

### :code: SDK公開
Python, Node, Go, Rust 対応

### :bar-chart: 分析ダッシュボード
カスタムウィジェット+リアルタイム

### :heart: NPS **72**
前期比+8pt、過去最高を更新

## 次期の優先事項

### :rocket: インフラ増強
EMEA/LATAMリージョン倍増

### :lock: セキュリティ強化
IP制限・監査ログ・セッション制御

### :users: パイプライン拡大
エンタープライズ15社を目標

## {cover, bg="#0017cb"}

# ありがとうございました
質疑応答
`,
}
