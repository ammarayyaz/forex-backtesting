import type { AccountState, ClosedTrade, Position, Timeframe } from '../types/forex';

export interface PracticeSessionState {
  version: number;
  sessionId: string;
  savedAt: number; // Unix timestamp ms
  startedAt: number; // Unix timestamp ms
  pairId: string;
  timeframe: Timeframe;
  replayIndex: number;
  totalCandles?: number;
  speedMs: number;
  account: AccountState;
  positions: Position[];
  closedTrades: ClosedTrade[];
  lastReplayTimestamp?: number; // Candle time
}

const STORAGE_KEY = 'quantfx_practice_session_v2';
const SESSIONS_HISTORY_KEY = 'quantfx_practice_history_v2';

export class PracticeSessionStorage {
  /**
   * Save the current practice progress to localStorage
   */
  static saveSession(state: Omit<PracticeSessionState, 'version'>): void {
    try {
      const payload: PracticeSessionState = {
        ...state,
        version: 2,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to persist practice session:', e);
    }
  }

  /**
   * Load the saved practice session if available
   */
  static loadSession(): PracticeSessionState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: PracticeSessionState = JSON.parse(raw);
      if (parsed && parsed.account && Array.isArray(parsed.closedTrades)) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved practice session:', e);
    }
    return null;
  }

  /**
   * Check if a saved session has meaningful progress worth resuming
   * (e.g. trades taken, or replay moved from start, or balance changed)
   */
  static hasMeaningfulProgress(session: PracticeSessionState | null): boolean {
    if (!session) return false;
    const hasTrades = session.closedTrades.length > 0 || session.positions.length > 0;
    const balanceChanged = Math.abs(session.account.balance - (session.account.initialBalance || 10000)) > 0.01;
    const movedReplay = session.replayIndex > 150;
    return hasTrades || balanceChanged || movedReplay;
  }

  /**
   * Archive the current session before starting a new one
   */
  static archiveCurrentSession(session: PracticeSessionState): void {
    try {
      const historyRaw = localStorage.getItem(SESSIONS_HISTORY_KEY);
      const history: PracticeSessionState[] = historyRaw ? JSON.parse(historyRaw) : [];
      // Keep last 10 sessions in history
      history.unshift({
        ...session,
        savedAt: Date.now(),
      });
      localStorage.setItem(SESSIONS_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
    } catch (e) {
      console.warn('Failed to archive session:', e);
    }
  }

  /**
   * Clear the active practice session
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Format human relative time (e.g. "Just now", "2 hours ago", "Yesterday at 4:15 PM", "3 days ago")
   */
  static formatRelativeTime(timestamp: number): string {
    if (!timestamp) return 'Unknown';
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) {
      const date = new Date(timestamp);
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays < 7) {
      const date = new Date(timestamp);
      return `${diffDays} days ago (${date.toLocaleDateString([], { month: 'short', day: 'numeric' })})`;
    }
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
