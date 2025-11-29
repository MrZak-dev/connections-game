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
    private puzzleNumber = 1;
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

    private leftSideMenu: HTMLElement = document.getElementById('left-side-menu')!;
    private howToPlayModal: HTMLElement = document.getElementById('how-to-play-modal')!;
    private menuOverlay: HTMLElement | null = null;
    private menuButton: HTMLButtonElement = document.getElementById('menu-button') as HTMLButtonElement;
    private helpButton: HTMLButtonElement = document.getElementById('help-button') as HTMLButtonElement;
    private closeHowToPlayModalButton: HTMLButtonElement = document.getElementById('close-how-to-play-modal') as HTMLButtonElement;
    private playButton: HTMLButtonElement = document.getElementById('play-button') as HTMLButtonElement;

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
            this.puzzleNumber = 1;

            const savedState = GameStorage.loadState();

            if (savedState && savedState.lastPlayed === new Date().toISOString().slice(0, 10)) {
                this.mistakes = savedState.mistakes;
                this.solvedGroups = savedState.solvedGroups;
                this.solvedGroupOrder = savedState.solvedGroupOrder;
                this.gameState = savedState.gameState;
                this.puzzleNumber = savedState.puzzleNumber;
                 this.words = Object.values(this.currentPuzzle.groups).flatMap(group => group.words)
                    .filter(word => !Object.values(this.solvedGroups).flatMap(g => g.words).includes(word));
                this.renderSolvedGroups();
            } else {
                 this.words = Object.values(this.currentPuzzle.groups).flatMap(group => group.words);
            }

            this.addEventListeners();
            this.updateScreen();
            if (this.gameState === 'playing') {
                this.shuffleWords(false);
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
            this.populateEndScreen(this.successScreen);
            this.successScreen.classList.remove('hidden');
        } else if (this.gameState === 'lost') {
            this.populateEndScreen(this.failureScreen);
            this.failureScreen.classList.remove('hidden');
        }
    }

    private renderGrid() {
        this.gameGrid.innerHTML = '';
        const buttons: { button: HTMLButtonElement, text: SVGTextElement }[] = [];
        this.words.forEach(word => {
            const button = document.createElement('button');
            button.className = 'word-button flex h-20 w-full cursor-pointer items-center justify-center rounded-lg bg-gray-200 p-2 uppercase tracking-wide text-gray-900 font-bold transition-colors hover:bg-gray-300';
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
            button.classList.remove('bg-gray-900', 'text-gray-100');
            button.classList.add('bg-gray-200', 'text-gray-900', 'hover:bg-gray-300');
        } else {
            if (this.selectedWords.length < 4) {
                this.selectedWords.push(word);
                button.classList.add('bg-gray-900', 'text-gray-100');
                button.classList.remove('bg-gray-200', 'text-gray-900', 'hover:bg-gray-300');
            }
        }
        this.updateSubmitButtonState();
    }

    private updateSubmitButtonState() {
        if (this.selectedWords.length === 4) {
            this.submitButton.disabled = false;
            this.submitButton.classList.remove('opacity-50', 'bg-gray-300', 'text-gray-500');
            this.submitButton.classList.add('bg-gray-800', 'text-gray-100');
        } else {
            this.submitButton.disabled = true;
            this.submitButton.classList.add('opacity-50', 'bg-gray-300', 'text-gray-500');
            this.submitButton.classList.remove('bg-gray-800', 'text-gray-100');
        }
    }

    private addEventListeners() {
        this.shuffleButton.addEventListener('click', () => this.shuffleWords());
        this.deselectAllButton.addEventListener('click', () => this.deselectAll());
        this.submitButton.addEventListener('click', () => this.submitSelection());
        this.menuButton.addEventListener('click', () => this.toggleMenu());
        this.helpButton.addEventListener('click', () => this.toggleHowToPlayModal());
        this.closeHowToPlayModalButton.addEventListener('click', () => this.toggleHowToPlayModal());
        this.playButton.addEventListener('click', () => this.toggleHowToPlayModal());

        document.getElementById('share-results-button')?.addEventListener('click', () => this.shareResults());
        document.getElementById('show-solution-button')?.addEventListener('click', () => this.showSolution());
        document.getElementById('view-stats-button-success')?.addEventListener('click', () => this.viewStats());
        document.getElementById('view-stats-button-failure')?.addEventListener('click', () => this.viewStats());
    }

    private toggleMenu() {
        const isMenuOpen = !this.leftSideMenu.classList.contains('hidden');
        if (isMenuOpen) {
            this.leftSideMenu.classList.add('hidden');
            if (this.menuOverlay) {
                this.menuOverlay.remove();
                this.menuOverlay = null;
            }
        } else {
            this.leftSideMenu.classList.remove('hidden');
            this.menuOverlay = document.createElement('div');
            this.menuOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-40';
            this.menuOverlay.addEventListener('click', () => this.toggleMenu());
            document.body.appendChild(this.menuOverlay);
        }
    }

    private toggleHowToPlayModal() {
        this.howToPlayModal.classList.toggle('hidden');
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
            button.classList.remove('bg-gray-900', 'text-gray-100');
            button.classList.add('bg-gray-200', 'text-gray-900', 'hover:bg-gray-300');
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
        const selectedButtons = this.selectedWords.map(word =>
            this.gameGrid.querySelector(`[data-word="${word}"]`) as HTMLButtonElement
        );
        const allButtons = Array.from(this.gameGrid.querySelectorAll('.word-button')) as HTMLButtonElement[];
        const firstRowButtons = allButtons.slice(0, 4);

        const buttonToTargetMap = new Map<HTMLButtonElement, HTMLButtonElement>();

        const selectedNotInFirstRow = selectedButtons.filter(btn => !firstRowButtons.includes(btn));
        const firstRowNotSelected = firstRowButtons.filter(btn => !selectedButtons.includes(btn));

        selectedNotInFirstRow.forEach((button, i) => {
            const target = firstRowNotSelected[i];
            if (target) {
                buttonToTargetMap.set(button, target);
            }
        });

        const swapPromises = Array.from(buttonToTargetMap.entries()).flatMap(([button, target]) => {
            return this.animateSwap(button, target);
        });

        if (swapPromises.length > 0) {
            await Promise.all(swapPromises);
        }

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
            puzzleNumber: this.puzzleNumber,
            mistakes: this.mistakes,
            solvedGroups: this.solvedGroups,
            solvedGroupOrder: this.solvedGroupOrder,
            lastPlayed: new Date().toISOString().slice(0, 10),
            gameState: this.gameState
        };
        GameStorage.saveState(state);
    }

    private animateSwap(button1: HTMLElement, button2: HTMLElement): [Promise<void>, Promise<void>] {
        const rect1 = button1.getBoundingClientRect();
        const rect2 = button2.getBoundingClientRect();

        const translateX1 = rect2.left - rect1.left;
        const translateY1 = rect2.top - rect1.top;
        const translateX2 = rect1.left - rect2.left;
        const translateY2 = rect1.top - rect2.top;

        const promise1 = new Promise<void>(resolve => {
            button1.style.transition = 'transform 0.5s';
            button1.style.transform = `translate(${translateX1}px, ${translateY1}px)`;
            button1.addEventListener('transitionend', () => {
                button1.style.transition = '';
                button1.style.transform = '';
                resolve();
            }, { once: true });
        });

        const promise2 = new Promise<void>(resolve => {
            button2.style.transition = 'transform 0.5s';
            button2.style.transform = `translate(${translateX2}px, ${translateY2}px)`;
            button2.addEventListener('transitionend', () => {
                button2.style.transition = '';
                button2.style.transform = '';
                resolve();
            }, { once: true });
        });

        return [promise1, promise2];
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
                dots[i].classList.add('bg-gray-800');
                dots[i].classList.remove('bg-gray-400');
            } else {
                dots[i].classList.remove('bg-gray-800');
                dots[i].classList.add('bg-gray-400');
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
        const puzzleNumberSpan = screen.querySelector('[id$="-puzzle-number"]');
        if (puzzleNumberSpan) {
            puzzleNumberSpan.textContent = this.puzzleNumber.toString();
        }

        this.updateCountdown();

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
                // Initially, only show the groups the user solved.
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

    private getAllGroupsHTML(): string {
        const groupColors: { [key: string]: string } = {
            'yellow': 'bg-connections-yellow',
            'green': 'bg-connections-green',
            'blue': 'bg-connections-blue',
            'purple': 'bg-connections-purple',
        };

        const allGroupKeys = Object.keys(this.currentPuzzle!.groups);
        const sortedGroupKeys = allGroupKeys.sort((a, b) => {
            const levelA = this.currentPuzzle!.groups[a].level;
            const levelB = this.currentPuzzle!.groups[b].level;
            return levelA - levelB;
        });

        return sortedGroupKeys.map(key => {
            const group = this.currentPuzzle!.groups[key];
            const groupKey = Object.keys(groupColors)[group.level - 1];
            return `
                <div class="flex flex-col items-center justify-center rounded-lg p-4 text-center ${groupColors[groupKey]} text-black">
                    <p class="text-base font-bold leading-tight tracking-[-0.015em] uppercase">${group.description}</p>
                    <p class="text-lg font-semibold leading-normal uppercase">${group.words.join(', ')}</p>
                </div>
            `;
        }).join('');
    }

    private updateCountdown() {
        const successTimer = document.getElementById('success-countdown-timer');
        const failureTimer = document.getElementById('failure-countdown-timer');

        const update = () => {
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const diff = tomorrow.getTime() - now.getTime();

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            if (successTimer) successTimer.textContent = formattedTime;
            if (failureTimer) failureTimer.textContent = formattedTime;
        };

        update();
        setInterval(update, 1000);
    }

    private shareResults() {
        if (!this.currentPuzzle) return;

        const colorEmoji: { [key: string]: string } = {
            'yellow': '🟨',
            'green': '🟩',
            'blue': '🟦',
            'purple': '🟪',
        };

        // Sort the solved groups by their level for a consistent share text
        const sortedGroupOrder = [...this.solvedGroupOrder].sort((a, b) => {
            const levelA = this.currentPuzzle!.groups[a].level;
            const levelB = this.currentPuzzle!.groups[b].level;
            return levelA - levelB;
        });

        const grid = sortedGroupOrder.map(key => {
            const emoji = colorEmoji[key];
            return Array(4).fill(emoji).join('');
        }).join('\n');

        const shareText = `Connections\nPuzzle #${this.puzzleNumber}\n${grid}`;

        navigator.clipboard.writeText(shareText).then(() => {
            console.log('Clipboard write successful');
            const shareButton = document.getElementById('share-results-button') as HTMLButtonElement;
            if (shareButton) {
                const originalText = shareButton.textContent;
                shareButton.textContent = 'Copied!';
                shareButton.disabled = true;
                setTimeout(() => {
                    shareButton.textContent = originalText;
                    shareButton.disabled = false;
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy results:', err);
            console.log('Clipboard write failed:', err);
            alert('Could not copy results to clipboard.');
        });
    }

    private showSolution() {
        const solvedGroupsContainer = this.failureScreen.querySelector('#failure-solved-groups');
        if (solvedGroupsContainer) {
            solvedGroupsContainer.innerHTML = this.getAllGroupsHTML();
        }
        // Optionally, hide the "Show Solution" button after it's clicked
        const showSolutionButton = document.getElementById('show-solution-button');
        if (showSolutionButton) {
            showSolutionButton.style.display = 'none';
        }
    }

    private viewStats() {
        // Placeholder for view stats functionality
        alert('Viewing stats!');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new ConnectionsGame();
    (window as any).resetProgress = () => {
        GameStorage.resetState();
        location.reload();
    };
});

export {};
