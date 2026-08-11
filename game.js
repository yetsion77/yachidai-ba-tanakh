// Yachidai BaTanakh - Game Logic

// State variables
let gameState = 'main-menu'; // main-menu, game, gameover
let currentMode = 'classic'; // classic, time-attack, practice
let currentWordIndex = -1;
let shuffledWords = [];
let score = 0;
let streak = 0;
let maxStreak = 0;
let lives = 3;
let timeLeft = 0; // seconds
let totalSeconds = 0;
let timerInterval = null;
let canAnswer = true;
let correctCount = 0;
let wrongCount = 0;

// High scores
let highScores = {
  classic: 0,
  'time-attack': 0,
  practice: 0
};

// Sound Settings
let soundEnabled = true;

// Web Audio API Synthesis for Sound Effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (!soundEnabled) return;
  
  // Resume context if suspended (browser security)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  
  switch(type) {
    case 'click':
      {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      }
      break;
      
    case 'correct':
      {
        // Joyful major arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.12, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.2);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.25);
        });
      }
      break;
      
    case 'incorrect':
      {
        // Dissonant buzz descending
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.35);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.4);
      }
      break;
      
    case 'gameover':
      {
        // Melancholic chord progression
        const notes = [440, 349.23, 293.66, 329.63]; // A4, F4, D4, E4
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0.1, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.4);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.5);
        });
      }
      break;
      
    case 'highscore':
      {
        // Triumphant fanfare
        const fanfare = [392, 523.25, 659.25, 783.99, 1046.50, 1318.51]; // G4, C5, E5, G5, C6, E6
        fanfare.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.15, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
      }
      break;
  }
}

// Particle Effect System on Correct Answering
function createParticles(element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  const colors = ['#e5b23b', '#f59e0b', '#10b981', '#ffffff', '#34d399'];
  const particleCount = 20;
  
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.classList.add('floating-points');
    p.innerText = '★';
    p.style.color = colors[Math.floor(Math.random() * colors.length)];
    p.style.fontSize = `${Math.random() * 0.6 + 0.6}rem`;
    p.style.position = 'fixed';
    p.style.left = `${centerX}px`;
    p.style.top = `${centerY}px`;
    p.style.zIndex = '99';
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 80 + 30;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance - 20;
    
    p.style.setProperty('--tx', `${destX}px`);
    p.style.setProperty('--ty', `${destY}px`);
    
    // Custom inline animation
    p.style.transition = 'all 0.7s cubic-bezier(0.1, 0.8, 0.3, 1)';
    document.body.appendChild(p);
    
    // Force reflow
    p.getBoundingClientRect();
    
    p.style.transform = `translate(${destX}px, ${destY}px) scale(0)`;
    p.style.opacity = '0';
    
    setTimeout(() => {
      p.remove();
    }, 700);
  }
}

// Floating point score popup
function spawnScorePopup(element, text) {
  const rect = element.getBoundingClientRect();
  const popup = document.createElement('div');
  popup.classList.add('floating-points');
  popup.innerText = text;
  popup.style.left = `${rect.left + rect.width/2 - 15}px`;
  popup.style.top = `${rect.top - 15}px`;
  
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 800);
}

// Shuffling helper (Fisher-Yates)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Load configurations
function initGame() {
  // Load high scores
  const savedScores = localStorage.getItem('yachidai_high_scores');
  if (savedScores) {
    try {
      highScores = { ...highScores, ...JSON.parse(savedScores) };
    } catch(e) {}
  }
  
  // Load sound setting
  const savedSound = localStorage.getItem('yachidai_sound_enabled');
  if (savedSound !== null) {
    soundEnabled = savedSound === 'true';
  }
  updateSoundIcon();
  
  // Update Highscore display in Menu
  updateHighscoreMenuDisplay();

  // Screen transition triggers
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      currentMode = btn.dataset.mode;
    });
  });

  document.getElementById('play-btn').addEventListener('click', startGame);
  document.getElementById('sound-toggle-btn').addEventListener('click', toggleSound);
  document.getElementById('home-btn').addEventListener('click', goToMainMenu);
  document.getElementById('restart-btn').addEventListener('click', resetAndRestart);
  document.getElementById('go-home-btn').addEventListener('click', goToMainMenu);
  document.getElementById('skip-btn').addEventListener('click', handleSkip);
  document.getElementById('close-feedback-btn').addEventListener('click', closeFeedbackPanel);
  document.getElementById('share-btn').addEventListener('click', shareScore);

  // Set default selected mode button
  const defaultModeBtn = document.querySelector(`.mode-btn[data-mode="${currentMode}"]`);
  if (defaultModeBtn) defaultModeBtn.classList.add('selected');

  // Go to main menu initially
  switchScreen('main-menu-screen');
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('yachidai_sound_enabled', soundEnabled);
  playSound('click');
  updateSoundIcon();
}

