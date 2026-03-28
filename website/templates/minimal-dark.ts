import type { Template } from './index'

export const minimalDarkTemplate: Template = {
  id: 'minimal-dark',
  name: 'Minimal Dark',
  description: 'Clean monochrome design with outline style',
  category: 'minimal',
  thumbnail: {
    background: '#111111',
    accent: '#ffffff',
    style: 'outline',
  },
  content: `---
title: Presentation
theme: mono
style: outline
borderRadius: 12
palette:
  primary: "#ffffff"
  secondary: "#a0a0a0"
  background: "#111111"
  surface: "#1a1a1a"
  text: "#ffffff"
  muted: "#666666"
defaults:
  pageNumber: true
---

---
layout: cover
background: "#111111"
color: "#ffffff"
---

# Your Title
## Subtitle goes here

---

## Key Points

### :target: フォーカス
余計なものを削ぎ落とす

### :compass: 導線設計
明確な階層構造で誘導

### :gem: クオリティ
すべての要素に存在理由を

---

## 実績

### **42%** 成長率
前年比での改善

### **1.2M** ユーザー
月間アクティブ数

### **<50ms** 応答速度
API中央値レイテンシ

### **99.9%** 稼働率
サービス信頼性

---
layout: cover
background: "#111111"
color: "#ffffff"
---

# Thank You
`,
}
