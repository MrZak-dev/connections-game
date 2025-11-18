import { GameStorage, GameState } from './storage.js';

interface Puzzle {
    date: string;
    groups: {
        [key: string]: {
            level: number;
            description: string;
            words: string[];
        };
    };
}

class ConnectionsGame {
    private puzzles: Puzzle[] = [];
    private currentPuzzle: Puzzle | null = null;
    private words: string[] = [];
    private selectedWords: string[] = [];
    private mistakes: number = 4;
    private solvedGroups: { [key: string]: { description: string; words: string[] } } = {};
    private solvedGroupOrder: string[] = [];
    private gameState: 'playing' | 'won' | 'lost' = 'playing';

    private gameScreen: HTMLElement = document.getElementById('game-screen')!;
    private successScreen: HTMLElement = document.getElementById('success-screen')!;
    private failureScreen: HTMLElement = document.getElementById('failure-screen')!;

    private gameGrid: HTMLElement = document.getElementById('game-grid')!;
    private mistakesCounter: HTMLElement = document.getElementById('mistakes-counter')!;
    private submitButton: HTMLButtonElement = document.getElementById('submit-button') as HTMLButtonElement;
    private shuffleButton: HTMLButtonElement = document.getElementById('shuffle-button') as HTMLButtonElement;
    private deselectAllButton: HTMLButtonElement = document.getElementById('deselect-all-button') as HTMLButtonElement;
    private solvedGroupsContainer: HTMLElement = document.getElementById('solved-groups')!;

    constructor() {
        this.loadPuzzles();
    }

    private async loadPuzzles() {
        try {
            const response = await fetch('puzzles.json');
            const data = await response.json();
            this.puzzles = data.puzzles;
            this.startNewGame();
        } catch (error) {
            console.error('Failed to load puzzles:', error);
        }
    }

    private startNewGame() {
        if (this.puzzles.length > 0) {
            this.currentPuzzle = this.puzzles[0];
            const savedState = GameStorage.loadState();

            if (savedState && savedState.lastPlayed === new Date().toISOString().slice(0, 10)) {
                this.mistakes = savedState.mistakes;
                this.solvedGroups = savedState.solvedGroups;
                this.solvedGroupOrder = savedState.solvedGroupOrder;
                this.gameState = savedState.gameState;
                 this.words = Object.values(this.currentPuzzle.groups).flatMap(group => group.words)
                    .filter(word => !Object.values(this.solvedGroups).flatMap(g => g.words).includes(word));
                this.renderSolvedGroups();
            } else {
                 this.words = Object.values(this.currentPuzzle.groups).flatMap(group => group.words);
            }

            this.updateScreen();
            if (this.gameState === 'playing') {
                this.shuffleWords(false);
                this.addEventListeners();
                this.updateMistakesCounter();
            }
        }
    }

    private updateScreen() {
        this.gameScreen.classList.add('hidden');
        this.successScreen.classList.add('hidden');
        this.failureScreen.classList.add('hidden');

        if (this.gameState === 'playing') {
            this.gameScreen.classList.remove('hidden');
        } else if (this.gameState === 'won') {
            this.successScreen.classList.remove('hidden');
            this.populateEndScreen(this.successScreen);
        } else if (this.gameState === 'lost') {
            this.failureScreen.classList.remove('hidden');
            this.populateEndScreen(this.failureScreen);
        }
    }