function updateSoundIcon() {
  const icon = document.getElementById('sound-icon');
  if (soundEnabled) {
    icon.innerText = '🔊';
  } else {
    icon.innerText = '🔇';
  }
}

function updateHighscoreMenuDisplay() {
  const scoreVal = highScores[currentMode] || 0;
  document.getElementById('highscore-val').innerText = scoreVal;
}

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  
  const activeScreen = document.getElementById(screenId);
  activeScreen.style.display = 'flex';
  
  // Force browser layout calculation for transitions
  activeScreen.getBoundingClientRect();
  
  activeScreen.classList.add('active');
  gameState = screenId.replace('-screen', '');
  
  // Hide screens that are not active after animations finish
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach(s => {
      if (!s.classList.contains('active')) {
        s.style.display = 'none';
      }
    });
  }, 400);
}

function goToMainMenu() {
  playSound('click');
  stopTimer();
  updateHighscoreMenuDisplay();
  switchScreen('main-menu-screen');
}

function resetAndRestart() {
  playSound('click');
  startGame();
}

function startGame() {
  playSound('click');
  
  // Reset states
  score = 0;
  streak = 0;
  maxStreak = 0;
  correctCount = 0;
  wrongCount = 0;
  canAnswer = true;
  
  // Prepare questions
  shuffledWords = shuffleArray(WORDS_DATA.words);
  currentWordIndex = 0;
  
  // Set mode UI elements
  const livesEl = document.getElementById('lives-display');
  const timerWrapper = document.getElementById('timer-wrapper');
  
  // Initialize mode settings
  if (currentMode === 'classic') {
    lives = 3;
    livesEl.style.display = 'flex';
    timerWrapper.style.display = 'block';
    renderHearts();
  } else if (currentMode === 'time-attack') {
    timeLeft = 60;
    livesEl.style.display = 'none';
    timerWrapper.style.display = 'block';
    updateTimerBar(100);
  } else { // practice
    livesEl.style.display = 'none';
    timerWrapper.style.display = 'none';
  }
  
  updateStatsUI();
  switchScreen('game-screen');
  
  // Start Time Attack main timer
  if (currentMode === 'time-attack') {
    startGlobalTimer();
  }
  
  loadNextWord();
}

function renderHearts() {
  const container = document.getElementById('lives-display');
  container.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart-icon';
    heart.innerText = '❤️';
    if (i >= lives) {
      heart.classList.add('lost');
    }
    container.appendChild(heart);
  }
}

function updateStatsUI() {
  document.getElementById('score-val').innerText = score;
  document.getElementById('streak-val').innerText = streak;
  
  // Update mode label
  let modeName = 'קלאסי';
  if (currentMode === 'time-attack') modeName = 'מרוץ בזמן';
  if (currentMode === 'practice') modeName = 'אימון';
  document.getElementById('mode-badge').innerText = modeName;
}

function loadNextWord() {
  if (currentWordIndex >= shuffledWords.length) {
    // Shuffled words run out, reshuffle
    shuffledWords = shuffleArray(WORDS_DATA.words);
    currentWordIndex = 0;
  }
  
  canAnswer = true;
  
  const wordObj = shuffledWords[currentWordIndex];
  
  // Display target word
  document.getElementById('target-word').innerText = wordObj.word;
  
  // Generate options (correct + 3 distractors)
  const choices = generateChoices(wordObj.book);
  
  // Render options
  const grid = document.getElementById('choices-grid');
  grid.innerHTML = '';
  
  choices.forEach(bookOption => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerText = bookOption;
    btn.addEventListener('click', () => handleChoiceSelect(btn, bookOption));
    grid.appendChild(btn);
  });
  
  // Mode specific behavior
  if (currentMode === 'classic') {
    timeLeft = 15; // 15 seconds per question
    startQuestionTimer();
  }
}

function generateChoices(correctBook) {
  // Pull 3 unique random distractors
  const books = WORDS_DATA.books.filter(b => b !== correctBook);
  const shuffledBooks = shuffleArray(books);
  const distractors = shuffledBooks.slice(0, 3);
  
  const options = [correctBook, ...distractors];
  return shuffleArray(options);
}

