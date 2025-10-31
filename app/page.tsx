'use client';

import { useState } from 'react';

export default function Home() {
  const [stats, setStats] = useState<{
    sessions?: number;
    events?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      // 実際の統計情報を取得するAPIエンドポイントを実装する場合
      // const response = await fetch('/api/stats');
      // const data = await response.json();
      // setStats(data);
      
      // 現時点ではダミーデータ
      setStats({
        sessions: 0,
        events: 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              🌍 Geo MCP Server
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Model Context Protocol Server with Geospatial Data Support
            </p>
          </div>

          {/* ステータスカード */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              サーバーステータス
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    サーバー稼働中
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  エンドポイント
                </div>
                <code className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                  /api/mcp
                </code>
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    アクティブセッション
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.sessions}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    保存イベント数
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.events}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={checkStatus}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
            >
              {loading ? 'チェック中...' : 'ステータスを確認'}
            </button>
          </div>

          {/* 利用可能なツール */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              利用可能なツール
            </h2>
            
            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  greet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  指定された名前で挨拶を返します（多言語対応）
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                    name: string
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                    language?: ja|en|es|fr
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  echo
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  メッセージをエコーバックします
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                    message: string
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                    repeat?: number (1-10)
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  get-current-time
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  現在の日時を日本時間で返します
                </p>
              </div>
            </div>
          </div>

          {/* 接続方法 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              接続方法
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  1. Claude Desktop から接続
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    claude_desktop_config.json
                  </code> に以下を追加:
                </p>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "mcpServers": {
    "geo-mcp": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  2. 本番環境（Vercel）
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  デプロイ後、<code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    https://your-app.vercel.app/api/mcp
                  </code> を使用
                </p>
              </div>
            </div>
          </div>

          {/* フッター */}
          <div className="text-center mt-8 text-gray-500 dark:text-gray-400 text-sm">
            <p>
              Powered by{' '}
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Model Context Protocol
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
