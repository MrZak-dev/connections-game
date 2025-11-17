export class GameStorage {
    static STATE_KEY = 'connectionsGameState';
    static STATS_KEY = 'connectionsGameStats';
    static saveState(state) {
        localStorage.setItem(this.STATE_KEY, JSON.stringify(state));
    }
    static loadState() {
        const stateJSON = localStorage.getItem(this.STATE_KEY);
        if (!stateJSON) {
            return null;
        }
        const state = JSON.parse(stateJSON);
        const today = new Date().toISOString().slice(0, 10);
        if (state.lastPlayed !== today) {
            this.resetState();
            return null;
        }
        return state;
    }
    static resetState() {
        localStorage.removeItem(this.STATE_KEY);
    }
    static saveStats(stats) {
        localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    }
    static loadStats() {
        const statsJSON = localStorage.getItem(this.STATS_KEY);
        if (statsJSON) {
            return JSON.parse(statsJSON);
        }
        return { gamesPlayed: 0, mistakesPerGame: [] };
    }
}