function startQuestionTimer() {
  stopTimer();
  updateTimerBar(100);
  
  const startTime = Date.now();
  const duration = 15000; // 15s in ms
  
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const percentage = Math.max(0, 100 - (elapsed / duration) * 100);
    updateTimerBar(percentage);
    
    if (elapsed >= duration) {
      stopTimer();
      handleTimeOut();
    }
  }, 50);
}

function startGlobalTimer() {
  stopTimer();
  const startTime = Date.now();
  const initialTime = timeLeft;
  
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timeLeft = Math.max(0, initialTime - elapsed);
    
    // Timer percentage out of 60 max (or dynamic)
    const percentage = (timeLeft / 60) * 100;
    updateTimerBar(percentage);
    
    if (timeLeft <= 0) {
      stopTimer();
      endGame();
    }
  }, 100);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerBar(percentage) {
  const bar = document.getElementById('timer-bar');
  if (bar) {
    bar.style.transform = `scaleX(${percentage / 100})`;
  }
}

function handleTimeOut() {
  if (!canAnswer) return;
  canAnswer = false;
  
  playSound('incorrect');
  streak = 0;
  lives--;
  wrongCount++;
  renderHearts();
  
  // Highlight correct answer in choice buttons
  highlightAnswers(null);
  
  // Trigger card shake
  const card = document.getElementById('word-card');
  card.classList.add('shake-card');
  setTimeout(() => card.classList.remove('shake-card'), 400);

  setTimeout(() => {
    if (lives <= 0) {
      endGame();
    } else {
      showLearningRecap(shuffledWords[currentWordIndex]);
    }
  }, 800);
}

function handleChoiceSelect(button, selectedBook) {
  if (!canAnswer) return;
  canAnswer = false;
  
  stopTimer();
  
  const wordObj = shuffledWords[currentWordIndex];
  const isCorrect = (selectedBook === wordObj.book);
  
  if (isCorrect) {
    // CORRECT ANSWER
    button.classList.add('correct');
    playSound('correct');
    createParticles(button);
    
    correctCount++;
    streak++;
    if (streak > maxStreak) {
      maxStreak = streak;
    }
    
    // Point calculations
    let pointsGained = 0;
    if (currentMode === 'classic') {
      const multiplier = Math.min(5, Math.floor((streak - 1) / 3) + 1); // multipliers: x1, x2 (streak 4+), x3 (streak 7+)... max x5
      pointsGained = 100 * multiplier;
      score += pointsGained;
      
      const popText = `+${pointsGained}${multiplier > 1 ? ' (רצף x' + multiplier + ')' : ''}`;
      spawnScorePopup(button, popText);
    } else if (currentMode === 'time-attack') {
      pointsGained = 100;
      score += pointsGained;
      timeLeft = Math.min(60, timeLeft + 3); // add 3 seconds
      spawnScorePopup(button, `+100 XP (+3 ש')`);
    } else { // practice
      pointsGained = 100;
      score += pointsGained;
      spawnScorePopup(button, `+100 XP`);
    }
    
    updateStatsUI();
    
    // Disable all options
    disableAllChoices();
    
    // Load next question automatically after brief delay
    setTimeout(() => {
      currentWordIndex++;
      loadNextWord();
    }, 1200);
    
  } else {
    // INCORRECT ANSWER
    button.classList.add('incorrect');
    highlightAnswers(button);
    playSound('incorrect');
    
    wrongCount++;
    streak = 0;
    
    if (currentMode === 'classic') {
      lives--;
      renderHearts();
    } else if (currentMode === 'time-attack') {
      timeLeft = Math.max(0, timeLeft - 5); // deduct 5 seconds
      spawnScorePopup(button, `-5 ש'`);
    }
    
    updateStatsUI();
    disableAllChoices();
    
    // Trigger card shake
    const card = document.getElementById('word-card');
    card.classList.add('shake-card');
    setTimeout(() => card.classList.remove('shake-card'), 400);
    
    // Move forward logic
    setTimeout(() => {
      if (currentMode === 'classic' && lives <= 0) {
        endGame();
      } else if (currentMode === 'time-attack') {
        // In time attack, keep going immediately to maintain pace
        currentWordIndex++;
        if (timeLeft <= 0) {
          endGame();
        } else {
          loadNextWord();
        }
      } else {
        // Classic & Practice modes show learning panel on error
        showLearningRecap(wordObj);
      }
    }, 1000);
  }
}

