/**
 * MCP API Route
 * 
 * POST /api/mcp - MCPリクエストの処理
 * GET /api/mcp - SSEストリームの確立
 * DELETE /api/mcp - セッション終了
 */

import { NextRequest, NextResponse } from 'next/server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { getMCPServer } from '@/lib/mcp/server';
import sessionStore from '@/lib/session-store';
import eventStore from '@/lib/mcp/event-store';
import { 
  isInitializeRequest, 
  createMCPErrorResponse, 
  MCPErrorCode,
  generateSessionId 
} from '@/lib/mcp/types';

/**
 * POST - MCPリクエストの処理
 */
export async function POST(request: NextRequest) {
  try {
    // セッションIDの取得
    const sessionId = request.headers.get('mcp-session-id') || undefined;
    
    console.log('[API] POST /api/mcp', { 
      sessionId,
      hasSessionId: !!sessionId 
    });

    // リクエストボディの取得
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      console.error('[API] Failed to parse request body:', error);
      return NextResponse.json(
        createMCPErrorResponse(
          MCPErrorCode.PARSE_ERROR,
          'Invalid JSON in request body'
        ),
        { status: 400 }
      );
    }

    let transport: StreamableHTTPServerTransport;

    // 既存のセッションがあれば再利用
    if (sessionId && sessionStore.has(sessionId)) {
      console.log('[API] Reusing existing transport for session:', sessionId);
      transport = sessionStore.get(sessionId)!;
    } 
    // 新しいセッションの初期化
    else if (!sessionId && isInitializeRequest(body)) {
      console.log('[API] Creating new session for initialize request');
      
      // 新しいトランスポートを作成
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: generateSessionId,
        eventStore, // 再開可能性をサポート
        onsessioninitialized: (newSessionId) => {
          console.log('[API] Session initialized:', newSessionId);
          sessionStore.set(newSessionId, transport);
        },
      });

      // トランスポートのクローズハンドラー
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && sessionStore.has(sid)) {
          console.log('[API] Transport closed, removing session:', sid);
          sessionStore.delete(sid);
        }
      };

      // MCPサーバーに接続
      const server = getMCPServer();
      await server.connect(transport);
    } 
    // 無効なリクエスト
    else {
      console.error('[API] Invalid request: no session ID or not an initialize request');
      return NextResponse.json(
        createMCPErrorResponse(
          MCPErrorCode.INVALID_REQUEST,
          'Bad Request: No valid session ID provided or not an initialize request'
        ),
        { status: 400 }
      );
    }

    // リクエストを処理
    // NextRequestをNode.js互換のリクエストオブジェクトに変換
    const nodeRequest = {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      body,
    };

    // レスポンスを収集するためのWritableStream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // 擬似的なResponseオブジェクト
    const nodeResponse = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      headersSent: false,
      writeHead(statusCode: number, headers?: Record<string, string>) {
        this.statusCode = statusCode;
        if (headers) {
          this.headers = { ...this.headers, ...headers };
        }
        this.headersSent = true;
        return this;
      },
      setHeader(name: string, value: string) {
        this.headers[name] = value;
        return this;
      },
      write(chunk: string) {
        writer.write(encoder.encode(chunk));
        return true;
      },
      end(chunk?: string) {
        if (chunk) {
          writer.write(encoder.encode(chunk));
        }
        writer.close();
        return this;
      },
    };

    // トランスポートでリクエストを処理
    await transport.handleRequest(nodeRequest as any, nodeResponse as any, body);

    // レスポンスを構築
    const responseHeaders = new Headers(nodeResponse.headers);
    
    // セッションIDをヘッダーに含める
    if (transport.sessionId) {
      responseHeaders.set('Mcp-Session-Id', transport.sessionId);
    }

    // CORSヘッダーを追加
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Expose-Headers', 'Mcp-Session-Id');

    return new NextResponse(readable, {
      status: nodeResponse.statusCode,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[API] Error handling POST request:', error);
    return NextResponse.json(
      createMCPErrorResponse(
        MCPErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Internal server error'
      ),
      { status: 500 }
    );
  }
}

/**
 * GET - SSEストリームの確立
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('mcp-session-id');

    console.log('[API] GET /api/mcp', { sessionId });

    if (!sessionId) {
      return NextResponse.json(
        createMCPErrorResponse(
          MCPErrorCode.INVALID_REQUEST,
          'Missing session ID'
        ),
        { status: 400 }
      );
    }

    const transport = sessionStore.get(sessionId);
    
    if (!transport) {
      return NextResponse.json(
        createMCPErrorResponse(
          MCPErrorCode.INVALID_REQUEST,
          'Invalid or expired session ID'
        ),
        { status: 400 }
      );
    }

    // Last-Event-IDヘッダーの取得（再開可能性）
    const lastEventId = request.headers.get('last-event-id');
    if (lastEventId) {
      console.log('[API] Client reconnecting with Last-Event-ID:', lastEventId);
    } else {
      console.log('[API] Establishing new SSE stream for session:', sessionId);
    }

    // SSEストリームを作成
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // 擬似的なResponseオブジェクト
    const nodeResponse = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      headersSent: false,
      writeHead(statusCode: number, headers?: Record<string, string>) {
        this.statusCode = statusCode;
        if (headers) {
          this.headers = { ...this.headers, ...headers };
        }
        this.headersSent = true;
        return this;
      },
      setHeader(name: string, value: string) {
        this.headers[name] = value;
        return this;
      },
      write(chunk: string) {
        writer.write(encoder.encode(chunk));
        return true;
      },
      end(chunk?: string) {
        if (chunk) {
          writer.write(encoder.encode(chunk));
        }
        writer.close();
        return this;
      },
    };

    // トランスポートでリクエストを処理
    const nodeRequest = {
      method: 'GET',
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    };

    await transport.handleRequest(nodeRequest as any, nodeResponse as any);

    // SSEレスポンスヘッダー
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Mcp-Session-Id',
      'Mcp-Session-Id': sessionId,
      ...nodeResponse.headers,
    });

    return new NextResponse(stream.readable, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('[API] Error handling GET request:', error);
    return NextResponse.json(
      createMCPErrorResponse(
        MCPErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Internal server error'
      ),
      { status: 500 }
    );
  }
}

/**
 * DELETE - セッション終了
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.headers.get('mcp-session-id');

    console.log('[API] DELETE /api/mcp', { sessionId });

    if (!sessionId) {
      return NextResponse.json(
        createMCPErrorResponse(
          MCPErrorCode.INVALID_REQUEST,
          'Missing session ID'
        ),
        { status: 400 }
      );
    }

    const deleted = sessionStore.delete(sessionId);
    await eventStore.clearStream(sessionId);

    if (deleted) {
      console.log('[API] Session deleted:', sessionId);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        createMCPErrorResponse(
          MCPErrorCode.INVALID_REQUEST,
          'Session not found'
        ),
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('[API] Error handling DELETE request:', error);
    return NextResponse.json(
      createMCPErrorResponse(
        MCPErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Internal server error'
      ),
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - CORSプリフライト
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id, Last-Event-Id',
      'Access-Control-Expose-Headers': 'Mcp-Session-Id',
    },
  });
}
