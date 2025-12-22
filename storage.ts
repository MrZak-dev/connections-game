export interface GameState {
    puzzleNumber: number | null;
    mistakes: number;
    solvedGroups: { [key: string]: { description: string; words: string[] } };
    solvedGroupOrder: string[];
    lastPlayed: string;
    gameState: 'playing' | 'won' | 'lost';
}

interface GameStats {
    gamesPlayed: number;
    mistakesPerGame: number[];
}

export class GameStorage {
    private static readonly STATE_KEY = 'connectionsGameState';
    private static readonly STATS_KEY = 'connectionsGameStats';

    public static saveState(state: GameState): void {
        localStorage.setItem(this.STATE_KEY, JSON.stringify(state));
    }

    public static loadState(): GameState | null {
        const stateJSON = localStorage.getItem(this.STATE_KEY);
        if (!stateJSON) {
            return null;
        }

        const state: GameState = JSON.parse(stateJSON);
        const today = new Date().toISOString().slice(0, 10);
        if (state.lastPlayed !== today) {
            this.resetState();
            return null;
        }

        return state;
    }

    public static resetState(): void {
        localStorage.removeItem(this.STATE_KEY);
    }

    public static saveStats(stats: GameStats): void {
        localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    }

    public static loadStats(): GameStats {
        const statsJSON = localStorage.getItem(this.STATS_KEY);
        if (statsJSON) {
            return JSON.parse(statsJSON);
        }
        return { gamesPlayed: 0, mistakesPerGame: [] };
    }
}
