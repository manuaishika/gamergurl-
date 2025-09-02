class WordleGame {
    constructor() {
        this.level = 'easy';
        this.wordPools = {
            easy: [
                'apple','beach','chair','dance','eagle','flame','grape','house',
                'image','juice','knife','lemon','music','night','ocean','peace',
                'queen','river','smile','table','unity','voice','water','youth',
                'zebra','brave','cloud','dream','earth','faith','grace','heart',
                'cream','eerie'
            ],
            medium: [
                'abide','blush','cider','dwarf','fewer','gloom','hinge','irony',
                'karma','linen','motto','ninja','orbit','piety','quart','rhyme',
                'sleek','truce','ulcer','vigor','waltz','xylem','yacht','zesty'
            ],
            hard: [
                'adieu','banal','cacao','caper','cynic','ennui','fugue','glyph',
                'ivory','jazzy','khaki','lymph','nymph','phlox','quaff','quipu',
                'rhino','squad','syrup','thrum','wryly','yummy','zonal','azure'
            ]
        };
        this.settingsByLevel = {
            easy: { maxGuesses: 6 },
            medium: { maxGuesses: 5 },
            hard: { maxGuesses: 4 }
        };
        this.dictionary = new Set([
            ...this.wordPools.easy,
            ...this.wordPools.medium,
            ...this.wordPools.hard,
            'steam','bread','tiger','horse','stone','plane','candy','light',
            'sugar','metal','pilot','crown','sound','rough','sweat','trace',
            'eerie'
        ]);
        this.currentWord = '';
        this.currentRow = 0;
        this.currentCol = 0;
        this.gameOver = false;
        this.maxGuesses = 6;
        this.wordLength = 5;
        this.init();
    }

    init() {
        this.bindLevelSelector();
        this.applyLevel(this.level);
        this.createGameBoard();
        this.createKeyboard();
        this.setupEventListeners();
        this.updateStats();
        this.highlightCurrentRow();
    }

    bindLevelSelector() {
        const select = document.getElementById('level');
        if (!select) return;
        select.value = this.level;
        select.addEventListener('change', () => {
            this.level = select.value;
            this.applyLevel(this.level);
            this.resetGridAndKeyboard();
            this.updateStats();
            this.highlightCurrentRow();
            this.showMessage(`level: ${this.level}`, 'success');
        });
    }

    applyLevel(level) {
        this.maxGuesses = this.settingsByLevel[level].maxGuesses;
        const pool = this.wordPools[level];
        this.words = pool;
        this.currentWord = this.getRandomWord();
        const maxSpan = document.getElementById('max-guesses');
        if (maxSpan) maxSpan.textContent = String(this.maxGuesses);
        this.currentRow = 0;
        this.currentCol = 0;
        this.gameOver = false;
    }

    getRandomWord() {
        return this.words[Math.floor(Math.random() * this.words.length)];
    }

    createGameBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        for (let row = 0; row < this.maxGuesses; row++) {
            for (let col = 0; col < this.wordLength; col++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = row;
                tile.dataset.col = col;
                gameBoard.appendChild(tile);
            }
        }
    }

    createKeyboard() {
        const keyboard = document.getElementById('keyboard');
        const rows = [
            ['q','w','e','r','t','y','u','i','o','p'],
            ['a','s','d','f','g','h','j','k','l'],
            ['Enter','z','x','c','v','b','n','m','Backspace']
        ];
        keyboard.innerHTML = '';
        rows.forEach(row => {
            const keyboardRow = document.createElement('div');
            keyboardRow.className = 'keyboard-row';
            row.forEach(key => {
                const keyElement = document.createElement('button');
                keyElement.className = 'key';
                keyElement.dataset.key = key;
                keyElement.textContent = key === 'Backspace' ? '⌫' : (key === 'Enter' ? 'enter' : key);
                if (key === 'Enter' || key === 'Backspace') keyElement.classList.add('wide');
                keyElement.addEventListener('click', (e) => this.handleKeyPress(e.currentTarget.dataset.key));
                keyboardRow.appendChild(keyElement);
            });
            keyboard.appendChild(keyboardRow);
        });
    }

    setupEventListeners() {
        if (!this._boundKeydown) {
            this._boundKeydown = (e) => {
                if (this.gameOver) return;
                const key = e.key.toLowerCase();
                if (key === 'enter') this.submitGuess();
                else if (key === 'backspace') this.deleteLetter();
                else if (/^[a-z]$/.test(key)) this.addLetter(key);
            };
            document.addEventListener('keydown', this._boundKeydown);
        }
        const newBtn = document.getElementById('new-game-btn');
        if (newBtn && !this._boundNew) {
            this._boundNew = () => this.resetGame();
            newBtn.addEventListener('click', this._boundNew);
        }
    }

    handleKeyPress(key) {
        if (this.gameOver) return;
        if (key === 'Enter') this.submitGuess();
        else if (key === 'Backspace') this.deleteLetter();
        else if (/^[a-z]$/.test(key)) this.addLetter(key);
    }

    addLetter(letter) {
        if (this.currentCol >= this.wordLength) return;
        const tile = this.getTile(this.currentRow, this.currentCol);
        tile.textContent = letter.toUpperCase();
        tile.classList.add('filled');
        this.currentCol++;
    }

    deleteLetter() {
        if (this.currentCol <= 0) return;
        this.currentCol--;
        const tile = this.getTile(this.currentRow, this.currentCol);
        tile.textContent = '';
        tile.classList.remove('filled');
    }

    submitGuess() {
        if (this.currentCol !== this.wordLength) {
            this.shakeRow();
            this.showMessage('word too short', 'error');
            return;
        }
        const guess = this.getCurrentGuess();
        if (!this.isValidWord(guess)) {
            this.shakeRow();
            this.showMessage('not in word list', 'error');
            return;
        }
        this.evaluateGuess(guess);
        if (guess === this.currentWord) {
            this.endGame(true);
            return;
        }
        this.currentRow++;
        this.currentCol = 0;
        this.updateStats();
        this.highlightCurrentRow();
        if (this.currentRow >= this.maxGuesses) this.endGame(false);
    }

    getCurrentGuess() {
        let guess = '';
        for (let col = 0; col < this.wordLength; col++) {
            const tile = this.getTile(this.currentRow, col);
            guess += tile.textContent.toLowerCase();
        }
        return guess;
    }

    isValidWord(word) {
        return this.dictionary.has(word);
    }

    evaluateGuess(guess) {
        const letterCounts = {};
        for (let i = 0; i < this.wordLength; i++) {
            const letter = this.currentWord[i];
            letterCounts[letter] = (letterCounts[letter] || 0) + 1;
        }
        for (let i = 0; i < this.wordLength; i++) {
            const tile = this.getTile(this.currentRow, i);
            const letter = guess[i];
            if (letter === this.currentWord[i]) {
                tile.classList.add('correct');
                letterCounts[letter]--;
                this.updateKeyboardKey(letter, 'correct');
            } else if (this.currentWord.includes(letter) && letterCounts[letter] > 0) {
                tile.classList.add('present');
                letterCounts[letter]--;
                this.updateKeyboardKey(letter, 'present');
            } else {
                tile.classList.add('absent');
                this.updateKeyboardKey(letter, 'absent');
            }
        }
    }

    updateKeyboardKey(letter, status) {
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            if (key.textContent.toLowerCase() === letter || key.dataset.key?.toLowerCase() === letter) {
                if (status === 'correct' ||
                    (status === 'present' && !key.classList.contains('correct')) ||
                    (status === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present'))) {
                    key.className = `key ${status}${key.classList.contains('wide') ? ' wide' : ''}`;
                }
            }
        });
    }

    getTile(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    highlightCurrentRow() {
        const all = document.querySelectorAll('.tile');
        all.forEach(t => t.classList.remove('active'));
        for (let col = 0; col < this.wordLength; col++) {
            const tile = this.getTile(this.currentRow, col);
            if (tile && !tile.classList.contains('correct') && !tile.classList.contains('present') && !tile.classList.contains('absent')) {
                tile.classList.add('active');
            }
        }
    }

    shakeRow() {
        for (let col = 0; col < this.wordLength; col++) {
            const tile = this.getTile(this.currentRow, col);
            if (!tile) continue;
            tile.classList.remove('shake');
            void tile.offsetWidth;
            tile.classList.add('shake');
        }
        setTimeout(() => {
            for (let col = 0; col < this.wordLength; col++) {
                const tile = this.getTile(this.currentRow, col);
                if (tile) tile.classList.remove('shake');
            }
        }, 450);
    }

    updateStats() {
        const current = document.getElementById('current-guess');
        const max = document.getElementById('max-guesses');
        if (current) current.textContent = String(this.currentRow + 1);
        if (max) max.textContent = String(this.maxGuesses);
    }

    showMessage(text, type) {
        const message = document.getElementById('message');
        message.textContent = text;
        message.className = `message ${type}`;
        setTimeout(() => {
            message.textContent = '';
            message.className = 'message';
        }, 1600);
    }

    endGame(won) {
        this.gameOver = true;
        const gameOver = document.getElementById('game-over');
        const gameResult = document.getElementById('game-result');
        const correctWord = document.getElementById('correct-word');
        if (won) {
            gameResult.textContent = 'you won!';
            gameResult.style.color = '#10b981';
        } else {
            gameResult.textContent = 'game over';
            gameResult.style.color = '#ef4444';
        }
        correctWord.textContent = `the word was: ${this.currentWord.toUpperCase()}`;
        gameOver.style.display = 'block';
    }

    resetGridAndKeyboard() {
        this.createGameBoard();
        this.createKeyboard();
    }

    resetGame() {
        this.applyLevel(this.level);
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('message').textContent = '';
        this.resetGridAndKeyboard();
        this.updateStats();
        this.highlightCurrentRow();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WordleGame();
});
