import logger from '@/utils/logger';

interface SessionData {
  userId: number;
  lastCommand?: string;
  searchQuery?: string;
  currentPage?: number;
}

class SessionManager {
  private sessions: Map<number, SessionData> = new Map();

  get(userId: number): SessionData | undefined {
    return this.sessions.get(userId);
  }

  set(userId: number, data: Partial<SessionData>): void {
    const existing = this.sessions.get(userId) || { userId };
    this.sessions.set(userId, { ...existing, ...data });
    logger.debug(`Session updated for user ${userId}`);
  }

  delete(userId: number): void {
    this.sessions.delete(userId);
    logger.debug(`Session deleted for user ${userId}`);
  }

  clear(): void {
    this.sessions.clear();
  }
}

export const sessionManager = new SessionManager();
export type { SessionData };
