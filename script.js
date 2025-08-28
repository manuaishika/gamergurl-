class WordleGame {
    constructor() {
        this.words = [
            'apple', 'beach', 'chair', 'dance', 'eagle', 'flame', 'grape', 'house',
            'image', 'juice', 'knife', 'lemon', 'music', 'night', 'ocean', 'peace',
            'queen', 'river', 'smile', 'table', 'unity', 'voice', 'water', 'youth',
            'zebra', 'brave', 'cloud', 'dream', 'earth', 'faith', 'grace', 'heart',
            'ideal', 'jolly', 'kind', 'light', 'magic', 'noble', 'oasis', 'pride',
            'quick', 'royal', 'smart', 'trust', 'vivid', 'warm', 'xenon', 'yearn'
        ];
        
        this.currentWord = '';
        this.currentRow = 0;
        this.currentCol = 0;
        this.gameOver = false;
        this.maxGuesses = 6;
        this.wordLength = 5;
        
        this.init();
    }
    
    init() {
        this.currentWord = this.getRandomWord();
        this.createGameBoard();
        this.createKeyboard();
        this.setupEventListeners();
        this.updateStats();
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
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace']
        ];
        
        keyboard.innerHTML = '';
        
        rows.forEach(row => {
            const keyboardRow = document.createElement('div');
            keyboardRow.className = 'keyboard-row';
            
            row.forEach(key => {
                const keyElement = document.createElement('button');
                keyElement.className = 'key';
                keyElement.textContent = key;
                
                if (key === 'Enter' || key === 'Backspace') {
                    keyElement.classList.add('wide');
                }
                
                keyElement.addEventListener('click', () => this.handleKeyPress(key));
                keyboardRow.appendChild(keyElement);
            });
            
            keyboard.appendChild(keyboardRow);
        });
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            const key = e.key.toLowerCase();
            if (key === 'enter') {
                this.submitGuess();
            } else if (key === 'backspace') {
                this.deleteLetter();
            } else if (/^[a-z]$/.test(key)) {
                this.addLetter(key);
            }
        });
        
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.resetGame();
        });
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
            this.showMessage('word too short', 'error');
            return;
        }
        
        const guess = this.getCurrentGuess();
        if (!this.isValidWord(guess)) {
            this.showMessage('not in word list', 'error');
            return;
        }
        
        this.evaluateGuess(guess);
        this.currentRow++;
        this.currentCol = 0;
        this.updateStats();
        
        if (guess === this.currentWord) {
            this.endGame(true);
        } else if (this.currentRow >= this.maxGuesses) {
            this.endGame(false);
        }
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
        return this.words.includes(word);
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
            if (key.textContent.toLowerCase() === letter) {
                if (status === 'correct' || 
                    (status === 'present' && !key.classList.contains('correct')) ||
                    (status === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present'))) {
                    key.className = `key ${status}`;
                }
            }
        });
    }
    
    getTile(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }
    
    updateStats() {
        document.getElementById('current-guess').textContent = this.currentRow + 1;
    }
    
    showMessage(text, type) {
        const message = document.getElementById('message');
        message.textContent = text;
        message.className = `message ${type}`;
        
        setTimeout(() => {
            message.textContent = '';
            message.className = 'message';
        }, 2000);
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
    
    resetGame() {
        this.currentWord = this.getRandomWord();
        this.currentRow = 0;
        this.currentCol = 0;
        this.gameOver = false;
        
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('message').textContent = '';
        
        this.createGameBoard();
        this.createKeyboard();
        this.setupEventListeners();
        this.updateStats();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WordleGame();
});
