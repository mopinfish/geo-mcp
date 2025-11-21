/**
 * MCPサーバーの設定
 *
 * サーバーインスタンスの作成とツール・リソース・プロンプトの登録を行います
 */

import { Server } from "@modelcontextprotocol/sdk/server/index";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types";
import type {
  CallToolRequest,
  ListToolsRequest,
} from "@modelcontextprotocol/sdk/types";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  greetHandler,
  greetInputSchema,
  echoHandler,
  echoInputSchema,
  getCurrentTimeHandler,
} from "./tools/example-tool";

/**
 * MCPサーバーインスタンスの作成
 * 注意: 毎回新しいインスタンスを作成します（ステートレス）
 */
export function createMCPServer() {
  const serverInfo = {
    name: process.env.MCP_SERVER_NAME || "geo-mcp",
    version: process.env.MCP_SERVER_VERSION || "1.0.0",
  };

  const server = new Server(serverInfo, {
    capabilities: {
      tools: {},
      // 将来的に追加可能
      // resources: {},
      // prompts: {},
      // logging: {},
    },
  });

  console.log(
    `[MCP Server] Creating server: ${serverInfo.name} v${serverInfo.version}`
  );

  // ツール一覧のリクエストハンドラー
  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request: ListToolsRequest) => {
      console.log("[MCP Server] Listing tools");
      return {
        tools: [
          {
            name: "greet",
            description: "指定された名前で挨拶を返します",
            inputSchema: zodToJsonSchema(greetInputSchema),
          },
          {
            name: "echo",
            description: "メッセージをエコーバックします",
            inputSchema: zodToJsonSchema(echoInputSchema),
          },
          {
            name: "get-current-time",
            description: "現在の日時を日本時間で返します",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    }
  );

  // ツール呼び出しのリクエストハンドラー
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;
      console.log(`[MCP Server] Tool called: ${name}`, args);

      try {
        switch (name) {
          case "greet": {
            const parsed = greetInputSchema.parse(args);
            return await greetHandler(parsed);
          }

          case "echo": {
            const parsed = echoInputSchema.parse(args);
            return await echoHandler(parsed);
          }

          case "get-current-time":
            return await getCurrentTimeHandler();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`[MCP Server] Error executing tool ${name}:`, error);
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
  );

  console.log(
    "[MCP Server] Server initialized with tools: greet, echo, get-current-time"
  );

  return server;
}
