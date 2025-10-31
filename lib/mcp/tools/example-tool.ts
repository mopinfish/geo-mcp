/**
 * サンプルツール: 挨拶ツール
 * 
 * MCPツールの基本的な実装例
 */

import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * 挨拶ツールの入力スキーマ
 */
export const greetInputSchema = z.object({
  name: z.string().describe('挨拶する相手の名前'),
  language: z
    .enum(['ja', 'en', 'es', 'fr'])
    .optional()
    .default('ja')
    .describe('挨拶の言語（ja: 日本語, en: 英語, es: スペイン語, fr: フランス語）'),
});

/**
 * 挨拶ツールのハンドラー
 */
export async function greetHandler({
  name,
  language = 'ja',
}: z.infer<typeof greetInputSchema>): Promise<CallToolResult> {
  const greetings: Record<string, string> = {
    ja: `こんにちは、${name}さん！`,
    en: `Hello, ${name}!`,
    es: `¡Hola, ${name}!`,
    fr: `Bonjour, ${name}!`,
  };

  const greeting = greetings[language] || greetings.ja;

  return {
    content: [
      {
        type: 'text',
        text: greeting,
      },
    ],
  };
}

/**
 * エコーツールの入力スキーマ
 */
export const echoInputSchema = z.object({
  message: z.string().describe('エコーするメッセージ'),
  repeat: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .default(1)
    .describe('繰り返し回数（1-10）'),
});

/**
 * エコーツールのハンドラー
 */
export async function echoHandler({
  message,
  repeat = 1,
}: z.infer<typeof echoInputSchema>): Promise<CallToolResult> {
  const repeated = Array(repeat).fill(message).join('\n');

  return {
    content: [
      {
        type: 'text',
        text: repeated,
      },
    ],
  };
}

/**
 * 現在時刻取得ツールのハンドラー
 */
export async function getCurrentTimeHandler(): Promise<CallToolResult> {
  const now = new Date();
  const jstTime = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(now);

  return {
    content: [
      {
        type: 'text',
        text: `現在時刻: ${jstTime}`,
      },
    ],
  };
}
