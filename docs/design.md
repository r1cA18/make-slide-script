React+TSで最初から作るのが正解。最終的に「スライド一覧・編集・時間配分・リハーサル」まで行くので、Vanillaで始めると結局作り直しになりがち。公式もReact例と “web/ と server/ 分離＋バンドルしてHTMLテンプレにインライン” を前提に書いてる。 ([OpenAI Developers][1])

以下、そのまま実装に落とせる **完全版設計＋完成までの手順**。

---

## 0) ゴール（MVP-0 → 完成形）

### MVP-0（まず動く）

* チャット添付の **PDF/PPTX** を `ingest_deck` で受け取る（file params）
* `generate_script` でスライド別台本＋秒数を生成
* ウィジェットで **一覧＋編集**（1スライドの台本編集、秒数変更）
* `export_script` でMarkdown出力

### MVP-1（プロダクト感）

* `rebalance_timing`（ロック対応で尺に収める）
* つなぎ（transition）強化
* リハーサル（テレプロンプタ表示＋タイマー）

---

## 1) リポジトリ構成（公式推奨の分離）

```
slidescript/
  server/
    package.json
    tsconfig.json
    src/index.ts
    src/tools/
      ingest.ts
      generate.ts
      update.ts
      export.ts
    src/store.ts
  web/
    package.json
    tsconfig.json
    src/main.tsx
    src/App.tsx
    src/openai-hooks.ts
    dist/component.js
    dist/component.css (任意)
  package.json  (ルートで並列実行してもOK)
```

この「webをビルド→serverが `text/html+skybridge` テンプレにインラインして配信」が公式の基本形。 ([OpenAI Developers][1])

---

## 2) 重要な前提（Apps SDKの制約）

* ウィジェットの `uploadFile` は **画像のみ**（png/jpeg/webp）。 ([OpenAI Developers][2])
* **PDF/PPTXはチャット添付 → ツールの file params で受け取る**のが基本。ツール側で `_meta["openai/fileParams"]` を宣言すると `{ download_url, file_id }` 形で届く。 ([OpenAI Developers][2])
* ウィジェットからツールを叩くには `_meta["openai/widgetAccessible"]=true`（必要なら `visibility:"private"` でモデルから隠す）。 ([OpenAI Developers][2])
* UI状態は `window.openai.setWidgetState`、業務データ（台本本体）はサーバで管理が公式推奨。 ([OpenAI Developers][3])

---

## 3) データ設計（structuredContent：モデルにも見えるので小さく）

`structuredContent` は **UIとモデルの共通言語**。余計なログや長文は入れない（モデルがそのまま読む）。 ([OpenAI Developers][1])

### structuredContent（MVP-0）

```ts
type Project = {
  projectId: string;
  title: string;
  source?: { fileId: string; fileName?: string; mimeType?: string };
  settings: {
    totalSeconds: number;         // 例: 420
    qaBufferSeconds: number;      // 例: 30
    audience: "internal" | "customer" | "meetup" | "conference";
    tone: "casual" | "polite" | "sales" | "academic";
    style: { brevity: number; energy: number; pace: number }; // -2..+2
    language: "ja" | "en";
  };
  stats: { slideCount: number; allocatedSeconds: number; overBySeconds: number };
};

type Slide = {
  slideId: string;
  index: number;
  titleGuess: string;
  raw: { text: string }; // MVPではテキストだけでOK
  timing: { seconds: number; locked: boolean; minSeconds: number; maxSeconds: number };
  script: {
    goal: string;            // 1行
    talkTrack: string;       // 台本（口語）
    keyPoints: string[];     // 箇条書き
    transitionIn?: string;
    transitionOut?: string;
  };
  flags: ("too_long" | "too_short" | "dense" | "needs_context")[];
};
```

---

## 4) ツール設計（MVP-0必須）

ツールは5つで十分。**編集系は widgetAccessible + private** にして、モデルが勝手に呼ばないようにするのが安定。 ([OpenAI Developers][2])

### 4.1 ingest_deck（file params）

* 入力：`projectId, deck_file`
* `_meta["openai/fileParams"] = ["deck_file"]`
* 出力：`project + slides(raw.text)`

file param の形は `{ download_url, file_id }`。 ([OpenAI Developers][2])

### 4.2 generate_script（生成）

* 入力：`projectId, settings`
* 出力：`slides.script + timing + stats`

### 4.3 update_slide（編集）

* 入力：`projectId, slideId, patch`
* `_meta["openai/widgetAccessible"]=true`, `visibility:"private"`

### 4.4 rebalance_timing（尺合わせ）

* 入力：`projectId, totalSeconds`
* `_meta["openai/widgetAccessible"]=true`, `visibility:"private"`

### 4.5 export_script（出力）

* 入力：`projectId, format`
* `_meta["openai/widgetAccessible"]=true`, `visibility:"private"`

---

## 5) UI設計（Reactコンポーネント）

公式の `window.openai` ブリッジ前提で作る。 ([OpenAI Developers][1])

### 5.1 画面レイアウト

