class ConnectionsGame {
    puzzles = [];
    currentPuzzle = null;
    words = [];
    selectedWords = [];
    mistakes = 4;
    solvedGroups = {};
    gameGrid = document.getElementById('game-grid');
    mistakesCounter = document.getElementById('mistakes-counter');
    submitButton = document.getElementById('submit-button');
    shuffleButton = document.getElementById('shuffle-button');
    deselectAllButton = document.getElementById('deselect-all-button');
    solvedGroupsContainer = document.getElementById('solved-groups');
    constructor() {
        this.loadPuzzles();
    }
    async loadPuzzles() {
        try {
            const response = await fetch('puzzles.json');
            const data = await response.json();
            this.puzzles = data.puzzles;
            this.startNewGame();
        }
        catch (error) {
            console.error('Failed to load puzzles:', error);
        }
    }
    startNewGame() {
        if (this.puzzles.length > 0) {
            this.currentPuzzle = this.puzzles[0];
            this.words = Object.values(this.currentPuzzle.groups).flatMap(group => group.words);
            this.shuffleWords();
            this.renderGrid();
            this.addEventListeners();
        }
    }
    renderGrid() {
        this.gameGrid.innerHTML = '';
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
            text.setAttribute('textLength', '90');
            text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
            text.textContent = word;
            svg.appendChild(text);
            button.appendChild(svg);
            button.addEventListener('click', () => this.handleWordClick(button));
            this.gameGrid.appendChild(button);
        });
    }
    handleWordClick(button) {
        const word = button.dataset.word;
        if (this.selectedWords.includes(word)) {
            this.selectedWords = this.selectedWords.filter(w => w !== word);
            button.classList.remove('bg-gray-900', 'dark:bg-gray-200', 'text-gray-100', 'dark:text-gray-900');
            button.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100');
        }
        else {
            if (this.selectedWords.length < 4) {
                this.selectedWords.push(word);
                button.classList.add('bg-gray-900', 'dark:bg-gray-200', 'text-gray-100', 'dark:text-gray-900');
                button.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100');
            }
        }
        this.updateSubmitButtonState();
    }
    updateSubmitButtonState() {
        if (this.selectedWords.length === 4) {
            this.submitButton.disabled = false;
            this.submitButton.classList.remove('opacity-50', 'bg-gray-300', 'dark:bg-gray-600', 'text-gray-500', 'dark:text-gray-400');
            this.submitButton.classList.add('bg-gray-800', 'dark:bg-gray-200', 'text-gray-100', 'dark:text-gray-900');
        }
        else {
            this.submitButton.disabled = true;
            this.submitButton.classList.add('opacity-50', 'bg-gray-300', 'dark:bg-gray-600', 'text-gray-500', 'dark:text-gray-400');
            this.submitButton.classList.remove('bg-gray-800', 'dark:bg-gray-200', 'text-gray-100', 'dark:text-gray-900');
        }
    }
    addEventListeners() {
        this.shuffleButton.addEventListener('click', () => this.shuffleWords());
        this.deselectAllButton.addEventListener('click', () => this.deselectAll());
        this.submitButton.addEventListener('click', () => this.submitSelection());
    }
    shuffleWords() {
        for (let i = this.words.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.words[i], this.words[j]] = [this.words[j], this.words[i]];
        }
        this.renderGrid();
    }
    deselectAll() {
        this.selectedWords = [];
        const buttons = this.gameGrid.querySelectorAll('button');
        buttons.forEach(button => {
            button.classList.remove('bg-gray-900', 'dark:bg-gray-200', 'text-gray-100', 'dark:text-gray-900');
            button.classList.add('bg-gray-200', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100');
        });
        this.updateSubmitButtonState();
    }
    submitSelection() {
        if (this.selectedWords.length !== 4)
            return;
        let correctGroupKey = null;
        for (const key in this.currentPuzzle.groups) {
            const groupWords = this.currentPuzzle.groups[key].words;
            if (this.selectedWords.every(word => groupWords.includes(word))) {
                correctGroupKey = key;
                break;
            }
        }
        if (correctGroupKey) {
            this.handleCorrectGuess(correctGroupKey);
        }
        else {
            this.handleIncorrectGuess();
        }
    }
    handleCorrectGuess(groupKey) {
        const group = this.currentPuzzle.groups[groupKey];
        this.solvedGroups[groupKey] = { description: group.description, words: group.words };
        this.words = this.words.filter(word => !group.words.includes(word));
        this.selectedWords = [];
        this.renderGrid();
        this.renderSolvedGroups();
        this.updateSubmitButtonState();
        if (Object.keys(this.solvedGroups).length === 4) {
            this.endGame(true);
        }
    }
    handleIncorrectGuess() {
        this.mistakes--;
        this.updateMistakesCounter();
        this.deselectAll();
        if (this.mistakes === 0) {
            this.endGame(false);
        }
    }
    updateMistakesCounter() {
        const dots = this.mistakesCounter.children;
        for (let i = 0; i < 4; i++) {
            if (i < this.mistakes) {
                dots[i].classList.add('bg-gray-800', 'dark:bg-gray-200');
                dots[i].classList.remove('bg-gray-400', 'dark:bg-gray-600');
            }
            else {
                dots[i].classList.remove('bg-gray-800', 'dark:bg-gray-200');
                dots[i].classList.add('bg-gray-400', 'dark:bg-gray-600');
            }
        }
    }
    renderSolvedGroups() {
        this.solvedGroupsContainer.innerHTML = '';
        const groupColors = {
            'yellow': 'bg-connections-yellow',
            'green': 'bg-connections-green',
            'blue': 'bg-connections-blue',
            'purple': 'bg-connections-purple',
        };
        const sortedGroups = Object.keys(this.solvedGroups).sort((a, b) => this.currentPuzzle.groups[a].level - this.currentPuzzle.groups[b].level);
        sortedGroups.forEach(key => {
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
    endGame(isWin) {
        if (isWin) {
            this.showSolvedScreen();
        }
        else {
            alert('You have run out of mistakes. Game over.');
        }
        // Disable all buttons
        const buttons = this.gameGrid.querySelectorAll('button');
        buttons.forEach(button => button.disabled = true);
        this.submitButton.disabled = true;
        this.shuffleButton.disabled = true;
        this.deselectAllButton.disabled = true;
    }
    showSolvedScreen() {
        const root = document.getElementById('root');
        root.innerHTML = `
            <main class="flex-grow px-4 py-6 flex flex-col items-center">
                <!-- Headline Text -->
                <h1 class="text-3xl font-bold leading-tight tracking-[-0.015em] text-center pb-2">Nicely Done!</h1>
                <p class="text-center text-gray-600 dark:text-gray-400 mb-6">You found all four connections.</p>
                <!-- Solved Puzzle Grid -->
                <div class="w-full max-w-md flex flex-col gap-3">
                    ${this.getSolvedGroupsHTML()}
                </div>
                <!-- Performance Metrics -->
                <div class="mt-8 text-center">
                    <p class="text-lg text-gray-700 dark:text-gray-300">Mistakes: <span class="font-bold text-text-light dark:text-text-dark">${4 - this.mistakes}</span></p>
                </div>
                <!-- Action Buttons -->
                <div class="w-full max-w-md mt-8 flex flex-col gap-4">
                    <button class="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-6 py-3 text-base font-bold leading-normal text-white">
                        <span class="material-symbols-outlined">share</span>
                        <span>Share Your Results</span>
                    </button>
                    <button class="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-gray-300 dark:border-gray-700 bg-transparent px-6 py-3 text-base font-bold leading-normal text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-card-dark">
                        <span>View All Puzzles</span>
                    </button>
                </div>
                <div class="h-8"></div> <!-- Spacer -->
            </main>
        `;
    }
    getSolvedGroupsHTML() {
        const groupColors = {
            'yellow': 'bg-connections-yellow',
            'green': 'bg-connections-green',
            'blue': 'bg-connections-blue',
            'purple': 'bg-connections-purple',
        };
        const sortedGroups = Object.keys(this.solvedGroups).sort((a, b) => this.currentPuzzle.groups[a].level - this.currentPuzzle.groups[b].level);
        return sortedGroups.map(key => {
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
    new ConnectionsGame();
});
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
