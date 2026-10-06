import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { db } from '../config/database';
import { ChangeDetectionService } from '../services/change.service';

interface UserPresence {
  userId: string;
  userName: string;
  userRole: string;
  color: string;
  cursor?: { line: number; column: number };
  selection?: { startLine: number; startCol: number; endLine: number; endCol: number };
}

interface FileRoom {
  fileId: string;
  version: number;
  content: string;
  clients: Map<WebSocket, UserPresence>;
  operationHistory: Array<{ version: number; operation: any; clientId: string }>;
}

const USER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export class CollaborativeOTServer {
  private wss: WebSocketServer;
  private rooms: Map<string, FileRoom> = new Map();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws/collaborate' });
    this.setupListeners();
    console.log('[WebSocket] Real-Time Operational Transformation (OT) Server ready at /ws/collaborate');
  }

  private setupListeners(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      let currentFileId: string | null = null;
      let userPresence: UserPresence | null = null;

      ws.on('message', async (data: string) => {
        try {
          const msg = JSON.parse(data.toString());

          switch (msg.type) {
            case 'JOIN_FILE': {
              currentFileId = msg.fileId;
              const color = USER_COLORS[Math.abs(hashCode(msg.userId || '')) % USER_COLORS.length];
              userPresence = {
                userId: msg.userId,
                userName: msg.userName || 'Collaborator',
                userRole: msg.userRole || 'Developer',
                color
              };

              await this.handleJoinFile(ws, msg.fileId, userPresence);
              break;
            }

            case 'CURSOR_MOVE': {
              if (currentFileId && userPresence) {
                userPresence.cursor = msg.cursor;
                userPresence.selection = msg.selection;
                this.broadcastPresence(currentFileId, ws);
              }
              break;
            }

            case 'OT_OPERATION': {
              if (currentFileId && userPresence) {
                this.handleOTOperation(ws, currentFileId, userPresence, msg);
              }
              break;
            }

            case 'SAVE_FILE': {
              if (currentFileId && userPresence) {
                await this.handleSaveFile(ws, msg.projectId, currentFileId, userPresence.userId, msg.content);
              }
              break;
            }

            case 'LEAVE_FILE': {
              if (currentFileId) {
                this.handleLeaveFile(ws, currentFileId);
                currentFileId = null;
              }
              break;
            }
          }
        } catch (err: any) {
          console.error('[WebSocket] Error processing message:', err.message);
          ws.send(JSON.stringify({ type: 'ERROR', message: err.message }));
        }
      });

      ws.on('close', () => {
        if (currentFileId) {
          this.handleLeaveFile(ws, currentFileId);
        }
      });
    });
  }

  private async getOrCreateRoom(fileId: string): Promise<FileRoom> {
    if (!this.rooms.has(fileId)) {
      const fileRes = await db.query('SELECT content FROM files WHERE id = ?', [fileId]);
      const initialContent = fileRes.rows[0]?.content || '';

      this.rooms.set(fileId, {
        fileId,
        version: 0,
        content: initialContent,
        clients: new Map(),
        operationHistory: []
      });
    }
    return this.rooms.get(fileId)!;
  }

  private async handleJoinFile(ws: WebSocket, fileId: string, presence: UserPresence): Promise<void> {
    const room = await this.getOrCreateRoom(fileId);
    room.clients.set(ws, presence);

    // Send initial snapshot to joining client
    ws.send(
      JSON.stringify({
        type: 'INIT_SNAPSHOT',
        fileId,
        version: room.version,
        content: room.content,
        collaborators: Array.from(room.clients.values())
      })
    );

    // Broadcast updated presence to all clients in the room
    this.broadcastPresence(fileId);
  }

  private handleLeaveFile(ws: WebSocket, fileId: string): void {
    const room = this.rooms.get(fileId);
    if (room) {
      room.clients.delete(ws);
      this.broadcastPresence(fileId);
      if (room.clients.size === 0) {
        // Keep room content cached in memory
      }
    }
  }

  private broadcastPresence(fileId: string, excludeWs?: WebSocket): void {
    const room = this.rooms.get(fileId);
    if (!room) return;

    const collaborators = Array.from(room.clients.values());
    const payload = JSON.stringify({
      type: 'PRESENCE_UPDATE',
      fileId,
      collaborators
    });

    for (const [client] of room.clients.entries()) {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  /**
   * Applies an OT operation to the document and broadcasts to peers.
   */
  private handleOTOperation(ws: WebSocket, fileId: string, user: UserPresence, msg: any): void {
    const room = this.rooms.get(fileId);
    if (!room) return;

    const { clientVersion, operation } = msg;

    // Apply operation: insert or delete
    let updatedContent = room.content;

    if (operation.type === 'insert') {
      const pos = Math.max(0, Math.min(operation.position, updatedContent.length));
      updatedContent = updatedContent.slice(0, pos) + operation.text + updatedContent.slice(pos);
    } else if (operation.type === 'delete') {
      const pos = Math.max(0, Math.min(operation.position, updatedContent.length));
      const len = Math.max(0, operation.length);
      updatedContent = updatedContent.slice(0, pos) + updatedContent.slice(pos + len);
    } else if (operation.type === 'replace') {
      updatedContent = operation.content;
    }

    room.content = updatedContent;
    room.version += 1;

    const opRecord = {
      version: room.version,
      operation,
      clientId: user.userId
    };
    room.operationHistory.push(opRecord);
    if (room.operationHistory.length > 500) room.operationHistory.shift();

    // Acknowledge to sender with new server version
    ws.send(
      JSON.stringify({
        type: 'OT_ACK',
        fileId,
        serverVersion: room.version
      })
    );

    // Broadcast change to all peers in the room
    const broadcastMsg = JSON.stringify({
      type: 'OT_BROADCAST',
      fileId,
      serverVersion: room.version,
      operation,
      author: user
    });

    for (const [client] of room.clients.entries()) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(broadcastMsg);
      }
    }
  }

  /**
   * Saves document content to database and triggers change detection & downstream ML/Test pipeline.
   */
  private async handleSaveFile(
    ws: WebSocket,
    projectId: string,
    fileId: string,
    userId: string,
    content: string
  ): Promise<void> {
    const room = this.rooms.get(fileId);
    if (room) {
      room.content = content;
    }

    try {
      const pipelineResult = await ChangeDetectionService.processFileChange(
        projectId,
        fileId,
        userId,
        content
      );

      const responsePayload = JSON.stringify({
        type: 'SAVE_SUCCESS',
        fileId,
        pipeline: pipelineResult
      });

      // Notify saving client
      ws.send(responsePayload);

      // Broadcast saved status to room
      for (const [client] of (room?.clients.entries() || [])) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'FILE_SAVED_BY_PEER', fileId, authorId: userId }));
        }
      }
    } catch (err: any) {
      ws.send(JSON.stringify({ type: 'SAVE_ERROR', fileId, error: err.message }));
    }
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
