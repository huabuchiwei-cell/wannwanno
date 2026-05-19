const app = {
  currentWordIndex: 0,
  score: 0,
  words: [...wordsData], // from data.js
  draggedElement: null,
  offsetX: 0,
  offsetY: 0,

  init() {
    this.cacheDOM();
    this.bindEvents();
  },

  cacheDOM() {
    this.screens = {
      welcome: document.getElementById('welcome-screen'),
      quiz: document.getElementById('quiz-screen')
    };
    this.scoreDisplay = document.getElementById('score-display');
    this.wordDisplay = document.getElementById('word-display');
    this.meaningDisplay = document.getElementById('meaning-display');
    this.meaningText = document.getElementById('meaning-text');
    this.showMeaningBtn = document.getElementById('show-meaning-btn');
    
    // Canvas DOM
    this.canvasModal = document.getElementById('canvas-modal');
    this.canvasArea = document.getElementById('canvas-area');
    this.canvasWordTitle = document.getElementById('canvas-word-title');
  },

  bindEvents() {
    document.getElementById('start-btn').addEventListener('click', () => this.startQuiz());
    this.showMeaningBtn.addEventListener('click', () => this.showMeaning());
    document.getElementById('open-canvas-btn').addEventListener('click', () => this.openCanvas());
    document.getElementById('close-canvas-btn').addEventListener('click', () => this.closeCanvas());
    document.getElementById('add-text-btn').addEventListener('click', () => this.addCanvasItem('text'));
    document.getElementById('add-image-btn').addEventListener('click', () => this.addCanvasItem('image'));
    
    // Global mouse events for dragging
    document.addEventListener('mousemove', this.onDrag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
  },

  startQuiz() {
    this.words.sort(() => Math.random() - 0.5); // Shuffle
    this.currentWordIndex = 0;
    this.score = 0;
    this.updateScore();
    this.switchScreen('quiz');
    this.loadWord();
  },

  switchScreen(screenName) {
    Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
    this.screens[screenName].classList.add('active');
  },

  loadWord() {
    if (this.currentWordIndex >= this.words.length) {
      alert(`学習完了！スコア: ${this.score}`);
      this.switchScreen('welcome');
      return;
    }
    const currentWord = this.words[this.currentWordIndex];
    this.wordDisplay.textContent = currentWord.word;
    this.meaningText.textContent = currentWord.meaning;
    
    this.meaningDisplay.classList.add('hidden');
    this.showMeaningBtn.classList.remove('hidden');
  },

  showMeaning() {
    this.meaningDisplay.classList.remove('hidden');
    this.showMeaningBtn.classList.add('hidden');
  },

  judge(isCorrect) {
    if (isCorrect) {
      this.score += 10;
      this.updateScore();
    }
    this.currentWordIndex++;
    this.loadWord();
  },

  updateScore() {
    this.scoreDisplay.textContent = this.score;
  },

  // --- Canvas Logic ---
  openCanvas() {
    const word = this.words[this.currentWordIndex].word;
    this.canvasWordTitle.textContent = `${word} のキャンバス`;
    this.canvasModal.classList.remove('hidden');
    this.loadCanvasData(word);
  },

  closeCanvas() {
    const word = this.words[this.currentWordIndex].word;
    this.saveCanvasData(word);
    this.canvasModal.classList.add('hidden');
  },

  addCanvasItem(type, data = null) {
    const item = document.createElement('div');
    item.className = 'canvas-item';
    item.style.left = data ? data.left : '50px';
    item.style.top = data ? data.top : '50px';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'item-delete';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = (e) => {
      e.stopPropagation(); // prevent dragging
      item.remove();
    };
    item.appendChild(deleteBtn);

    if (type === 'text') {
      const textarea = document.createElement('textarea');
      textarea.placeholder = 'メモを入力...';
      textarea.value = data ? data.content : '';
      // prevent drag when interacting with text
      textarea.addEventListener('mousedown', (e) => e.stopPropagation()); 
      item.appendChild(textarea);
    } else if (type === 'image') {
      let url = data ? data.content : prompt('画像のURLを入力してください:');
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        item.appendChild(img);
      } else {
        return; // Cancelled
      }
    }

    item.dataset.type = type;
    item.addEventListener('mousedown', this.startDrag.bind(this));
    this.canvasArea.appendChild(item);
  },

  startDrag(e) {
    if (e.target.tagName.toLowerCase() === 'textarea' || e.target.className === 'item-delete') {
      return;
    }
    this.draggedElement = e.currentTarget;
    const rect = this.draggedElement.getBoundingClientRect();
    const canvasRect = this.canvasArea.getBoundingClientRect();
    
    this.offsetX = e.clientX - rect.left + canvasRect.left;
    this.offsetY = e.clientY - rect.top + canvasRect.top;
    this.draggedElement.style.zIndex = 100; // bring to front
  },

  onDrag(e) {
    if (!this.draggedElement) return;
    const canvasRect = this.canvasArea.getBoundingClientRect();
    let left = e.clientX - this.offsetX;
    let top = e.clientY - this.offsetY;
    
    // Bounds check
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    
    this.draggedElement.style.left = `${left}px`;
    this.draggedElement.style.top = `${top}px`;
  },

  stopDrag() {
    if (this.draggedElement) {
      this.draggedElement.style.zIndex = '';
      this.draggedElement = null;
    }
  },

  saveCanvasData(word) {
    const items = [];
    const elements = this.canvasArea.querySelectorAll('.canvas-item');
    elements.forEach(el => {
      const type = el.dataset.type;
      let content = '';
      if (type === 'text') {
        content = el.querySelector('textarea').value;
      } else if (type === 'image') {
        content = el.querySelector('img').src;
      }
      items.push({
        type,
        left: el.style.left,
        top: el.style.top,
        content
      });
    });
    localStorage.setItem(`canvas_${word}`, JSON.stringify(items));
  },

  loadCanvasData(word) {
    this.canvasArea.innerHTML = ''; // Clear current
    const saved = localStorage.getItem(`canvas_${word}`);
    if (saved) {
      try {
        const items = JSON.parse(saved);
        items.forEach(item => {
          this.addCanvasItem(item.type, item);
        });
      } catch (e) {
        console.error('Failed to parse canvas data');
      }
    }
  }
};

window.onload = () => app.init();
