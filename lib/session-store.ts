/**
 * セッション管理ストア
 * 
 * 注意: このインメモリ実装は開発環境用です。
 * Vercelのサーバーレス環境では、複数のインスタンス間で状態が共有されません。
 * 本番環境では、Redis、Supabase、またはデータベースベースの実装に置き換えてください。
 */

import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

interface SessionData {
  transport: StreamableHTTPServerTransport;
  createdAt: Date;
  lastAccessedAt: Date;
}

class SessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30分

  /**
   * セッションを保存
   */
  set(sessionId: string, transport: StreamableHTTPServerTransport): void {
    const now = new Date();
    this.sessions.set(sessionId, {
      transport,
      createdAt: now,
      lastAccessedAt: now,
    });
    
    console.log(`[SessionStore] Session stored: ${sessionId}`);
  }

  /**
   * セッションを取得
   */
  get(sessionId: string): StreamableHTTPServerTransport | undefined {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return undefined;
    }

    // タイムアウトチェック
    const now = new Date();
    const elapsed = now.getTime() - session.lastAccessedAt.getTime();
    
    if (elapsed > this.SESSION_TIMEOUT) {
      console.log(`[SessionStore] Session expired: ${sessionId}`);
      this.delete(sessionId);
      return undefined;
    }

    // 最終アクセス時刻を更新
    session.lastAccessedAt = now;
    
    return session.transport;
  }

  /**
   * セッションを削除
   */
  delete(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      console.log(`[SessionStore] Session deleted: ${sessionId}`);
    }
    return deleted;
  }

  /**
   * セッションが存在するかチェック
   */
  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * すべてのセッションを取得（デバッグ用）
   */
  getAll(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * 期限切れセッションのクリーンアップ
   */
  cleanup(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    this.sessions.forEach((session, sessionId) => {
      const elapsed = now.getTime() - session.lastAccessedAt.getTime();
      if (elapsed > this.SESSION_TIMEOUT) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => {
      this.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`[SessionStore] Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * 統計情報を取得
   */
  getStats(): { total: number; active: number } {
    this.cleanup(); // クリーンアップを実行してから統計を返す
    return {
      total: this.sessions.size,
      active: this.sessions.size,
    };
  }
}

// シングルトンインスタンス
const sessionStore = new SessionStore();

// 定期的なクリーンアップ（5分ごと）
if (typeof window === 'undefined') {
  // サーバーサイドでのみ実行
  setInterval(() => {
    sessionStore.cleanup();
  }, 5 * 60 * 1000);
}

export default sessionStore;
