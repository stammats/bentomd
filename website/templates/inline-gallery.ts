import type { Template } from './index'

export const inlineGalleryTemplate: Template = {
  id: 'inline-gallery',
  name: 'Card Gallery',
  description: 'Cards with inline images, numbers and text',
  category: 'product',
  thumbnail: {
    background: '#f5f5f7',
    accent: '#1d1d1f',
    style: 'white',
  },
  content: `---
title: Product Showcase
style: white
borderRadius: 24
palette:
  primary: "#1d1d1f"
  background: "#f5f5f7"
  surface: "#ffffff"
  text: "#1d1d1f"
  muted: "#86868b"
defaults:
  pageNumber: false
  header: false
  footer: false
---

---
layout: cover
background: "#1d1d1f"
color: "#f8fafc"
---

# Product Showcase
## Our Latest Lineup

---

## 注目のプロダクト

### **M4** チップ
次世代プロセッサで全てが高速に
![MacBook](https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80)

### **120Hz** ディスプレイ
ProMotionの滑らかさ
![Display](https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80)

### **空間オーディオ**
没入感のあるサウンド体験
![Headphones](https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80)

---

## 数字で見る実力

### **18h** バッテリー
一日中充電を気にしない
![Working outside](https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80)

### **5年** サポート
長く安心して使える
![Support](https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80)

### **180** ヶ国で販売
世界中で愛されるブランド
![Globe](https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80)

---
layout: cover
background: "#1d1d1f"
color: "#f8fafc"
---

# 詳しくはWebで
## example.com
`,
}