    private renderGrid() {
        this.gameGrid.innerHTML = '';
        const buttons: { button: HTMLButtonElement, text: SVGTextElement }[] = [];
        this.words.forEach(word => {
            const button = document.createElement('button');
            button.className = 'word-button flex h-20 w-full cursor-pointer items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 p-2 uppercase tracking-wide text-gray-900 dark:text-gray-100 font-bold transition-colors hover:bg-gray-300 dark:hover:bg-gray-600';
            button.dataset.word = word;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '0 0 100 40');

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '50%');
            text.setAttribute('y', '50%');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = word;

            svg.appendChild(text);
            button.appendChild(svg);

            buttons.push({ button, text });

            button.addEventListener('click', () => this.handleWordClick(button));
            this.gameGrid.appendChild(button);
        });

        buttons.forEach(({ button, text }) => {
            this.adjustFontSize(button, text, 90);
        });
    }

    private adjustFontSize(button: HTMLElement, text: SVGTextElement, maxWidth: number) {
        const textLength = text.getComputedTextLength();
        if (textLength > maxWidth) {
            text.setAttribute('textLength', maxWidth.toString());
            text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        }
    }

    private handleWordClick(button: HTMLButtonElement) {
        const word = button.dataset.word!;
        if (this.selectedWords.includes(word)) {
            this.selectedWords = this.selectedWords.filter(w => w !== word);
            button.classList.remove('bg-gray-900', 'dark:bg-gray-200', 'text-gray-100', 'dark:text-gray-900');
            button.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100', 'hover:bg-gray-300', 'dark:hover:bg-gray-600');
        } else {
            if (this.selectedWords.length < 4) {
                this.selectedWords.push(word);
                button.classList.add('bg-gray-900', 'dark:bg-gray-200', 'text-gray-100', 'dark:text-gray-900');
                button.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100', 'hover:bg-gray-300', 'dark:hover:bg-gray-600');
            }
        }
        this.updateSubmitButtonState();
    }

    private updateSubmitButtonState() {
        if (this.selectedWords.length === 4) {
            this.submitButton.disabled = false;
            this.submitButton.classList.remove('opacity-50', 'bg-gray-300', 'dark:bg-gray-600', 'text-gray-500', 'dark:text-gray-400');
            this.submitButton.classList.add('bg-gray-800', 'dark:bg-gray-200', 'text-gray-100', 'dark:text-gray-900');
        } else {
            this.submitButton.disabled = true;
            this.submitButton.classList.add('opacity-50', 'bg-gray-300', 'dark:bg-gray-600', 'text-gray-500', 'dark:text-gray-400');
            this.submitButton.classList.remove('bg-gray-800', 'dark:bg-gray-200', 'text-gray-100', 'dark:text-gray-900');
        }
    }

    private addEventListeners() {
        this.shuffleButton.addEventListener('click', () => this.shuffleWords());
        this.deselectAllButton.addEventListener('click', () => this.deselectAll());
        this.submitButton.addEventListener('click', () => this.submitSelection());
    }

    private shuffleWords(deselect: boolean = true) {
        if (deselect) {
            this.deselectAll();
        }
        for (let i = this.words.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.words[i], this.words[j]] = [this.words[j], this.words[i]];
        }
        this.renderGrid();
    }

    private deselectAll() {
        this.selectedWords = [];
        const buttons = this.gameGrid.querySelectorAll('button');
        buttons.forEach(button => {
            button.classList.remove('bg-gray-900', 'dark:bg-gray-200', 'text-gray-100', 'dark:text-gray-900');
            button.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100', 'hover:bg-gray-300', 'dark:hover:bg-gray-600');
        });
        this.updateSubmitButtonState();
    }

    private submitSelection() {
        if (this.selectedWords.length !== 4) return;

        const selectedButtons = this.selectedWords.map(word =>
            this.gameGrid.querySelector(`[data-word="${word}"]`) as HTMLButtonElement
        );

        selectedButtons.forEach((button, index) => {
            setTimeout(() => {
                button.classList.add('scale-up');
                button.addEventListener('animationend', () => {
                    button.classList.remove('scale-up');
                }, { once: true });
            }, index * 100);
        });

        const totalAnimationTime = selectedButtons.length * 100 + 500;

        setTimeout(() => {
            let correctGroupKey: string | null = null;
            for (const key in this.currentPuzzle!.groups) {
                const groupWords = this.currentPuzzle!.groups[key].words;
                if (this.selectedWords.every(word => groupWords.includes(word))) {
                    correctGroupKey = key;
                    break;
                }
            }

            if (correctGroupKey) {
                this.handleCorrectGuess(correctGroupKey);
            } else {
                this.handleIncorrectGuess();
            }
        }, totalAnimationTime);
    }

    private async handleCorrectGuess(groupKey: string) {
        const group = this.currentPuzzle!.groups[groupKey];
        this.solvedGroups[groupKey] = { description: group.description, words: group.words };
        this.solvedGroupOrder.push(groupKey);
        this.words = this.words.filter(word => !group.words.includes(word));
        this.selectedWords = [];

        this.renderSolvedGroups();
        this.renderGrid();

        const newSolvedGroupElement = this.solvedGroupsContainer.lastElementChild as HTMLElement;
        if (newSolvedGroupElement) {
            newSolvedGroupElement.classList.add('scale-up-down');
            newSolvedGroupElement.addEventListener('animationend', () => {
                newSolvedGroupElement.classList.remove('scale-up-down');
            }, { once: true });
        }

        this.updateSubmitButtonState();

        if (this.solvedGroupOrder.length === 4) {
            this.gameState = 'won';
            this.endGame();
        } else {
             this.saveGameState();
        }
    }

    private saveGameState() {
        const state: GameState = {
            mistakes: this.mistakes,
            solvedGroups: this.solvedGroups,
            solvedGroupOrder: this.solvedGroupOrder,
            lastPlayed: new Date().toISOString().slice(0, 10),
            gameState: this.gameState
        };
        GameStorage.saveState(state);
    }

    private handleIncorrectGuess() {
        const selectedButtons = this.selectedWords.map(word =>
            this.gameGrid.querySelector(`[data-word="${word}"]`) as HTMLButtonElement
        );

        let animationsCompleted = 0;
        selectedButtons.forEach(button => {
            button.classList.add('shake');
            button.addEventListener('animationend', () => {
                button.classList.remove('shake');
                animationsCompleted++;
                if (animationsCompleted === selectedButtons.length) {
                    const dots = this.mistakesCounter.children;
                    const mistakeDot = dots[this.mistakes - 1] as HTMLElement;
                    if (mistakeDot) {
                        mistakeDot.classList.add('fade-out');
                        mistakeDot.addEventListener('animationend', () => {
                            mistakeDot.classList.remove('fade-out');
                             this.mistakes--;
                             this.updateMistakesCounter();
                             this.deselectAll();
                             if (this.mistakes === 0) {
                                 this.gameState = 'lost';
                                 this.endGame();
                             } else {
                                this.saveGameState();
                             }
                        }, { once: true });
                    }
                }
            }, { once: true });
        });
    }

    private updateMistakesCounter() {
        const dots = this.mistakesCounter.children;
        for (let i = 0; i < 4; i++) {
            if (i < this.mistakes) {
                dots[i].classList.add('bg-gray-800', 'dark:bg-gray-200');
                dots[i].classList.remove('bg-gray-400', 'dark:bg-gray-600');
            } else {
                dots[i].classList.remove('bg-gray-800', 'dark:bg-gray-200');
                dots[i].classList.add('bg-gray-400', 'dark:bg-gray-600');
            }
        }
    }

    private renderSolvedGroups() {
        this.solvedGroupsContainer.innerHTML = '';
        const groupColors: { [key: string]: string } = {
            'yellow': 'bg-connections-yellow',
            'green': 'bg-connections-green',
            'blue': 'bg-connections-blue',
            'purple': 'bg-connections-purple',
        };

        this.solvedGroupOrder.forEach(key => {
            const group = this.solvedGroups[key];
            const groupElement = document.createElement('div');
            groupElement.className = `flex flex-col items-center justify-center rounded-lg p-4 text-center ${groupColors[key]} text-black`;
            groupElement.innerHTML = `
                <p class="text-base font-bold leading-tight tracking-[-0.015em] uppercase">${group.description}</p>
                <p class="text-lg font-semibold leading-normal uppercase">${group.words.join(', ')}</p>
            `;
            this.solvedGroupsContainer.appendChild(groupElement);
        });
    }

    private endGame() {
        this.saveGameState();
        this.updateScreen();
    }

    private populateEndScreen(screen: HTMLElement) {
        if (this.gameState === 'won') {
            const solvedGroupsContainer = screen.querySelector('#success-solved-groups');
            if (solvedGroupsContainer) {
                solvedGroupsContainer.innerHTML = this.getSolvedGroupsHTML();
            }
            const mistakesCount = screen.querySelector('#success-mistakes');
            if (mistakesCount) {
                mistakesCount.textContent = (4 - this.mistakes).toString();
            }
        } else if (this.gameState === 'lost') {
            const solvedGroupsContainer = screen.querySelector('#failure-solved-groups');
            if (solvedGroupsContainer) {
                solvedGroupsContainer.innerHTML = this.getSolvedGroupsHTML();
            }
        }
    }

    private getSolvedGroupsHTML(): string {
        const groupColors: { [key: string]: string } = {
            'yellow': 'bg-connections-yellow',
            'green': 'bg-connections-green',
            'blue': 'bg-connections-blue',
            'purple': 'bg-connections-purple',
        };
        // Ensure solvedGroupOrder is sorted by level
        const sortedGroupOrder = [...this.solvedGroupOrder].sort((a, b) => {
            const levelA = this.currentPuzzle!.groups[a].level;
            const levelB = this.currentPuzzle!.groups[b].level;
            return levelA - levelB;
        });

        return sortedGroupOrder.map(key => {
            const group = this.solvedGroups[key];
            return `
                <div class="flex flex-col items-center justify-center rounded-lg p-4 text-center ${groupColors[key]} text-black">
                    <p class="text-base font-bold leading-tight tracking-[-0.015em] uppercase">${group.description}</p>
                    <p class="text-lg font-semibold leading-normal uppercase">${group.words.join(', ')}</p>
                </div>
            `;
        }).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new ConnectionsGame();
    (window as any).resetProgress = () => {
        GameStorage.resetState();
        location.reload();
    };
});

declare global {
    interface Window {
        tailwind: any;
    }
}

window.tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#135bec",
                "background-light": "#f6f6f8",
                "background-dark": "#101622",
                "text-light": "#121212",
                "text-dark": "#f0f0f0",
                "card-dark": "#1a2230",
                "connections-yellow": "#F9DF69",
                "connections-green": "#A0C35A",
                "connections-blue": "#B5E1EA",
                "connections-purple": "#D8B4E2",
            },
            fontFamily: {
                "display": ["Work Sans", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
        },
    },
};

export {};
