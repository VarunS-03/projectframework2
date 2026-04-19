/* ================================================================
   STUDENT MUSIC HUB — js/script.js
   DOM Manipulation | addEventListener | Form Validation (regex)
   Canvas Animation | Dark/Light Mode | Filter | Favourites
================================================================ */

'use strict';

/* ================================================================
   UTILITY: Run code after the DOM is fully loaded
================================================================ */
document.addEventListener('DOMContentLoaded', function () {

  initTheme();
  initHamburger();
  initFavourites();
  initMoodFilter();
  initCanvas();
  initContactForm();

});

/* ================================================================
   1. DARK / LIGHT MODE
   Saves preference to localStorage so it persists between pages.
   Dark mode uses class "dark" on <body> — CSS handles the rest.
================================================================ */
function initTheme() {
  const btn  = document.getElementById('themeToggle');
  const icon = document.getElementById('themeIcon');
  if (!btn) return;

  // Apply saved theme on every page load
  const saved = localStorage.getItem('smh-theme') || 'light';
  applyTheme(saved);

  // Click event: toggle
  btn.addEventListener('click', function () {
    const isDark = document.body.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  });

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      if (icon) icon.textContent = '☀️';
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      if (icon) icon.textContent = '🌙';
    }
    localStorage.setItem('smh-theme', theme);
  }
}

/* ================================================================
   2. HAMBURGER — Mobile nav toggle
   Adds/removes class "open" on the nav links list.
   CSS handles showing/hiding via display:flex.
================================================================ */
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', function () {
    navLinks.classList.toggle('open');
  });

  // Close nav when a link is clicked (mobile UX)
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
    });
  });
}

/* ================================================================
   3. MOOD FILTER
   Filters music CARDS (index.html) and TABLE ROWS (playlist.html).
   Uses data-mood attributes on elements for matching.
================================================================ */
function initMoodFilter() {
  const pills = document.querySelectorAll('.pill');
  if (!pills.length) return;

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {

      // Update active pill
      pills.forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');

      const mood = pill.getAttribute('data-mood');

      // Filter cards (index.html)
      document.querySelectorAll('.music-card').forEach(function (card) {
        const match = mood === 'all' || card.getAttribute('data-mood') === mood;
        card.classList.toggle('hidden', !match);
      });

      // Filter table rows (playlist.html)
      document.querySelectorAll('#playlistBody tr').forEach(function (row) {
        const match = mood === 'all' || row.getAttribute('data-mood') === mood;
        row.style.display = match ? '' : 'none';
      });

      // Pause audio when filter changes to avoid multiple playing tracks
      document.querySelectorAll('.card-audio').forEach(function (a) { a.pause(); });
    });
  });
}

/* ================================================================
   4. FAVOURITES
   Uses localStorage to persist across pages.
   Syncs heart button state and counter on every page load.
================================================================ */
function initFavourites() {
  // Load existing favourites from localStorage
  let favs = JSON.parse(localStorage.getItem('smh-favs') || '[]');

  // Apply saved state to all fav buttons on this page
  document.querySelectorAll('.fav-btn').forEach(function (btn) {
    const id = btn.getAttribute('data-id');
    if (!id) return;

    // Restore visual state
    if (favs.includes(id)) {
      btn.classList.add('active');
      btn.textContent = '♥';
    }

    // Click event: toggle favourite
    btn.addEventListener('click', function () {
      if (favs.includes(id)) {
        // Remove
        favs = favs.filter(function (f) { return f !== id; });
        btn.classList.remove('active');
        btn.textContent = '♡';
      } else {
        // Add
        favs.push(id);
        btn.classList.add('active');
        btn.textContent = '♥';

        // CSS Transform: brief "pop" effect on click
        btn.style.transform = 'scale(1.5)';
        setTimeout(function () { btn.style.transform = ''; }, 200);
      }

      localStorage.setItem('smh-favs', JSON.stringify(favs));
      updateCounters(favs.length);
    });
  });

  // Show correct count on load
  updateCounters(favs.length);
}

