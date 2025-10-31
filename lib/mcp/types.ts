/**
 * MCP関連の型定義とユーティリティ関数
 */

import type { JSONRPCRequest } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCPリクエストがinitializeリクエストかどうかを判定
 */
export function isInitializeRequest(body: any): body is JSONRPCRequest {
  return (
    body &&
    typeof body === 'object' &&
    body.method === 'initialize' &&
    body.jsonrpc === '2.0'
  );
}

/**
 * MCPエラーレスポンスの作成
 */
export function createMCPErrorResponse(
  code: number,
  message: string,
  id: string | number | null = null
) {
  return {
    jsonrpc: '2.0' as const,
    error: {
      code,
      message,
    },
    id,
  };
}

/**
 * セッションIDの生成
 */
export function generateSessionId(): string {
  return `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * MCPエラーコード
 */
export const MCPErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR: -32000,
} as const;

/**
 * セッション情報の型
 */
export interface SessionInfo {
  sessionId: string;
  createdAt: Date;
  lastAccessedAt: Date;
}