* 上：ステータス（未解析/解析済み）＋主要ボタン（解析→生成 / 再生成 / エクスポート）
* 左：スライド一覧（index/titleGuess/秒数/フラグ）
* 右：スライド編集（goal/talkTrack/keyPoints/秒数/locked）

### 5.2 widgetState（UIだけ）

* `selectedSlideId`
* `settingsDraft`（フォームの下書き）
* `sort/filter`
  ※業務データ（台本）はサーバの structuredContent を正とする。 ([OpenAI Developers][3])

---

## 6) 実装手順（完成までのチェックリスト）

### Step 1) web/ を作る（React+TS＋バンドル）

公式どおり esbuild で `dist/component.js` を出す。 ([OpenAI Developers][1])

**web/package.json（例）**

```json
{
  "scripts": {
    "build": "esbuild src/main.tsx --bundle --format=esm --outfile=dist/component.js",
    "build:watch": "esbuild src/main.tsx --bundle --format=esm --outfile=dist/component.js --watch"
  },
  "dependencies": { "react": "^18", "react-dom": "^18" },
  "devDependencies": { "esbuild": "^0.25.0", "typescript": "^5.6.0" }
}
```

**web/src/main.tsx** で `window.openai.toolOutput` を読む（最初は表示だけでOK）。 ([OpenAI Developers][1])

### Step 2) server/ を作る（MCP + UIテンプレ）

* `registerResource` で `text/html+skybridge` のHTMLテンプレを返す
* テンプレに `dist/component.js` をインライン（script module）
  この流れが公式の中心。 ([OpenAI Developers][4])

### Step 3) server にツールを登録（まずはダミーで往復）

* `create_project`（なくても良いがあると楽）
* `generate_script` を「固定データで返す」→ UIに表示
  ここで **UI↔toolOutput 同期**が成立したら勝ち。 ([OpenAI Developers][5])

### Step 4) ingest_deck を実装（PDF/PPTXを受け取る）

* ツール定義に `_meta["openai/fileParams"]=["deck_file"]` を入れる ([OpenAI Developers][2])
* 受け取った `download_url` をサーバで取得し、PDF/PPTX解析へ

  * 最初は「ページ数（枚数）だけ」でもOK

### Step 5) generate_script の本実装（台本＋時間配分）

* `raw.text` の長さから重み付けして秒数配分
* `goal / keyPoints / talkTrack` を生成
* `stats.overBySeconds` を計算してUIで警告

### Step 6) update_slide / rebalance_timing / export_script

* 編集は patch 方式
* 再配分は locked を守って配り直す
* export は Markdown（スライド別 / 通し）を返す

編集系ツールは `widgetAccessible:true` + `visibility:"private"` が安定。 ([OpenAI Developers][2])

### Step 7) ローカルで検証（MCP Inspector）

`npx @modelcontextprotocol/inspector@latest http://localhost:8787/mcp` でツール入出力を検査。 ([OpenAI Developers][5])

### Step 8) ChatGPTに接続（Developer mode + Connector）

* HTTPSで `/mcp` を外部公開（ngrok等）
* ChatGPT設定でDeveloper mode → Connector作成 → URLに `https://.../mcp` を入れる ([OpenAI Developers][6])
* ツール変更したらConnectorの Refresh ([OpenAI Developers][6])

---

## 7) “完成”の定義（この順で足す）

1. **MVP-0**：解析→生成→編集→エクスポート（ここまでで公開価値）
2. **MVP-1**：リハーサル（fullscreen要求も可）＋つなぎ強化（transition） ([OpenAI Developers][1])
3. **品質**：フラグ（dense等）と修正導線、エラー（スキャンPDF等）ガード

---

## 8) 次にやる最初の作業（迷わない順）

1. `web/` を上の esbuild 構成で作る（toolOutputを画面に表示するだけ）
2. `server/` で `registerResource(text/html+skybridge)` を返し、`dist/component.js` をインライン
3. `generate_script` が固定のstructuredContentを返すようにして、UIが描画されるところまで通す

ここまで行けば、あとは `ingest_deck` を足して中身を本物にするだけ。

---

必要なら、次の返信で「コピペで起動する最小コード一式（server/src/index.ts + web/src/App.tsx + 5ツールの雛形）」をまとめて出す。どこから始める？ **(A)まずUI表示だけ通す** か **(B) ingest_deckから通す** か。

[1]: https://developers.openai.com/apps-sdk/build/chatgpt-ui?utm_source=chatgpt.com "Build your ChatGPT UI"
[2]: https://developers.openai.com/apps-sdk/reference/?utm_source=chatgpt.com "Reference"
[3]: https://developers.openai.com/apps-sdk/build/state-management/?utm_source=chatgpt.com "Managing State"
[4]: https://developers.openai.com/apps-sdk/build/mcp-server "Build your MCP server"
[5]: https://developers.openai.com/apps-sdk/quickstart?utm_source=chatgpt.com "Quickstart"
[6]: https://developers.openai.com/apps-sdk/deploy/connect-chatgpt?utm_source=chatgpt.com "Connect from ChatGPT"

