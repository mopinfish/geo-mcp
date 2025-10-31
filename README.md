# Geo MCP

Next.jsを使用した地理空間情報対応のModel Context Protocol (MCP) サーバー実装

## 🚀 特徴

- **Next.js 15 App Router**: 最新のNext.jsフレームワークを使用
- **TypeScript**: 型安全な開発環境
- **MCP SDK**: `@modelcontextprotocol/sdk` を使用した標準実装
- **Vercel対応**: サーバーレス環境でのデプロイに対応
- **拡張可能**: 将来的にSupabase/PostgreSQLとの統合を想定

## 📋 前提条件

- Node.js 18以上
- npm または yarn

## 🛠️ セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

サーバーは `http://localhost:3000` で起動します。

## 📡 MCPエンドポイント

- **POST** `/api/mcp` - MCPリクエストの処理
- **GET** `/api/mcp` - SSEストリームの確立（セッションIDが必要）

## 🔧 開発

```bash
# 型チェック
npm run type-check

# ビルド
npm run build

# 本番サーバーの起動
npm run start
```

## 📦 デプロイ (Vercel)

```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel
```

## 🗺️ ロードマップ

- [x] 基本的なMCPサーバー実装
- [ ] Supabase統合
- [ ] PostgreSQLでの地理空間情報データ管理
- [ ] 管理画面の実装
- [ ] Supabase Auth統合

## 📄 ライセンス

MIT