function updateCounters(count) {
  // Update every counter element on the page
  ['favCount', 'favCounter'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  });
}

/* ================================================================
   5. CANVAS WAVEFORM ANIMATION
   Draws 3 layered sine waves using requestAnimationFrame.
   Detects dark mode and adjusts wave colours accordingly.
================================================================ */
function initCanvas() {
  const canvas = document.getElementById('waveCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let tick = 0;

  const waves = [
    { alpha: 0.65, amplitude: 32, frequency: 0.035, speed: 0.055 },
    { alpha: 0.40, amplitude: 20, frequency: 0.055, speed: 0.040 },
    { alpha: 0.25, amplitude: 44, frequency: 0.025, speed: 0.070 },
  ];

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.body.classList.contains('dark');

    waves.forEach(function (w, i) {
      ctx.beginPath();

      // Colour: gold for first wave, white for others
      const baseColor = i === 0 ? '255,215,0' : '255,255,255';
      ctx.strokeStyle = 'rgba(' + baseColor + ',' + w.alpha + ')';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      for (let x = 0; x <= canvas.width; x += 2) {
        const y = canvas.height / 2
                + Math.sin(x * w.frequency + tick * w.speed) * w.amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else         ctx.lineTo(x, y);
      }

      ctx.stroke();
    });

    tick++;
    requestAnimationFrame(draw);
  }

  draw();
}

/* ================================================================
   6. CONTACT FORM VALIDATION
   - Required field check
   - Email format check via regex
   - Message minimum length check
   - Dynamic error messages injected into the DOM
   - Prevents form submission (event.preventDefault) if invalid
================================================================ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Live character counter for textarea
  const msg       = document.getElementById('message');
  const charCount = document.getElementById('charCount');

  if (msg && charCount) {
    msg.addEventListener('input', function () {
      const len = msg.value.length;
      charCount.textContent = len + ' / 300';
      charCount.style.color = len > 260 ? 'red' : '';
    });
  }

  // Reset button: also clears error messages
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      clearErrors();
      if (charCount) charCount.textContent = '0 / 300';
      hideBanner();
    });
  }

  // Submit event
  form.addEventListener('submit', function (e) {
    e.preventDefault(); // Stop actual form submission
    if (validate()) {
      showSuccess();
    }
  });
}

function validate() {
  clearErrors();
  let ok = true;

  // --- Name ---
  const name = document.getElementById('name');
  if (name && name.value.trim().length < 2) {
    setError(name, 'nameErr', 'Please enter your full name (at least 2 characters).');
    ok = false;
  }

  // --- Email: regex check ---
  const email = document.getElementById('email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (email) {
    if (!email.value.trim()) {
      setError(email, 'emailErr', 'Email address is required.');
      ok = false;
    } else if (!emailRegex.test(email.value.trim())) {
      setError(email, 'emailErr', 'Enter a valid email address (e.g. name@example.com).');
      ok = false;
    }
  }

  // --- Message: minimum length ---
  const msg = document.getElementById('message');
  if (msg && msg.value.trim().length < 20) {
    setError(msg, 'msgErr', 'Message must be at least 20 characters long.');
    ok = false;
  }

  return ok;
}

function setError(input, errId, msg) {
  input.classList.add('error');
  const span = document.getElementById(errId);
  if (span) span.textContent = msg;
}

function clearErrors() {
  document.querySelectorAll('.err').forEach(function (el) { el.textContent = ''; });
  document.querySelectorAll('.error').forEach(function (el) { el.classList.remove('error'); });
}

function showSuccess() {
  const form   = document.getElementById('contactForm');
  const banner = document.getElementById('successBanner');

  if (form)   form.reset();
  if (banner) {
    banner.style.display = 'block';
    // Auto-dismiss after 5 seconds
    setTimeout(hideBanner, 5000);
  }

  const cc = document.getElementById('charCount');
  if (cc) cc.textContent = '0 / 300';
}

function hideBanner() {
  const banner = document.getElementById('successBanner');
  if (banner) banner.style.display = 'none';
}
