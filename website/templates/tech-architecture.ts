import type { Template } from './index'

export const techArchitectureTemplate: Template = {
  id: 'tech-architecture',
  name: 'Tech Architecture',
  description: 'System design with diagrams, code, and specs',
  category: 'tech',
  thumbnail: {
    background: '#0f172a',
    accent: '#22d3ee',
    style: 'mono',
  },
  content: `---
title: System Architecture
theme: ocean
style: mono
borderRadius: 16
fonts:
  mono: "JetBrains Mono, monospace"
palette:
  primary: "#22d3ee"
  secondary: "#818cf8"
  background: "#0f172a"
  surface: "#1e293b"
  text: "#f8fafc"
defaults:
  pageNumber: true
---

## {cover, bg="#0f172a"}

# システムアーキテクチャ
プラットフォーム設計概要

## 全体構成

### {hero}
\`\`\`mermaid
graph TB
    Client[Web] --> API[API Gateway]
    Mobile[Mobile] --> API
    API --> Auth[Auth]
    API --> Core[Core]
    Core --> DB[(PostgreSQL)]
    Core --> Cache[(Redis)]
    Core --> Queue[MQ]
    Queue --> Worker[Worker]
\`\`\`

### マイクロサービス
イベント駆動の非同期アーキテクチャ

### PostgreSQL + Redis
ACID + キャッシュの二層構成

### Kubernetes
マルチリージョン自動スケーリング

## API設計

### {6x2}
\`\`\`typescript
interface CreateUserReq {
  email: string
  name: string
  role: 'admin' | 'member' | 'viewer'
}

app.post('/users',
  validate(Schema),
  async (req, res) => {
    const user = await svc.create(req.body)
    res.status(201).json(user)
  }
)
\`\`\`

### :zap: **<10ms** p99レイテンシ
Edgeキャッシュ+コネクションプール

### OAuth 2.0 + RBAC
ロールベースのアクセス制御

### :activity: **99.99%** SLA
Active-Active マルチリージョン

## 技術スタック

### TypeScript
API からDBクエリまでフルスタック型安全

### PostgreSQL
ACID + jsonb で柔軟なスキーマ

### Node.js
高スループット非同期I/O

### Docker + K8s
Helm チャートで統一デプロイ

### CI/CD
GitHub Actions + PR プレビュー環境

### 可観測性
OpenTelemetry + Grafana + PagerDuty

## {cover, bg="#0f172a"}

# Q&A
github.com/yourorg
`,
}
