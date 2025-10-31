/**
 * インメモリイベントストア
 * 
 * MCP通信のイベントを保存し、セッションの再開をサポートします。
 * 
 * 注意: この実装は開発環境用です。
 * 本番環境では、永続化ストレージ（Redis、PostgreSQLなど）を使用してください。
 */

import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

type StreamId = string;
type EventId = string;

export interface EventStore {
  /**
   * Stores an event for later retrieval
   */
  storeEvent(streamId: StreamId, message: JSONRPCMessage): Promise<EventId>;

  /**
   * Replay events after a given event ID
   */
  replayEventsAfter(
    lastEventId: EventId,
    options: {
      send: (eventId: EventId, message: JSONRPCMessage) => Promise<void>;
    }
  ): Promise<StreamId>;
}

interface StoredEvent {
  id: EventId;
  streamId: StreamId;
  message: JSONRPCMessage;
  timestamp: number;
}

/**
 * インメモリ実装
 */
export class InMemoryEventStore implements EventStore {
  private events: Map<EventId, StoredEvent> = new Map();
  private streamEvents: Map<StreamId, EventId[]> = new Map();
  private eventCounter = 0;
  private readonly MAX_EVENTS_PER_STREAM = 1000;

  async storeEvent(streamId: StreamId, message: JSONRPCMessage): Promise<EventId> {
    const eventId = `event-${++this.eventCounter}-${Date.now()}`;
    
    const event: StoredEvent = {
      id: eventId,
      streamId,
      message,
      timestamp: Date.now(),
    };

    this.events.set(eventId, event);

    // ストリームごとのイベントリストに追加
    if (!this.streamEvents.has(streamId)) {
      this.streamEvents.set(streamId, []);
    }
    
    const streamEventList = this.streamEvents.get(streamId)!;
    streamEventList.push(eventId);

    // 古いイベントを削除（メモリ管理）
    if (streamEventList.length > this.MAX_EVENTS_PER_STREAM) {
      const removedEventId = streamEventList.shift()!;
      this.events.delete(removedEventId);
    }

    console.log(`[EventStore] Event stored: ${eventId} for stream: ${streamId}`);
    
    return eventId;
  }

  async replayEventsAfter(
    lastEventId: EventId,
    options: { send: (eventId: EventId, message: JSONRPCMessage) => Promise<void> }
  ): Promise<StreamId> {
    const lastEvent = this.events.get(lastEventId);
    
    if (!lastEvent) {
      throw new Error(`Event ${lastEventId} not found`);
    }

    const streamId = lastEvent.streamId;
    const streamEventList = this.streamEvents.get(streamId) || [];
    
    const lastEventIndex = streamEventList.indexOf(lastEventId);
    
    if (lastEventIndex === -1) {
      throw new Error(`Event ${lastEventId} not found in stream ${streamId}`);
    }

    // lastEventIdより後のイベントを送信
    const eventsToReplay = streamEventList.slice(lastEventIndex + 1);
    
    console.log(
      `[EventStore] Replaying ${eventsToReplay.length} events after ${lastEventId} for stream ${streamId}`
    );

    for (const eventId of eventsToReplay) {
      const event = this.events.get(eventId);
      if (event) {
        await options.send(eventId, event.message);
      }
    }

    return streamId;
  }

  /**
   * ストリームのイベントをクリア
   */
  async clearStream(streamId: StreamId): Promise<void> {
    const streamEventList = this.streamEvents.get(streamId) || [];
    
    for (const eventId of streamEventList) {
      this.events.delete(eventId);
    }
    
    this.streamEvents.delete(streamId);
    console.log(`[EventStore] Cleared events for stream ${streamId}`);
  }

  /**
   * 統計情報を取得（デバッグ用）
   */
  getStats(): { streams: number; totalEvents: number } {
    return {
      streams: this.streamEvents.size,
      totalEvents: this.events.size,
    };
  }
}

// シングルトンインスタンス
const eventStore = new InMemoryEventStore();

export default eventStore;
