# 🌍 Geo MCP

Next.js 15 を使用した地理空間情報対応の Model Context Protocol (MCP) サーバー実装

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/geo-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.0.4-green)](https://modelcontextprotocol.io)

## 📋 目次

- [概要](#概要)
- [デモ](#デモ)
- [機能](#機能)
- [技術スタック](#技術スタック)
- [セットアップ](#セットアップ)
- [使用方法](#使用方法)
- [API 仕様](#api仕様)
- [利用可能なツール](#利用可能なツール)
- [開発](#開発)
- [デプロイ](#デプロイ)
- [今後の展開](#今後の展開)
- [トラブルシューティング](#トラブルシューティング)
- [貢献](#貢献)
- [ライセンス](#ライセンス)

## 概要

Geo MCP は、Model Context Protocol (MCP)を実装した Next.js ベースのサーバーです。将来的に Supabase/PostgreSQL + PostGIS と統合し、地理空間データを扱うツールを提供することを目指しています。

### 主な特徴

- 🚀 **Next.js 15 App Router** - 最新の React Server Components を活用
- 📝 **TypeScript 完全対応** - 型安全な開発環境
- 🔌 **MCP 標準実装** - `@modelcontextprotocol/sdk`を使用
- ☁️ **Vercel デプロイ対応** - サーバーレス環境で動作
- 🔐 **型安全なバリデーション** - Zod スキーマによる入力検証
- 🎨 **モダン UI** - Tailwind CSS v3 によるレスポンシブデザイン

## デモ

- **本番環境**: https://geo-mcp.vercel.app
- **MCP エンドポイント**: https://geo-mcp.vercel.app/api/mcp

### ベンチマークツールでの動作確認

```bash
npx mcp-benchmark-tool list -s https://geo-mcp.vercel.app/api/mcp -v
```

## 機能

### 実装済み

- ✅ JSON-RPC 2.0 プロトコルの完全サポート
- ✅ InMemoryTransport によるステートレス通信
- ✅ 3 つのサンプルツール（greet, echo, get-current-time）
- ✅ Zod スキーマによる入力バリデーション
- ✅ 自動的な JSON Schema 生成
- ✅ CORS 対応
- ✅ エラーハンドリング
- ✅ TypeScript 型チェック

### 計画中

- 🔜 Supabase/PostgreSQL 統合
- 🔜 PostGIS による地理空間データ管理
- 🔜 MapFan API 統合
- 🔜 管理画面の実装
- 🔜 Supabase Auth 統合
- 🔜 セッション永続化（Vercel KV/Redis）

## 技術スタック

### フロントエンド・フレームワーク

- **Next.js** 15.5.6 - React フレームワーク
- **React** 19.0.0 - UI ライブラリ
- **TypeScript** 5.7.2 - 型安全性
- **Tailwind CSS** 3.4.17 - スタイリング

### バックエンド・MCP

- **@modelcontextprotocol/sdk** 1.0.4 - MCP 実装
- **Zod** 3.23.8 - スキーマバリデーション
- **zod-to-json-schema** 3.24.6 - スキーマ変換

### インフラストラクチャ

- **Vercel** - ホスティング・デプロイ
- **Serverless Functions** - API 実行環境

## セットアップ

### 前提条件

- Node.js 18 以上
- npm または yarn

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/geo-mcp.git
cd geo-mcp

# 依存関係のインストール
npm install

# 環境変数の設定（オプション）
cp .env.local.example .env.local
# .env.localを編集して必要な環境変数を設定

# 開発サーバーの起動
npm run dev
```

サーバーは `http://localhost:3000` で起動します。

## 使用方法

### 1. ブラウザでアクセス

```
http://localhost:3000
```

サーバーステータス、利用可能なツール、接続方法が表示されます。

### 2. Claude Desktop から接続

`claude_desktop_config.json` に以下を追加：

```json
{
  "mcpServers": {
    "geo-mcp": {
      "command": "/path/to/uvx",
      "args": [
        "mcp-proxy",
        "http://localhost:3000/api/mcp",
        "--transport=streamablehttp"
      ]
    }
  }
}
```

または本番環境を使用：

```json
{
  "mcpServers": {
    "geo-mcp": {
      "command": "/path/to/uvx",
      "args": [
        "mcp-proxy",
        "https://geo-mcp.vercel.app/api/mcp",
        "--transport=streamablehttp"
      ]
    }
  }
}
```

### 3. プログラムから接続

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/api/mcp")
);

const client = new Client(
  {
    name: "my-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

await client.connect(transport);

// ツール一覧を取得
const tools = await client.listTools();
console.log(tools);
```

## API 仕様

### エンドポイント

#### `POST /api/mcp`

MCP リクエストを処理します。

**リクエスト:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**レスポンス:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "greet",
        "description": "指定された名前で挨拶を返します",
        "inputSchema": { ... }
      }
    ]
  }
}
```

#### `OPTIONS /api/mcp`

CORS プリフライトリクエストを処理します。

### エラーレスポンス

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Internal error"
  },
  "id": 1
}
```

## 利用可能なツール

### 1. greet

指定された名前で多言語の挨拶を返します。

**パラメータ:**

- `name` (string, required): 挨拶する相手の名前
- `language` (string, optional): 言語コード（ja, en, es, fr）。デフォルト: ja

**使用例:**

```json
{
  "name": "greet",
  "arguments": {
    "name": "太郎",
    "language": "ja"
  }
}
```

**結果:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "こんにちは、太郎さん！"
    }
  ]
}
```

### 2. echo

メッセージをエコーバックします。

**パラメータ:**

- `message` (string, required): エコーするメッセージ
- `repeat` (number, optional): 繰り返し回数（1-10）。デフォルト: 1

**使用例:**

```json
{
  "name": "echo",
  "arguments": {
    "message": "Hello",
    "repeat": 3
  }
}
```

**結果:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Hello\nHello\nHello"
    }
  ]
}
```

### 3. get-current-time

現在の日時を日本時間で返します。

**パラメータ:** なし

**使用例:**

```json
{
  "name": "get-current-time",
  "arguments": {}
}
```

**結果:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "現在時刻: 2024年12月1日日曜日 12時34分56秒 日本標準時"
    }
  ]
}
```

## 開発

### 開発コマンド

```bash
# 開発サーバー起動（ホットリロード有効）
npm run dev

# 型チェック
npm run type-check

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start
```

### プロジェクト構造

```
geo-mcp/
├── app/
│   ├── api/
│   │   └── mcp/
│   │       └── route.ts          # MCPエンドポイント
│   ├── globals.css                # グローバルスタイル
│   ├── layout.tsx                 # ルートレイアウト
│   └── page.tsx                   # トップページ
├── lib/
│   ├── mcp/
│   │   ├── server.ts              # MCPサーバー設定
│   │   ├── types.ts               # 型定義
│   │   ├── event-store.ts         # イベントストア
│   │   └── tools/
│   │       └── example-tool.ts    # サンプルツール
│   └── session-store.ts           # セッション管理
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

### 新しいツールの追加方法

1. **ツールハンドラーの作成** (`lib/mcp/tools/your-tool.ts`):

```typescript
import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const yourToolInputSchema = z.object({
  param1: z.string().describe("パラメータの説明"),
});

export async function yourToolHandler({
  param1,
}: z.infer<typeof yourToolInputSchema>): Promise<CallToolResult> {
  return {
    content: [
      {
        type: "text",
        text: `結果: ${param1}`,
      },
    ],
  };
}
```

2. **サーバーに登録** (`lib/mcp/server.ts`):

```typescript
import { yourToolHandler, yourToolInputSchema } from './tools/your-tool';

// tools/listハンドラー内に追加
{
  name: 'your-tool',
  description: 'ツールの説明',
  inputSchema: zodToJsonSchema(yourToolInputSchema),
}

// tools/callハンドラー内に追加
case 'your-tool': {
  const parsed = yourToolInputSchema.parse(args);
  return await yourToolHandler(parsed);
}
```

## デプロイ

### Vercel へのデプロイ

#### 方法 1: Vercel CLI

```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel

# 本番環境へのデプロイ
vercel --prod
```

#### 方法 2: GitHub インテグレーション

1. GitHub リポジトリを Vercel に接続
2. 自動的にデプロイが開始されます
3. プッシュごとに自動デプロイされます

### 環境変数の設定

Vercel ダッシュボードで以下の環境変数を設定：

```
MCP_SERVER_NAME=geo-mcp
MCP_SERVER_VERSION=1.0.0
```

将来的に追加予定：

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...
```

## 今後の展開

### Phase 1: 地理空間データ基盤 (1-2 週間)

- [ ] Supabase プロジェクトのセットアップ
- [ ] PostgreSQL + PostGIS 拡張の有効化
- [ ] データベーススキーマ設計
- [ ] 基本的な地理空間ツール実装
  - `search-nearby`: 周辺検索
  - `get-location`: 地点情報取得
  - `calculate-distance`: 距離計算

### Phase 2: MapFan API 統合 (1-2 週間)

- [ ] MapFan API クライアント実装
- [ ] 6 つのツールの移植
- [ ] エラーハンドリング強化
- [ ] キャッシング実装

### Phase 3: セッション管理改善 (1 週間)

- [ ] Vercel KV または Redis 導入
- [ ] セッション永続化
- [ ] イベントストア改善

### Phase 4: 管理画面 (2-3 週間)

- [ ] Supabase Auth 統合
- [ ] データ管理 UI
- [ ] 地図可視化
- [ ] ダッシュボード

## トラブルシューティング

### Q: `Module not found: Can't resolve './tools/example-tool.js'`

**A:** TypeScript ファイルのインポートでは、相対パスの場合は拡張子なしでインポートしてください。

```typescript
// ❌ 間違い
import { greetHandler } from "./tools/example-tool.js";

// ✅ 正しい
import { greetHandler } from "./tools/example-tool";
```

### Q: `module.exports is not defined in ES module scope`

**A:** `package.json`に`"type": "module"`が設定されているため、設定ファイルは`export default`を使用してください。

```javascript
// ❌ 間違い
module.exports = nextConfig;

// ✅ 正しい
export default nextConfig;
```

### Q: Claude Desktop から接続できない

**A:** `mcp-proxy`を使用して Streamable HTTP トランスポート経由で接続してください：

```json
{
  "mcpServers": {
    "geo-mcp": {
      "command": "/path/to/uvx",
      "args": [
        "mcp-proxy",
        "http://localhost:3000/api/mcp",
        "--transport=streamablehttp"
      ]
    }
  }
}
```

### Q: Vercel デプロイ後に動作しない

**A:** 環境変数が正しく設定されているか確認してください。Vercel ダッシュボードの Settings > Environment Variables で確認できます。

## 貢献

貢献を歓迎します！以下の手順でお願いします：

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発ガイドライン

- TypeScript の型を適切に使用
- コミットメッセージは明確に
- 新機能にはテストを追加
- ドキュメントを更新

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 参考リンク

- [Model Context Protocol 公式サイト](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Next.js ドキュメント](https://nextjs.org/docs)
- [Vercel ドキュメント](https://vercel.com/docs)
- [Supabase ドキュメント](https://supabase.com/docs)
- [PostGIS ドキュメント](https://postgis.net/documentation/)

## サポート

質問や問題がある場合は、[GitHub Issues](https://github.com/yourusername/geo-mcp/issues) で報告してください。

---

**開発者**: あなたの名前  
**最終更新**: 2024 年 12 月
