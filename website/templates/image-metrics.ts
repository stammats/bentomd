import type { Template } from './index'

export const imageMetricsTemplate: Template = {
  id: 'image-metrics',
  name: 'Photo Metrics',
  description: 'Full-bleed photos with large overlay numbers',
  category: 'product',
  thumbnail: {
    background: '#0f172a',
    accent: '#f8fafc',
    style: 'solid',
  },
  content: `---
title: Annual Report
style: white
borderRadius: 24
palette:
  primary: "#0f172a"
  background: "#0f172a"
  text: "#f8fafc"
defaults:
  pageNumber: false
  header: false
  footer: false
---

---
layout: cover
background: "#0f172a"
color: "#f8fafc"
---

# 2026 Annual Report
## Year in Review

---

## 成長を支えた数字

### **2.4M** ユーザー
![Team collaboration](https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80)

### **98.7%** 継続率
![Customer satisfaction](https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80)

### **42** ヶ国展開
![Global office](https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80)

---

## プロダクトの進化

### **3x** 高速化 {hero}
![Server infrastructure](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80)

### **150+** API
![Code on screen](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80)

### **99.99%** 稼働率
![Data center](https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80)

---
layout: cover
background: "#0f172a"
color: "#f8fafc"
---

# Thank You
## 2027年もよろしくお願いします
`,
}
