import type { Template } from './index'

export const appleProductTemplate: Template = {
  id: 'apple-product',
  name: 'Apple Product',
  description: 'Apple.com inspired product launch with bento grid',
  category: 'product',
  thumbnail: {
    background: '#f5f5f7',
    accent: '#1d1d1f',
    style: 'white',
  },
  content: `---
title: Product Launch
style: white
borderRadius: 28
palette:
  background: "#f5f5f7"
  primary: "#1d1d1f"
  secondary: "#86868b"
  surface: "#ffffff"
  text: "#1d1d1f"
  muted: "#86868b"
fonts:
  heading: "SF Pro Display, system-ui, sans-serif"
  body: "SF Pro Text, system-ui, sans-serif"
defaults:
  pageNumber: false
  header: false
  footer: false
---

## {cover, bg="#000000"}

# MacBook Air
圧倒的パワーを、薄さの中に。

## Liquid Retina ディスプレイ

### {hero}
![MacBook Air Display](https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80)

### :cpu: **9.5** 倍速く処理
AIタスクを圧倒的スピードで

### :camera: **12MP** カメラ
センターフレーム対応

### :palette: 4色展開
あなたにぴったりの一台を

## パフォーマンス

### :zap: **18** 時間
バッテリー駆動

### :cpu: **M4** チップ
次世代プロセッサ

### :hard-drive: **32GB** メモリ
プロ級マルチタスク

### :gauge: **10** コアGPU
圧倒的グラフィックス

## Apple Intelligence

### {hero}
![Creative workspace](https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80)

### :sparkles: 文章作成・要約
デバイス上でプライベートに処理

### :mic: 進化した Siri
より自然な会話でサポート

### :wand-2: 画像生成
アイデアを瞬時にビジュアル化

## ラインナップ {bg="#000000"}

### iPhone 17 Pro {hero}
![iPhone](https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80)

### **¥164,800** から
MacBook Air

### **¥179,800** から
iPhone 17 Pro

## {cover, bg="#000000"}

# さあ、始めよう。
apple.com
`,
}
