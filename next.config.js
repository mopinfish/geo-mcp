/** @type {import('next').NextConfig} */
const nextConfig = {
  // MCPサーバーのために必要な設定
  experimental: {
    // Server Actionsを有効化（将来の拡張のため）
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // 環境変数の設定
  env: {
    MCP_SERVER_NAME: process.env.MCP_SERVER_NAME || 'geo-mcp',
    MCP_SERVER_VERSION: process.env.MCP_SERVER_VERSION || '1.0.0',
  },
}

module.exports = nextConfig