function disableAllChoices() {
  document.querySelectorAll('.choice-btn').forEach(b => {
    b.classList.add('disabled');
  });
}

function highlightAnswers(clickedBtn) {
  const wordObj = shuffledWords[currentWordIndex];
  document.querySelectorAll('.choice-btn').forEach(btn => {
    if (btn.innerText === wordObj.book) {
      btn.classList.add('correct');
    } else if (btn === clickedBtn) {
      // already red
    }
  });
}

function showLearningRecap(wordObj) {
  const panel = document.getElementById('feedback-panel');
  
  // Set contents
  document.getElementById('learning-word').innerText = wordObj.word;
  document.getElementById('learning-book').innerText = wordObj.book;
  
  const cleanVerse = cleanVerseText(wordObj.verse);
  document.getElementById('learning-verse-text').innerText = cleanVerse;
  
  panel.classList.add('active');
}

function cleanVerseText(verse) {
  // If the verse contains brackets like (בראשית א א) or similar, we leave it but we can clean trailing spaces
  return verse.replace(/\s+/g, ' ').trim();
}

function closeFeedbackPanel() {
  playSound('click');
  document.getElementById('feedback-panel').classList.remove('active');
  
  // Load next word
  currentWordIndex++;
  loadNextWord();
}

function handleSkip() {
  if (!canAnswer) return;
  playSound('click');
  
  stopTimer();
  
  // Skipped counts as wrong (breaks streak)
  streak = 0;
  updateStatsUI();
  
  currentWordIndex++;
  loadNextWord();
}

function endGame() {
  stopTimer();
  playSound('gameover');
  
  // Check high score
  let isNewRecord = false;
  const currentRecord = highScores[currentMode] || 0;
  if (score > currentRecord) {
    highScores[currentMode] = score;
    localStorage.setItem('yachidai_high_scores', JSON.stringify(highScores));
    isNewRecord = true;
    setTimeout(() => {
      playSound('highscore');
      startConfetti();
    }, 500);
  }
  
  // Render stats
  document.getElementById('end-score').innerText = score;
  document.getElementById('end-streak').innerText = maxStreak;
  
  // Accuracy percentage
  const total = correctCount + wrongCount;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  document.getElementById('end-accuracy').innerText = `${accuracy}%`;
  
  // Mode label
  let modeName = 'קלאסי';
  if (currentMode === 'time-attack') modeName = 'מרוץ בזמן';
  if (currentMode === 'practice') modeName = 'אימון';
  document.getElementById('end-mode').innerText = modeName;
  
  // Record badge
  const recordBadge = document.getElementById('new-record-badge');
  if (isNewRecord) {
    recordBadge.style.display = 'inline-block';
  } else {
    recordBadge.style.display = 'none';
  }
  
  switchScreen('gameover-screen');
}

// Confetti effect on Canvas
let confettiAnimationId = null;
function startConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  
  // Reset size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const colors = ['#e5b23b', '#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#ffffff'];
  
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }
  
  let frameCount = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((p, idx) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - idx/3) * 15;
      
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    });
    
    // Stop after 300 frames
    frameCount++;
    if (frameCount < 300) {
      confettiAnimationId = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
  draw();
}

function shareScore() {
  playSound('click');
  
  let modeName = 'קלאסי';
  if (currentMode === 'time-attack') modeName = 'מרוץ בזמן';
  if (currentMode === 'practice') modeName = 'אימון';
  
  const text = `השגתי ${score} נקודות במשחק "יחידאי בתנ״ך" במצב ${modeName}! נראה אתכם מנצחים אותי. המשחק זמין כאן: https://yetsion77.github.io/charming-maxwell/`;
  
  if (navigator.share) {
    navigator.share({
      title: 'יחידאי בתנ״ך',
      text: text,
      url: 'https://yetsion77.github.io/charming-maxwell/'
    }).catch(console.error);
  } else {
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      const shareBtn = document.getElementById('share-btn');
      const originalText = shareBtn.innerText;
      shareBtn.innerText = 'הועתק ללוח! 📋';
      setTimeout(() => {
        shareBtn.innerText = originalText;
      }, 2000);
    });
  }
}

// Window resize for confetti canvas compatibility
window.addEventListener('resize', () => {
  const canvas = document.getElementById('confetti-canvas');
  if (canvas && canvas.style.display !== 'none') {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', initGame);
