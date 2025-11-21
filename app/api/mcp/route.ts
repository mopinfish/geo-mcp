/**
 * MCP API Route
 *
 * POST /api/mcp - MCPリクエストの処理
 */

import { NextRequest, NextResponse } from "next/server";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory";
import { createMCPServer } from "@/lib/mcp/server";
import type {
  JSONRPCRequest,
  JSONRPCResponse,
} from "@modelcontextprotocol/sdk/types";

/**
 * POST - MCPリクエストの処理
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディの取得
    let body: JSONRPCRequest;
    try {
      body = await request.json();
      console.log("[API] Received request:", body.method, "id:", body.id);
    } catch (error) {
      console.error("[API] Failed to parse request body:", error);
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32700,
            message: "Parse error",
          },
          id: null,
        },
        { status: 400 }
      );
    }

    // InMemoryTransportペアを作成
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    // サーバーを作成して接続
    const server = createMCPServer();
    await server.connect(serverTransport);

    try {
      // クライアント側のトランスポートを使ってリクエストを送信
      const responsePromise = new Promise<JSONRPCResponse>(
        (resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Request timeout"));
          }, 30000);

          // レスポンスを受け取るハンドラー
          clientTransport.onmessage = (message: JSONRPCResponse) => {
            clearTimeout(timeout);
            console.log("[API] Response received:", message);
            resolve(message);
          };

          clientTransport.onerror = (error: Error) => {
            clearTimeout(timeout);
            console.error("[API] Transport error:", error);
            reject(error);
          };

          // リクエストを送信
          clientTransport.send(body);
        }
      );

      const response = await responsePromise;

      // クリーンアップ
      await server.close();
      await clientTransport.close();
      await serverTransport.close();

      return NextResponse.json(response, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error: any) {
      console.error("[API] Error processing request:", error);

      // クリーンアップ
      try {
        await server.close();
        await clientTransport.close();
        await serverTransport.close();
      } catch (cleanupError) {
        console.error("[API] Cleanup error:", cleanupError);
      }

      const errorResponse: JSONRPCResponse = {
        jsonrpc: "2.0",
        error: {
          code: error.code || -32603,
          message: error.message || "Internal error",
        },
        id: body.id ?? null,
      };

      return NextResponse.json(errorResponse, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  } catch (error) {
    console.error("[API] Unexpected error:", error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
          data: error instanceof Error ? error.message : "Unknown error",
        },
        id: null,
      },
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
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
