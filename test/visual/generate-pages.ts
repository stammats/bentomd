/**
 * Generate standalone HTML pages for each layout for visual testing.
 * Usage: npx tsx test/visual/generate-pages.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse } from '../../src/parser/index.js';
import { renderSlide } from '../../src/layouts/index.js';
import { renderDeck } from '../../src/renderer/index.js';
import type { RenderContext } from '../../src/types/index.js';

const OUT_DIR = join(import.meta.dirname, 'pages');
mkdirSync(OUT_DIR, { recursive: true });

const LAYOUTS: Record<string, string> = {
  cover: `---
title: "Product Strategy 2026"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
  secondary: "#7c3aed"
  background: "#ffffff"
  surface: "#f8fafc"
  text: "#0f172a"
  muted: "#64748b"
---

---
layout: cover
background: "#1e293b"
---

# Product Strategy 2026
## Accelerating Growth Through Innovation

Sarah Chen · VP Product · March 2026`,

  end: `---
title: "Thank You"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
  background: "#0f172a"
  text: "#f8fafc"
---

---
layout: end
background: "#0f172a"
---

# Thank You

## Questions? Let's talk.

Sarah Chen | sarah@company.com | @sarahchen

Company, Inc. | company.com`,

  section: `---
title: "Section Break"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
---

---
layout: section
background: "#1e293b"
---

# Technical Deep Dive
## Architecture, scalability, and security`,

  default: `---
title: "Platform Overview"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
---

---
layout: default
heading: "Platform Architecture"
summary: "How our system handles 50M requests per day"
footer: true
pageNumber: true
---

Our platform is built on three core principles that enable reliable, high-throughput data processing at scale.

- **Event-driven ingestion** — Messages are consumed from Kafka topics, validated against schemas, and routed to appropriate processing pipelines
- **Stateless compute layer** — Workers scale horizontally with no shared state; all coordination happens through the message bus
- **Multi-region storage** — Data is replicated across three regions with eventual consistency and conflict-free merge semantics
- **Observability first** — Every request is traced end-to-end with structured logs, metrics, and distributed tracing via OpenTelemetry`,

  'two-column': `---
title: "Migration Plan"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
---

---
layout: two-column
heading: "Before & After"
summary: "Migrating from monolith to microservices"
footer: true
pageNumber: true
---

## Current State

- Single Rails monolith (280k LOC)
- Vertical scaling only
- 45-minute deploy cycles
- Shared PostgreSQL database
- Tightly coupled modules

## Target Architecture

- 12 domain-bounded services
- Horizontal auto-scaling per service
- Independent 3-minute deploys
- Service-owned data stores
- Event-driven communication via Kafka`,

  features: `---
title: "Features Demo"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
---

---
layout: features
heading: "Why Choose Our Platform"
summary: "Three pillars of enterprise-grade infrastructure"
columns: 3
style: card
footer: true
pageNumber: true
---

### :zap: Lightning Fast
Sub-millisecond response times with our globally distributed edge network spanning 42 regions.

### :shield: Enterprise Security
SOC 2 Type II certified with end-to-end encryption, SSO support, and role-based access control.

### :bar-chart: Deep Analytics
Real-time dashboards with custom metrics, anomaly detection, and automated reporting.`,

  stats: `---
title: "Q4 Results"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
---

---
layout: stats
heading: "Q4 2025 Performance"
summary: "Record-breaking quarter across all key metrics"
footer: true
pageNumber: true
---

### :trending-up: $4.2M
Annual Recurring Revenue
+38% YoY

### :users: 12,400
Active Customers
+22% QoQ

### :activity: 99.98%
Platform Uptime

### :heart: 47
Net Promoter Score
+12 pts`,

  chart: `---
title: "Revenue Growth"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
---

---
layout: chart
heading: "Monthly Recurring Revenue"
summary: "Consistent growth trajectory over the past 6 months"
type: bar
showValues: true
showLegend: false
footer: true
pageNumber: true
---

### Jul: 280
### Aug: 310
### Sep: 345
### Oct: 390
### Nov: 420
### Dec: 485`,

  table: `---
title: "Competitive Analysis"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
---

---
layout: table
heading: "Competitive Landscape"
summary: "Feature comparison across key market players"
footer: true
pageNumber: true
---

| Feature | Us | Competitor A | Competitor B | Competitor C |
|---|---|---|---|---|
| Real-time sync | Yes | Yes | No | Partial |
| Self-hosted option | Yes | No | Yes | No |
| SSO / SAML | Yes | Enterprise only | Yes | No |
| API rate limit | Unlimited | 10k/min | 5k/min | 1k/min |
| Avg. latency | 12ms | 45ms | 89ms | 120ms |
| Free tier | Yes | No | Yes | Yes |
| 24/7 support | All plans | Enterprise only | Business+ | No |`,

  quote: `---
title: "Customer Testimonial"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
---

---
layout: quote
heading: "What Our Customers Say"
footer: true
pageNumber: true
---

> Switching to this platform cut our infrastructure costs by 40% while improving reliability. The migration took two weeks instead of the six months we had budgeted. It completely changed how our engineering team thinks about deployment.

— **Maria Rodriguez**, CTO at Streamline Health`,

  timeline: `---
title: "Product Roadmap"
aspectRatio: "16:9"
palette:
  primary: "#dc2626"
  secondary: "#f97316"
---

---
layout: timeline
heading: "Product Launch Roadmap"
summary: "Key milestones from beta to general availability"
footer: true
pageNumber: true
---

### Jan 2026 — Private Beta
Invite-only access for 50 design partners with weekly feedback sessions

### Mar 2026 — Public Beta {active}
Open registration with usage-based pricing. Launch on Product Hunt.

### May 2026 — General Availability
Full feature set with SLA guarantees, SOC 2 compliance, and enterprise tier

### Aug 2026 — Platform Expansion
Mobile SDK, Salesforce integration, and self-hosted deployment option`,

  comparison: `---
title: "Pricing"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
---

---
layout: comparison
heading: "Choose Your Plan"
summary: "All plans include core features. Upgrade for advanced capabilities."
footer: true
pageNumber: true
---

### Starter — $29/mo
- 5 team members
- 10 projects
- Community support
- Basic analytics

### Pro — $99/mo {highlight}
- 25 team members
- Unlimited projects
- Priority support
- Advanced analytics
- Custom integrations

### Enterprise — Custom
- Unlimited members
- Unlimited projects
- Dedicated support
- Full analytics suite
- SSO & audit logs
- SLA guarantee`,

  image: `---
title: "Product Screenshot"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
---

---
layout: image
heading: "Dashboard Overview"
summary: "Real-time monitoring across all services"
src: "https://placehold.co/1600x900/f1f5f9/64748b?text=Dashboard+Screenshot"
fit: contain
caption: "The unified dashboard provides a single pane of glass for all operational metrics"
footer: true
pageNumber: true
---`,

  'mermaid-flowchart': `---
title: "System Architecture"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
---

---
layout: default
heading: "Request Processing Pipeline"
summary: "How a single API request flows through our system"
footer: true
pageNumber: true
---

\`\`\`mermaid
graph LR
    A[Client] --> B[API Gateway]
    B --> C{Auth}
    C -->|Valid| D[Load Balancer]
    C -->|Invalid| E[401 Error]
    D --> F[Service A]
    D --> G[Service B]
    F --> H[(Database)]
    G --> H
    H --> I[Cache]
    I --> A
\`\`\``,

  'mermaid-sequence': `---
title: "Authentication Flow"
aspectRatio: "16:9"
palette:
  primary: "#059669"
  secondary: "#10b981"
---

---
layout: default
heading: "OAuth 2.0 Authentication Flow"
summary: "Secure token-based authentication with refresh flow"
footer: true
pageNumber: true
---

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant A as App
    participant S as Auth Server
    participant R as Resource API

    U->>A: Click Login
    A->>S: Authorization Request
    S->>U: Login Page
    U->>S: Credentials
    S->>A: Authorization Code
    A->>S: Exchange Code + Secret
    S->>A: Access Token + Refresh Token
    A->>R: API Request + Token
    R->>A: Protected Data
    A->>U: Show Dashboard
\`\`\``,

  'mermaid-two-col': `---
title: "Architecture Overview"
aspectRatio: "16:9"
palette:
  primary: "#6366f1"
---

---
layout: two-column
heading: "Microservices Architecture"
summary: "Event-driven communication between bounded contexts"
footer: true
pageNumber: true
---

## System Design

\`\`\`mermaid
graph TD
    A[API Gateway] --> B[User Service]
    A --> C[Order Service]
    A --> D[Payment Service]
    B --> E[Event Bus]
    C --> E
    D --> E
    E --> F[Notification Service]
    E --> G[Analytics Service]
\`\`\`

## Key Benefits

- **Loose coupling** — Services communicate via events, not direct calls
- **Independent deployment** — Each service has its own CI/CD pipeline
- **Fault isolation** — One service failing doesn't cascade to others
- **Technology freedom** — Each team picks the best tool for the job`,

  'image-left': `---
title: "Product Feature"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
---

---
layout: image-left
heading: "Real-time Collaboration"
summary: "Work together seamlessly across time zones"
src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&h=600&fit=crop"
footer: true
pageNumber: true
---

Our collaboration engine powers **real-time editing** for teams of any size.

- **Live cursors** — See where your teammates are working in real time
- **Inline comments** — Leave feedback directly on any element
- **Version history** — Roll back to any previous state with one click
- **Presence indicators** — Know who's online and what they're viewing`,

  'image-right': `---
title: "Architecture"
aspectRatio: "16:9"
palette:
  primary: "#059669"
---

---
layout: image-right
heading: "Built for Scale"
summary: "Architecture that grows with your business"
src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&h=600&fit=crop"
footer: true
pageNumber: true
---

Our infrastructure handles **50M+ requests per day** across 42 global regions.

- **Auto-scaling** — Instantly adapt to traffic spikes with zero configuration
- **Multi-region** — Data replicated across 3 continents for low-latency access
- **99.99% SLA** — Enterprise-grade reliability backed by financial guarantees
- **Edge caching** — Static assets served from the nearest PoP in under 10ms`,

  'bento-tall': `---
title: "Platform Overview"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
  background: "#f5f5f5"
  surface: "#ffffff"
---

---
layout: bento
scheme: ocean
---

### :shield: Security & Compliance {tall}
SOC 2 Type II, GDPR, HIPAA. End-to-end encryption with zero-trust architecture. Regular third-party audits.

### :zap: Lightning Fast
Sub-10ms P99 latency across all API endpoints.

### :globe: Global Edge Network
42 regions worldwide with automatic failover.

### 99.99%
Uptime SLA

### 150ms
Global P95 Latency

### :code: Developer First {lg}
Beautiful APIs, comprehensive SDKs, and interactive documentation. Ship in hours, not weeks.`,

  'bento-dashboard': `---
title: "Q4 Dashboard"
aspectRatio: "16:9"
palette:
  primary: "#6366f1"
  background: "#f5f5f5"
  surface: "#ffffff"
---

---
layout: bento
scheme: pastel
---

### $12.4M {md center}
Annual Recurring Revenue

### 340% {sm center}
YoY Growth

### 98.7 {sm center}
NPS Score

### :users: 2,400+ Enterprise Customers {wide}
Trusted by Fortune 500 companies across 45 countries. Average contract value of $52K with 142% net dollar retention.`,

  'bento-product': `---
title: "Product Features"
aspectRatio: "16:9"
palette:
  primary: "#dc2626"
  background: "#fafaf9"
  surface: "#ffffff"
---

---
layout: bento
scheme: warm
---

### :sparkles: AI-Powered Editor {hero}
Write faster with intelligent autocomplete, smart formatting, and context-aware suggestions. Our models understand your content and style.

### :image: Rich Media
Drag-and-drop images, videos, and embeds.

### :palette: Custom Themes
Brand your workspace with custom colors and fonts.

### :share-2: Real-time Collaboration {md}
Multiple cursors, presence indicators, and inline comments. Work together seamlessly across time zones.

### :lock: Enterprise Security {sm}
SSO, audit logs, and data residency options.

### :zap: Instant Publish {sm}
One-click deploy to your custom domain.`,

  'bento-photo': `---
title: "Travel Guide"
aspectRatio: "16:9"
palette:
  primary: "#0f766e"
  background: "#f5f5f4"
  surface: "#ffffff"
---

---
layout: bento
scheme: pastel
---

### Kyoto, Japan {hero}
Ancient temples, serene gardens, and the magic of cherry blossom season. A city where tradition meets modernity.
![](https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&h=800&fit=crop)

### Tokyo {tall}
Neon-lit streets and endless energy.
![](https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=800&fit=crop)

### :utensils: Food & Culture
Michelin-starred ramen to street-side yakitori. Japan has more Michelin stars than any other country.

### :map: Getting Around
JR Pass covers bullet trains, local rails, and buses nationwide. Efficient, punctual, spotless.

### Osaka {md}
Street food capital of Japan. Don't miss Dotonbori at night.
![](https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&h=400&fit=crop)`,

  'bento-portfolio': `---
title: "Design Portfolio"
aspectRatio: "16:9"
palette:
  primary: "#1e1b4b"
  background: "#fafaf9"
  surface: "#ffffff"
---

---
layout: bento
scheme: mono
---

### Brand Identity {hero}
Complete visual identity system for a sustainable fashion brand. Logo, typography, color palette, and packaging.
![](https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=800&fit=crop)

### Mobile App {tall}
![](https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=800&fit=crop)

### :award: 12 Awards
Red Dot, iF Design, Webby, and more.

### :briefcase: 8 Years
Professional design experience across startups and Fortune 500.

### Web Design {lg}
Responsive e-commerce platform with 40% conversion rate improvement.
![](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=400&fit=crop)`,

  'cover-photo': `---
title: "Annual Report"
aspectRatio: "16:9"
palette:
  primary: "#2563eb"
  background: "#0f172a"
  text: "#f8fafc"
---

---
layout: cover
background: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop"
overlay: 0.55
---

# The Future of Connected Cities

## Annual Innovation Report 2026

Urban Infrastructure Lab | March 2026`,

  'image-unsplash': `---
title: "Product Launch"
aspectRatio: "16:9"
palette:
  primary: "#059669"
---

---
layout: image
heading: "Introducing AuraX Pro"
summary: "The next generation of wireless audio — crafted for perfection"
src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&h=900&fit=crop"
fit: cover
caption: "AuraX Pro — Studio-quality sound in a design that disappears on your head"
footer: true
pageNumber: true
---`,

  'bento-inline-img': `---
title: "Product Showcase"
aspectRatio: "16:9"
palette:
  primary: "#6366f1"
  background: "#f5f5f5"
  surface: "#ffffff"
---

---
layout: bento
scheme: pastel
---

### :camera: Smart Camera {hero}
AI-powered 4K camera with real-time object tracking, night vision, and cloud storage. Setup in under 2 minutes.
![](https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=400&fit=crop)

### 4K Resolution
Ultra HD

### 180 Days
Battery Life

### :wifi: Always Connected {md}
Dual-band WiFi 6 with automatic failover to LTE backup. Never miss a moment.
![](https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=300&fit=crop)

### :shield: Privacy First {sm}
End-to-end encryption. All processing happens on-device. Your data never leaves your home.`,

  'bento-mixed': `---
title: "Product Features"
aspectRatio: "16:9"
palette:
  primary: "#059669"
  background: "#fafaf9"
  surface: "#ffffff"
---

---
layout: bento
scheme: pastel
---

### :credit-card: Maximize Card Rewards {md}
Maximize rewards on every purchase. Identify top cards for each spend.

### :wallet: Manage Cards {sm}
Manage multiple cards, track benefits, and set payment reminders.

### :target: Set Goals {sm}
Set trip goals or target annual fee waivers.

### :map-pin: Lounges {sm}
Track and find eligible airport and railway lounge access.

### :bar-chart: Credit Card Strategy {lg}
Personalized credit card plan that fits your lifestyle.

### :search: Find, Compare & Apply {sm}
Discover ideal cards. Compare features and apply in minutes.`,

  bento: `---
title: "Bento Grid"
aspectRatio: "16:9"
palette:
  primary: "#6366f1"
  background: "#f5f5f5"
  surface: "#ffffff"
---

---
layout: bento
scheme: pastel
---

### :layers: Modular Architecture {hero}
Compose your system from independent, tested modules. Each module owns its data, API, and lifecycle.

### 50K+ {sm center}
Active Developers

### 4.9 {sm center}
npm Rating

### :git-branch: Version Control
Built-in schema versioning and migration support

### :terminal: CLI First
Powerful command-line tools for every workflow

### :lock: Enterprise Security
SOC 2, GDPR, and HIPAA compliant out of the box`,
};

function renderLayout(name: string, code: string): string {
  const deck = parse(code);
  const ctx: RenderContext = {
    slideIndex: 0,
    totalSlides: deck.slides.length,
    budget: {
      canvasWidth: 1920, canvasHeight: 1080,
      contentWidth: 1760, contentHeight: 840,
      bodyHeight: 608, chromeHeight: 232,
    },
  };
  const slideHtmls = deck.slides.map((slide, i) =>
    renderSlide(slide, deck.config, { ...ctx, slideIndex: i })
  );
  return renderDeck(slideHtmls, deck.config);
}

for (const [name, code] of Object.entries(LAYOUTS)) {
  const html = renderLayout(name, code);
  const outPath = join(OUT_DIR, `${name}.html`);
  writeFileSync(outPath, html, 'utf-8');
  console.log(`  Generated: ${outPath}`);
}

console.log(`\n  ${Object.keys(LAYOUTS).length} pages generated in ${OUT_DIR}`);
