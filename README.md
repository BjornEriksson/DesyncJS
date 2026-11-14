# DesyncJS

A lightweight, dependency-free JavaScript CAPTCHA library based on **temporal desynchronization**. 

Instead of distorting static images until humans can barely read them, **DesyncJS** renders characters one at a time at desynchronized frequencies (Hz) with subtle motion, tilt, and random blank frames. The human eye effortlessly combines the rapid flashes into a readable code, while single screenshots capture only one character—or nothing at all.

## Live Preview

> **How it works:** Each frame renders **at most one character** (or a completely blank frame). Taking a screenshot will never reveal the full code.

## Features

* **Zero Image Files:** Rendered entirely in memory using HTML5 `<canvas>`. No server-side image cleanup required.
* **Temporal Desync & Anti-Starvation:** Characters blink at individual frequencies while a fair-scheduling algorithm ensures no letter stays hidden too long.
* **Blank Frame Injection:** Configurable probability of rendering completely empty frames to confuse automated screen capture and mask code length.
* **Subtle Motion & Rotation:** Each character drifts and tilts slightly to prevent simple frame-stacking attacks.
* **Multi-Font Randomization:** Easily toggle per-character font randomization (`randomMultiFont`) to eliminate uniform patterns.
* **Customizable:** Full control over colors, fonts, speed, and canvas dimensions.

## Quick Start

1. Clone or download the repository:
   ```bash
   git clone https://github.com
   ```
2. Open `index.html` directly in any modern browser to test the demo.

## Configuration

Customize **DesyncJS** easily in `desync.js`:

```javascript
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

  frameHold: 16,          // Frame switch interval in ms (~60 fps)
  maxStarveTime: 65,      // Max ms a character can remain hidden
  emptyFrameChance: 0.25  // 25% chance of rendering a blank frame
});
```

## Redirecting or Submitting a Form on Success

To redirect the user to a new page after passing the CAPTCHA, update the verification handler in `desync.js`:

```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (captcha.verify(input.value)) {
    window.location.href = '/welcome.html'; // Redirect to your target page
  } else {
    status.textContent = 'Incorrect code, please try again.';
    captcha.generate();
    input.value = '';
  }
});
```

## Security Note

This repository provides the client-side rendering engine and a standalone frontend demo. For production environments, **always validate the CAPTCHA answer on your backend server** rather than storing the expected code in client-side JavaScript.

## License

MIT License — feel free to use, modify, and distribute.
