# SlideScript

PDF/PPTXファイルからプレゼンテーション台本を自動生成するChatGPT Apps SDKアプリケーションです。

## 概要

SlideScriptは、プレゼンテーション資料（PDF/PPTX）をアップロードするだけで、各スライドの台本と時間配分を自動生成します。MCP（Model Context Protocol）サーバーとReactウィジェットで構成されており、ChatGPT上で直接操作できます。

## 主な機能

- **ファイル解析**: PDF/PPTXファイルからスライド内容を自動抽出
- **台本生成**: 各スライドのゴール、トークトラック、キーポイントを生成
- **時間配分**: 総プレゼン時間に基づいた自動時間配分
- **柔軟な編集**: スライドごとの時間調整（ロック機能付き）
- **多様な設定**:
  - 対象者: 社内向け / 顧客向け / 勉強会 / カンファレンス
  - トーン: カジュアル / 丁寧 / 営業 / 学術
  - 言語: 日本語 / 英語
- **エクスポート**: Markdown形式での台本出力

## 技術スタック

- **サーバー**: Cloudflare Workers + Hono + MCP
- **フロントエンド**: React + TypeScript
- **ビルドツール**: Bun

## プロジェクト構成

```
slidescript/
├── package.json          # ワークスペース設定
├── server/               # MCPサーバー
│   ├── src/
│   │   ├── index.ts      # エントリーポイント（Hono + MCP）
│   │   ├── types.ts      # 型定義
│   │   ├── store.ts      # プロジェクト・スライド状態管理
│   │   ├── template.ts   # ウィジェットHTMLテンプレート
│   │   └── tools/        # MCPツール実装
│   └── wrangler.toml     # Cloudflare Workers設定
└── web/                  # Reactウィジェット
    ├── src/
    │   ├── App.tsx       # メインコンポーネント
    │   ├── components/   # UIコンポーネント
    │   └── openai-hooks.ts # OpenAIブリッジ
    └── dist/             # ビルド出力
```

## セットアップ

### 必要条件

- [Bun](https://bun.sh/) v1.0以上

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd slidescript

# 依存関係のインストール
bun install
```

## 開発

### 開発サーバーの起動

```bash
bun run dev
```

`http://localhost:8787` でサーバーが起動します。

### MCPインスペクターでのテスト

```bash
cd server
bun run inspect
```

または直接:

```bash
bunx @modelcontextprotocol/inspector@latest http://localhost:8787/mcp
```

### ChatGPTとの連携

1. [ngrok](https://ngrok.com/)などを使用してローカルサーバーを公開
2. ChatGPTの開発者モードでコネクタURLを追加

## ビルド

```bash
# ウィジェットのビルド
bun run build:web

# 全体ビルド（ウィジェット + サーバー）
bun run build
```

## デプロイ

```bash
cd server
bun run deploy
```

Cloudflare Workersにデプロイされます。

## MCPツール一覧

| ツール名 | 説明 |
|---------|------|
| `ingest_deck` | PDF/PPTXファイルを解析してスライド情報を抽出 |
| `generate_script` | スライドの台本と時間配分を生成 |
| `update_slide` | 個別スライドの台本・時間を更新 |
| `rebalance_timing` | 時間配分を再調整（ロック済みスライドは維持） |
| `export_script` | Markdown形式で台本をエクスポート |

## 使い方

1. ChatGPTにPDF/PPTXファイルをアップロード
2. 「台本を作成して」などと依頼
3. ウィジェット上で時間配分や台本を編集
4. 必要に応じてMarkdownでエクスポート

## 制限事項

- ウィジェットからのファイルアップロードは画像のみ対応（PDF/PPTXはチャット添付経由）
- Cloudflare Workers環境のため、PDF/PPTX解析は基本的なテキスト抽出のみ

## ライセンス

MIT
