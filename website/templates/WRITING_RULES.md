# bentomd Template Writing Rules

LLM-executable rules for creating well-formatted bentomd slide content.
Character counts: **JP = full-width Japanese**, **EN = half-width English**.
Mixed text (e.g. `Server Components`) counts as EN characters.

---

## 1. Cover Slide (`layout: cover`)

| Element | Max | Good | Bad |
|---------|-----|------|-----|
| `# title` | 10 JP / 20 EN | `# MacBook Air` | `# 新しいMacBook Airの紹介` |
| `## subtitle` | 20 JP / 35 EN | `## 圧倒的パワーを、薄さの中に。` | `## 薄いボディに圧倒的なパワーを詰め込んだ新世代のMacBook` |

**Rule:** タイトルは固有名詞 or 一語コンセプト。サブタイトルは体言止めか短文。

---

## 2. Slide Heading (`##`)

| Element | Max | Notes |
|---------|-----|-------|
| `## heading` | 15 JP / 25 EN | 名詞句。句点なし |

**Rule:** スライド見出しは「何のスライドか」を一目で伝える。動詞不要。

---

## 3. Bento Cell Title (`### title`)

| Cell size | Max title | Example |
|-----------|-----------|---------|
| `{sm}` 4col | 10 JP / 16 EN | `API v2 リリース` |
| `{md}` 6col / default | 14 JP / 22 EN | `文章作成・要約` |
| `{lg}` 8col | 20 JP / 32 EN | — |
| `{hero}` 8col×2 | 20 JP / 32 EN | — |

**Rule:** タイトルは体言止め。句点なし。1行に収まること。
**Important:** `{hero}`, `{6x2}` 等のサイズ指定は必ず **行末** に書く。行頭は不可。

```markdown
### :cpu: M4チップ搭載 {hero}     ← 正しい
### {hero} :cpu: M4チップ搭載     ← NG: {hero}がテキストに出る
### {hero}                         ← OK: タイトルなし画像専用セル
```

---

## 4. Value + Label (`**value** label`)

| Part | Max | Example |
|------|-----|---------|
| `**value**` | 5 chars | `**18**`, `**$2.4M**`, `**+38%**` |
| label (same line) | 6 JP / 10 EN | `時間`, `ARR`, `成長率` |

**Rule:** Value は数値（単位OK）。96px で描画される。ラベルは value の直後 or description行。

**Correct patterns:**
```markdown
### **18** 時間
バッテリー駆動

### :trending-up: **+38%** 売上成長
エンタープライズ拡大とセルフサーブで達成
```

**Wrong patterns:**
```markdown
### **バッテリー駆動時間は18時間です**
← 全体が96pxで描画されて崩壊

### **+38%の売上成長を達成**
← value部分が長すぎ
```

---

## 5. Cell Description (title下の行)

| Cell size | Max | Max lines |
|-----------|-----|-----------|
| `{sm}` 4col×1row | 25 JP / 40 EN | 1 |
| `{md}` 6col×1row / default | 35 JP / 55 EN | 2 |
| `{hero}` 8col×2row | 50 JP / 80 EN | 3 |

**Rule:** タイトルの補足。タイトルと同じ内容を繰り返さない。34px 0.7 opacity で描画。

---

## 6. Cell Count Per Slide

| Max | Sweet spot | Notes |
|-----|-----------|-------|
| 6 | 3–4 | 超えるとセルが小さくなり文字溢れ |

---

## 7. Pattern Consistency (並列性)

1スライド内の全セルは **同じパターン** に揃える:

| Pattern | Structure | Use when |
|---------|-----------|----------|
| **metric** | `**value** label` + desc | 数値を並べたい |
| **feature** | `:icon: title` + desc | 機能を紹介したい |
| **image-hero** | `{hero}` + image + 小セル | ビジュアルを見せたい |
| **code-explain** | `{6x2}` code + 小セル | コードを解説したい |

**例外:** `{hero}` セルは metric + feature の混合OK（icon + value + descの複合構成）
**Anti-pattern:** 通常サイズ（sm/md）セル同士で metric と feature が混在

---

## 8. Image Cells

| Rule | Detail |
|------|--------|
| サイズ | `{hero}` or `{lg}` 必須 |
| icon禁止 | image cell にはアイコン不要 |
| overlay title | 10 JP / 16 EN 以内 |
| URL | Unsplash: `?w=1200&q=80` (hero), `?w=800&q=80` (sm) |

---

## 9. Code Blocks

| Rule | Detail |
|------|--------|
| セルサイズ | `{6x2}` 以上必須 |
| 行数 | 最大 **15行** (コメント含む) |
| 行幅 | 最大 **55文字** |
| 言語タグ | 必ず付ける (typescript, python, etc.) |

---

## 10. General Principles

1. **Title ≠ Description** — タイトルは What、Description は Why/How
2. **1セル1概念** — 「and」が入ったら2セルに分割
3. **数字 > 言葉** — `**42%** 成長` not `成長率は42パーセント`
4. **句点なし** — タイトルもdescriptionもラベル。句点`。`を付けない。読点`、`はOK
5. **体言止め** (JP) — `次世代プロセッサ` not `次世代のプロセッサです`
6. **並列構造** — 同一スライドのセルは同じ文体・長さに揃える
7. **空白のリズム** — 3〜4セルの軽いスライドと、hero画像の重いスライドを交互に
