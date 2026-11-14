/**
 * DesyncJS - Temporal Desynchronization CAPTCHA
 * Copyright (c) 2026 BjornEriksson
 * Released under the MIT License
 */
class DesyncCaptcha {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    this.config = {
      bgColor: options.bgColor || '#0f172a',
      textColor: options.textColor || '#38bdf8',
      font: options.font || 'bold 34px "Courier New", monospace',
      randomMultiFont: options.randomMultiFont || 0, // 0 = off, 1 = on
      fonts: options.fonts || [
        'bold 34px "Courier New", monospace',
        'bold 36px Arial, sans-serif',
        'italic bold 36px Georgia, serif',
        'bold 34px Verdana, sans-serif',
        'bold 36px "Trebuchet MS", sans-serif'
      ],
      length: options.length || 5,
      frameHold: options.frameHold || 16,             // Switch interval in ms (~60 fps)
      maxStarveTime: options.maxStarveTime || 65,     // Max ms a character can remain hidden
      emptyFrameChance: options.emptyFrameChance ?? 0.25 // Probability of rendering a blank frame (0.0 to 1.0)
    };

    // Uppercase letters and numbers excluding ambiguous ones (0, O, I, 1)
    this.chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    this.code = '';
    this.charObjects = [];
    this.animationId = null;
    this.lastSwitch = 0;
    this.currentActiveIndex = 0;

    this.generate();
  }

  generate() {
    this.code = '';
    this.charObjects = [];
    const spacing = this.canvas.width / (this.config.length + 1);
    const now = performance.now();

    for (let i = 0; i < this.config.length; i++) {
      const char = this.chars.charAt(Math.floor(Math.random() * this.chars.length));
      this.code += char;

      // Pick either a random font from the list or use the default font
      const assignedFont = (this.config.randomMultiFont === 1 && this.config.fonts.length > 0)
        ? this.config.fonts[Math.floor(Math.random() * this.config.fonts.length)]
        : this.config.font;

      this.charObjects.push({
        char: char,
        font: assignedFont,
        baseX: spacing * (i + 1),
        baseY: this.canvas.height / 2,
        // Unique blink frequency per character (14 Hz to 26 Hz)
        blinkFreq: 14 + Math.random() * 12,
        blinkPhase: Math.random() * Math.PI * 2,
        // Tracks when the character was last rendered (anti-starvation)
        lastShown: now - (i * 15),
        // Subtle movement and tilt frequencies
        moveFreqX: 0.003 + Math.random() * 0.003,
        moveFreqY: 0.004 + Math.random() * 0.004,
        rotFreq: 0.003 + Math.random() * 0.003,
        phase: Math.random() * Math.PI * 2,
        maxAngle: 0.16
      });
    }

    if (!this.animationId) {
      this.animate(now);
    }
  }

  animate(timestamp) {
    // Clear canvas background
    this.ctx.fillStyle = this.config.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const seconds = timestamp / 1000;

    if (timestamp - this.lastSwitch > this.config.frameHold) {
      // Randomly decide if this frame should be completely blank
      if (Math.random() < this.config.emptyFrameChance) {
        this.currentActiveIndex = -1; // -1 indicates an empty frame
        this.lastSwitch = timestamp;
      } else {
        let bestIndex = 0;
        let highestPriority = -1;

        this.charObjects.forEach((item, index) => {
          // 1. Calculate the character's natural frequency wave (0 to 1)
          const wave = (Math.sin(seconds * item.blinkFreq * Math.PI * 2 + item.blinkPhase) + 1) / 2;
          
          // 2. Calculate how long this character has waited for its turn
          const starveTime = timestamp - item.lastShown;
          
          // 3. Anti-starvation boost ensures no character disappears for too long
          const starveBonus = starveTime >= this.config.maxStarveTime 
            ? 10 + (starveTime / 10) 
            : (starveTime / this.config.maxStarveTime) * 0.8;

          let priority = wave + starveBonus;

          // Slight penalty for the currently visible character to encourage smooth alternation
          if (index === this.currentActiveIndex) {
            priority -= 0.5;
          }

          if (priority > highestPriority) {
            highestPriority = priority;
            bestIndex = index;
          }
        });

        this.currentActiveIndex = bestIndex;
        this.charObjects[bestIndex].lastShown = timestamp;
        this.lastSwitch = timestamp;
      }
    }

    // Render ONLY if we are not on an empty frame (-1)
    const item = this.currentActiveIndex >= 0 ? this.charObjects[this.currentActiveIndex] : null;

    if (item) {
      this.ctx.save();

      const offsetX = Math.sin(timestamp * item.moveFreqX + item.phase) * 3.5;
      const offsetY = Math.cos(timestamp * item.moveFreqY + item.phase) * 5;
      const angle = Math.sin(timestamp * item.rotFreq + item.phase) * item.maxAngle;

      this.ctx.translate(item.baseX + offsetX, item.baseY + offsetY);
      this.ctx.rotate(angle);

      // Subtle opacity pulse synced with the character's frequency
      const wave = (Math.sin(seconds * item.blinkFreq * Math.PI * 2 + item.blinkPhase) + 1) / 2;
      this.ctx.globalAlpha = 0.75 + (wave * 0.25);

      this.ctx.font = item.font;
      this.ctx.fillStyle = this.config.textColor;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(item.char, 0, 0);

      this.ctx.restore();
    }

    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }

  verify(userInput) {
    return userInput.trim().toUpperCase() === this.code;
  }
}

// ==========================================
// USER CONFIGURATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const captcha = new DesyncCaptcha('desync-canvas', {
    bgColor: '#0f172a',
    textColor: '#38bdf8',
    
    // Default font (used when randomMultiFont = 0)
    font: 'bold 34px "Courier New", monospace',
    
    // Randomize different fonts per character: 0 = off, 1 = on
    randomMultiFont: 1,
    
    // Font pool used when randomMultiFont = 1
    fonts: [
      'bold 34px "Courier New", monospace',
      'bold 36px Arial, sans-serif',
      'italic bold 36px Georgia, serif',
      'bold 34px Verdana, sans-serif',
      'bold 36px "Trebuchet MS", sans-serif'
    ],

    frameHold: 16,
    maxStarveTime: 65,
    
    // Chance of rendering a completely blank frame (0.25 = 25% empty screenshots)
    emptyFrameChance: 0.25
  });

  const form = document.getElementById('captcha-form');
  const input = document.getElementById('captcha-input');
  const refreshBtn = document.getElementById('refresh-btn');
  const status = document.getElementById('status-message');

  refreshBtn.addEventListener('click', () => {
    captcha.generate();
    input.value = '';
    status.textContent = '';
    input.focus();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (captcha.verify(input.value)) {
      status.textContent = 'Verified! You are human.';
      status.className = 'status success';
    } else {
      status.textContent = 'Incorrect code, please try again.';
      status.className = 'status error';
      captcha.generate();
      input.value = '';
    }
  });
});
