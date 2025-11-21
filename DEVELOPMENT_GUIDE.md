# Development Guide

Geo MCP の開発に関する詳細なガイドです。

## 📋 目次

- [プロジェクト構造](#プロジェクト構造)
- [アーキテクチャ](#アーキテクチャ)
- [開発ワークフロー](#開発ワークフロー)
- [ツールの追加](#ツールの追加)
- [デバッグ](#デバッグ)
- [テスト](#テスト)
- [パフォーマンス最適化](#パフォーマンス最適化)
- [トラブルシューティング](#トラブルシューティング)

## プロジェクト構造

```
geo-mcp/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── mcp/
│   │       └── route.ts         # MCPエンドポイント（POST/OPTIONS）
│   ├── globals.css              # グローバルスタイル
│   ├── layout.tsx               # ルートレイアウト
│   └── page.tsx                 # ホームページ
│
├── lib/                          # ビジネスロジック
│   ├── mcp/
│   │   ├── server.ts            # MCPサーバー設定
│   │   ├── types.ts             # 型定義とユーティリティ
│   │   ├── event-store.ts       # イベントストア（将来的に永続化）
│   │   └── tools/
│   │       └── example-tool.ts  # サンプルツール実装
│   └── session-store.ts         # セッション管理（将来的に永続化）
│
├── public/                       # 静的ファイル
├── .env.local                   # 環境変数（gitignore）
├── .env.local.example           # 環境変数のサンプル
├── next.config.js               # Next.js設定
├── tailwind.config.js           # Tailwind CSS設定
├── postcss.config.js            # PostCSS設定
├── tsconfig.json                # TypeScript設定
└── package.json                 # 依存関係とスクリプト
```

## アーキテクチャ

### システム概要

```
┌─────────────────┐
│  Claude Desktop │
│  / MCP Client   │
└────────┬────────┘
         │ HTTP (mcp-proxy)
         ↓
┌─────────────────────────────────┐
│      Vercel (Next.js)           │
│                                  │
│  ┌─────────────────────────┐   │
│  │   API Route             │   │
│  │   /api/mcp              │   │
│  └───────────┬─────────────┘   │
│              │                  │
│              ↓                  │
│  ┌─────────────────────────┐   │
│  │  InMemoryTransport      │   │
│  │  (Client-Server Pair)   │   │
│  └───────────┬─────────────┘   │
│              │                  │
│              ↓                  │
│  ┌─────────────────────────┐   │
│  │   MCP Server            │   │
│  │   - Tool Handlers       │   │
│  │   - Validation          │   │
│  │   - Error Handling      │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### リクエストフロー

1. **クライアント** → MCP リクエスト（JSON-RPC 2.0）
2. **API Route** → リクエストを受信
3. **Transport Pair** → InMemoryTransport ペアを作成
4. **MCP Server** → サーバーを Transport に接続
5. **Handler** → 適切なハンドラーを実行
6. **Response** → レスポンスを返却
7. **Cleanup** → Transport とサーバーをクローズ

### 主要コンポーネント

#### 1. API Route (`app/api/mcp/route.ts`)

- Next.js App Router のエンドポイント
- JSON-RPC リクエストのパース
- InMemoryTransport の管理
- エラーハンドリング

#### 2. MCP Server (`lib/mcp/server.ts`)

- サーバーインスタンスの作成
- ツールのハンドラー登録
- リクエストルーティング

#### 3. Tools (`lib/mcp/tools/`)

- 個別のツール実装
- Zod スキーマによるバリデーション
- ビジネスロジックの実装

## 開発ワークフロー

### 1. 環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.local.example .env.local
# .env.localを編集

# 開発サーバーの起動
npm run dev
```

### 2. 開発サイクル

```bash
# コードの変更

# 型チェック
npm run type-check

# 動作確認
# http://localhost:3000 でUIを確認
# ベンチマークツールでツールをテスト
npm run start list -- -s http://localhost:3000/api/mcp -v
```

### 3. コミット前のチェック

```bash
# 型チェック
npm run type-check

# ビルド確認
npm run build

# 問題がなければコミット
git add .
git commit -m "feat: add new feature"
```

## ツールの追加

### ステップ 1: ツールファイルの作成

`lib/mcp/tools/my-tool.ts`:

```typescript
import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * ツールの入力スキーマ
 */
export const myToolInputSchema = z.object({
  param1: z.string().describe("パラメータ1の説明"),
  param2: z.number().optional().describe("パラメータ2の説明（オプション）"),
});

/**
 * ツールのハンドラー
 */
export async function myToolHandler({
  param1,
  param2 = 0,
}: z.infer<typeof myToolInputSchema>): Promise<CallToolResult> {
  try {
    // ビジネスロジックの実装
    const result = await someAsyncOperation(param1, param2);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      ],
      isError: true,
    };
  }
}

async function someAsyncOperation(
  param1: string,
  param2: number
): Promise<any> {
  // 実装
  return { result: "success" };
}
```

### ステップ 2: サーバーに登録

`lib/mcp/server.ts`:

```typescript
import { myToolHandler, myToolInputSchema } from "./tools/my-tool";

// ...

// tools/listハンドラー内に追加
server.setRequestHandler(
  ListToolsRequestSchema,
  async (_request: ListToolsRequest) => {
    return {
      tools: [
        // 既存のツール...
        {
          name: "my-tool",
          description: "My custom tool description",
          inputSchema: zodToJsonSchema(myToolInputSchema),
        },
      ],
    };
  }
);

// tools/callハンドラー内に追加
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        // 既存のケース...

        case "my-tool": {
          const parsed = myToolInputSchema.parse(args);
          return await myToolHandler(parsed);
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      // エラーハンドリング
    }
  }
);
```

### ステップ 3: テスト

```bash
# 開発サーバーを起動
npm run dev

# ベンチマークツールでテスト
npm run start list -- -s http://localhost:3000/api/mcp -v

# ツールの実行テスト
npm run start benchmark -- -s http://localhost:3000/api/mcp -t my-tool
```

## デバッグ

### ログ出力

```typescript
// サーバーログ
console.log("[MCP Server] Tool called:", name, args);

// エラーログ
console.error("[MCP Server] Error:", error);
```

### Next.js のデバッグ

```bash
# デバッグモードで起動
NODE_OPTIONS='--inspect' npm run dev
```

Chrome DevTools で `chrome://inspect` を開いてデバッグ可能。

### MCP 通信のデバッグ

```typescript
// app/api/mcp/route.ts
console.log("[API] Received request:", body.method, "id:", body.id);
console.log("[API] Request body:", JSON.stringify(body, null, 2));
console.log("[API] Response:", JSON.stringify(response, null, 2));
```

### Vercel Logs

デプロイ後のログ確認：

```bash
vercel logs
```

または、Vercel ダッシュボードの「Logs」タブで確認。

## テスト

### 手動テスト

#### 1. ブラウザでのテスト

```
http://localhost:3000
```

UI からサーバーステータスとツール一覧を確認。

#### 2. curl でのテスト

```bash
# tools/list
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'

# tools/call
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "greet",
      "arguments": {
        "name": "World",
        "language": "en"
      }
    }
  }'
```

#### 3. ベンチマークツールでのテスト

```bash
# ツール一覧
npm run start list -- -s http://localhost:3000/api/mcp -v

# 特定ツールのベンチマーク
npm run start benchmark -- -s http://localhost:3000/api/mcp -t greet
```

### 自動テスト（将来的に実装予定）

```bash
# ユニットテスト
npm test

# インテグレーションテスト
npm run test:integration

# E2Eテスト
npm run test:e2e
```

## パフォーマンス最適化

### 1. コールドスタート対策

Vercel Serverless Functions はコールドスタートが発生します。

```typescript
// グローバルスコープでの初期化は避ける
// let serverInstance = createMCPServer(); // ❌

// リクエストごとに作成
export async function POST(request: NextRequest) {
  const server = createMCPServer(); // ✅
  // ...
}
```

### 2. メモリ使用量の削減

```typescript
// イベントストアの上限設定
private readonly MAX_EVENTS_PER_STREAM = 1000;

// 使用後のクリーンアップ
await server.close();
await transport.close();
```

### 3. レスポンスタイムの最適化

- データベースクエリの最適化（将来的に）
- キャッシングの活用（将来的に）
- 不要な処理の削減

## トラブルシューティング

### 問題: `Module not found` エラー

**解決策**: インポートパスの拡張子を確認

```typescript
// ❌ 間違い（プロジェクト内）
import { greetHandler } from "./tools/example-tool.js";

// ✅ 正しい（プロジェクト内）
import { greetHandler } from "./tools/example-tool";

// ✅ 正しい（MCP SDK）
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
```

### 問題: 型エラー

**解決策**: 型チェックを実行して詳細を確認

```bash
npm run type-check
```

### 問題: ビルドエラー

**解決策**: 依存関係を再インストール

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 問題: Vercel デプロイが失敗

**チェック項目**:

1. 環境変数が設定されているか
2. `package.json`のスクリプトが正しいか
3. ビルドがローカルで成功するか

```bash
# ローカルでビルドテスト
npm run build
```

### 問題: MCP クライアントから接続できない

**解決策**:

1. サーバーが起動しているか確認
2. CORS ヘッダーが正しいか確認
3. エンドポイント URL が正しいか確認

```bash
# サーバー起動確認
curl http://localhost:3000/api/mcp
```

## 参考リソース

### 公式ドキュメント

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)

### TypeScript / Zod

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Zod Documentation](https://zod.dev)

### ツール

- [VS Code](https://code.visualstudio.com/) - 推奨エディタ
- [Postman](https://www.postman.com/) - API テスト
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - デバッグ

---

**Happy Coding! 🚀**
