/**
 * Color Lab — Derive full palette from two base colors
 *
 * Takes a "warm base" (bg) and "accent" (fg) color and algorithmically
 * derives all CSS custom properties used throughout the site.
 */

(function () {
  'use strict';

  // --- Color math utilities ---

  function hexToHSL(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s));
    l = Math.max(0, Math.min(100, l));

    const s1 = s / 100, l1 = l / 100;
    const c = (1 - Math.abs(2 * l1 - 1)) * s1;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l1 - c / 2;
    let r, g, b;

    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  function hexToRGB(hex) {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }

  function rgbString(hex) {
    const { r, g, b } = hexToRGB(hex);
    return `${r}, ${g}, ${b}`;
  }

  // Shift an HSL color
  function shift(hsl, dh, ds, dl) {
    return hslToHex(hsl.h + (dh || 0), hsl.s + (ds || 0), hsl.l + (dl || 0));
  }

  // Mix two hex colors
  function mix(hex1, hex2, weight) {
    const c1 = hexToRGB(hex1), c2 = hexToRGB(hex2);
    const w = weight || 0.5;
    const r = Math.round(c1.r * (1 - w) + c2.r * w);
    const g = Math.round(c1.g * (1 - w) + c2.g * w);
    const b = Math.round(c1.b * (1 - w) + c2.b * w);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // --- Palette derivation ---

  function derivePalette(bgHex, fgHex, bbHex) {
    const bg = hexToHSL(bgHex);
    const fg = hexToHSL(fgHex);

    // Warm base family (salmon — the mid-tone accent)
    const salmon = bgHex;
    const salmonLight = shift(bg, 0, -5, 12);
    const salmonDark = shift(bg, 0, 0, -15);

    // Card surface family (sand / cream) — ALWAYS from base
    const sandHue = bg.h + (bg.h < 30 ? 5 : -5);
    const sand = hslToHex(sandHue, Math.max(bg.s * 0.55, 15), Math.min(bg.l + 20, 92));
    const sandLight = hslToHex(sandHue, Math.max(bg.s * 0.4, 10), Math.min(bg.l + 28, 96));
    const sandDark = hslToHex(sandHue, Math.max(bg.s * 0.35, 12), Math.min(bg.l + 5, 75));
    const cream = hslToHex(bg.h, Math.max(bg.s * 0.3, 8), Math.min(bg.l + 32, 98.5));

    // Background void gradient — from bb if provided, else mirrors card family
    const src = bbHex ? hexToHSL(bbHex) : bg;
    const voidHue = src.h + (src.h < 30 ? 5 : -5);
    // 3 gradient stops: sand-like, salmon-light-like, sand-light-like
    const void1 = hslToHex(voidHue, Math.max(src.s * 0.55, 15), Math.min(src.l + 20, 92));
    const void2 = hslToHex(src.h, Math.max(src.s * 0.7, 20), Math.min(src.l + 12, 88));
    const void3 = hslToHex(voidHue, Math.max(src.s * 0.4, 10), Math.min(src.l + 28, 96));

    // Accent family (terracotta / brown)
    const terracotta = fgHex;
    const terracottaDark = shift(fg, 0, 5, -12);
    const brown = shift(fg, -3, -12, -15);

    // Text: very dark, desaturated version of accent hue
    const text = hslToHex(fg.h, Math.max(fg.s * 0.35, 10), Math.min(Math.max(fg.l - 30, 15), 25));
    const textLight = hslToHex(fg.h, Math.max(fg.s * 0.3, 8), Math.min(Math.max(fg.l - 10, 30), 45));

    // Teal: complementary accent — rotate hue ~150-180 degrees
    const tealHue = (fg.h + 165) % 360;
    const teal = hslToHex(tealHue, Math.min(fg.s * 0.8, 40), Math.min(fg.l + 15, 72));
    const tealDark = hslToHex(tealHue, Math.min(fg.s * 0.9, 45), Math.min(fg.l + 5, 62));

    // Muted: desaturated mid-tone of base
    const muted = hslToHex(bg.h, Math.max(bg.s * 0.25, 8), 63);

    return {
      // Card surface colors (always from base)
      '--salmon': salmon,
      '--salmon-light': salmonLight,
      '--salmon-dark': salmonDark,
      '--sand': sand,
      '--sand-light': sandLight,
      '--sand-dark': sandDark,
      '--cream': cream,
      '--input-fill': '#ffffff',

      // Accent colors
      '--terracotta': terracotta,
      '--terracotta-dark': terracottaDark,
      '--brown': brown,
      '--text': text,
      '--text-light': textLight,
      '--teal': teal,
      '--teal-dark': tealDark,

      // Background void (separate from card)
      '--void-1': void1,
      '--void-2': void2,
      '--void-3': void3,
      '--void-1-rgb': rgbString(void1),
      '--void-2-rgb': rgbString(void2),

      // RGB components (card family)
      '--brown-rgb': rgbString(brown),
      '--terracotta-rgb': rgbString(terracotta),
      '--salmon-rgb': rgbString(salmon),
      '--sand-rgb': rgbString(sand),
      '--cream-rgb': rgbString(cream),
      '--text-rgb': rgbString(text),
      '--muted-rgb': rgbString(muted),
    };
  }

  // --- URL param handling ---

  function getParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      bg: '#' + (p.get('bg') || 'e8a091'),
      fg: '#' + (p.get('fg') || 'c4785a'),
      bb: p.get('bb') ? '#' + p.get('bb') : null,
    };
  }

  function updateURL(bg, fg, bb) {
    const url = new URL(window.location);
    url.searchParams.set('bg', bg.replace('#', ''));
    url.searchParams.set('fg', fg.replace('#', ''));
    if (bb) {
      url.searchParams.set('bb', bb.replace('#', ''));
    } else {
      url.searchParams.delete('bb');
    }
    window.history.replaceState({}, '', url);
  }

  // --- Apply palette ---

  function applyPalette(palette) {
    const root = document.documentElement;
    for (const [prop, value] of Object.entries(palette)) {
      root.style.setProperty(prop, value);
    }

    // Update SVG fills to match terracotta
    document.querySelectorAll('.preview-logo path').forEach(path => {
      path.setAttribute('fill', palette['--terracotta']);
    });
  }

  // --- Generate CSS export ---

  function generateCSS(palette) {
    let css = ':root {\n';
    for (const [prop, value] of Object.entries(palette)) {
      css += `  ${prop}: ${value};\n`;
    }
    css += '}';
    return css;
  }

  // --- Swatch rendering ---

  function renderSwatches(palette) {
    const container = document.getElementById('swatch-grid');
    if (!container) return;

    const brandVars = Object.entries(palette).filter(([k]) => !k.includes('-rgb'));

    container.innerHTML = brandVars.map(([name, value]) => `
      <div class="swatch-item">
        <div class="swatch-color" style="background: ${value}"></div>
        <div class="swatch-label">${name.replace('--', '')}</div>
        <div class="swatch-value">${value}</div>
      </div>
    `).join('');
  }

  // --- Preset palettes ---

  const PRESETS = [
    { name: 'Original', bg: '#e8a091', fg: '#c4785a', bb: null },
    { name: 'Ocean', bg: '#91b8e8', fg: '#5a7ec4', bb: null },
    { name: 'Forest', bg: '#91c4a0', fg: '#5a8c6a', bb: null },
    { name: 'Lavender', bg: '#b8a0d4', fg: '#7a5a9e', bb: null },
    { name: 'Slate', bg: '#a0a8b8', fg: '#5a6478', bb: null },
    { name: 'Rose', bg: '#d4929a', fg: '#a8505c', bb: '#d4c0b8' },
    { name: 'Amber', bg: '#d4b878', fg: '#a08040', bb: null },
    { name: 'Plum', bg: '#c496a8', fg: '#8a4a68', bb: '#c8b8c0' },
    { name: 'Sage', bg: '#a8b8a0', fg: '#687860', bb: null },
    { name: 'Copper', bg: '#c8a088', fg: '#906848', bb: null },
  ];

  // --- Init ---

  function init() {
    const params = getParams();
    const bgPicker = document.getElementById('bg-color');
    const fgPicker = document.getElementById('fg-color');
    const bbPicker = document.getElementById('bb-color');
    const bgHex = document.getElementById('bg-hex');
    const fgHex = document.getElementById('fg-hex');
    const bbHex = document.getElementById('bb-hex');
    const bbToggle = document.getElementById('bb-toggle');
    const bbControls = document.getElementById('bb-controls');
    const bbResetBtn = document.getElementById('bb-reset');
    const cssOutput = document.getElementById('css-output');
    const copyBtn = document.getElementById('copy-css');
    const presetContainer = document.getElementById('presets');
    const urlHint = document.querySelector('.lab-url-hint');

    let bbActive = !!params.bb;

    bgPicker.value = params.bg;
    fgPicker.value = params.fg;
    bgHex.value = params.bg;
    fgHex.value = params.fg;

    if (params.bb) {
      bbPicker.value = params.bb;
      bbHex.value = params.bb;
    } else {
      // Default to a neutral warm tone as starting point when activated
      bbPicker.value = '#d4c4b0';
      bbHex.value = '#d4c4b0';
    }

    function syncBBVisibility() {
      bbControls.style.display = bbActive ? 'flex' : 'none';
      bbToggle.textContent = bbActive ? '−' : '+';
      bbToggle.title = bbActive ? 'Derive background from base' : 'Control background separately';
    }

    function getBB() {
      return bbActive ? bbPicker.value : null;
    }

    function updateHint() {
      let hint = `?bg=${bgPicker.value.slice(1)}&fg=${fgPicker.value.slice(1)}`;
      if (bbActive) hint += `&bb=${bbPicker.value.slice(1)}`;
      urlHint.textContent = hint;
    }

    function update() {
      const bg = bgPicker.value;
      const fg = fgPicker.value;
      const bb = getBB();
      bgHex.value = bg;
      fgHex.value = fg;
      if (bbActive) bbHex.value = bbPicker.value;
      updateURL(bg, fg, bb);
      updateHint();
      const palette = derivePalette(bg, fg, bb);
      applyPalette(palette);
      renderSwatches(palette);
      cssOutput.textContent = generateCSS(palette);
    }

    bgPicker.addEventListener('input', update);
    fgPicker.addEventListener('input', update);
    bbPicker.addEventListener('input', update);

    // Hex input sync
    function bindHexSync(hexInput, picker) {
      hexInput.addEventListener('change', () => {
        let v = hexInput.value.trim();
        if (!v.startsWith('#')) v = '#' + v;
        if (/^#[0-9a-fA-F]{6}$/.test(v)) { picker.value = v; update(); }
      });
    }
    bindHexSync(bgHex, bgPicker);
    bindHexSync(fgHex, fgPicker);
    bindHexSync(bbHex, bbPicker);

    // Background toggle
    bbToggle.addEventListener('click', () => {
      bbActive = !bbActive;
      syncBBVisibility();
      update();
    });

    // Background reset — collapse back to deriving from base
    bbResetBtn.addEventListener('click', () => {
      bbActive = false;
      syncBBVisibility();
      update();
    });

    syncBBVisibility();

    // Presets
    PRESETS.forEach(preset => {
      const dots = preset.bb
        ? `<span class="preset-dot" style="background:${preset.bg}"></span>
           <span class="preset-dot" style="background:${preset.fg}"></span>
           <span class="preset-dot" style="background:${preset.bb}"></span>`
        : `<span class="preset-dot" style="background:${preset.bg}"></span>
           <span class="preset-dot" style="background:${preset.fg}"></span>`;

      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.innerHTML = `
        <span class="preset-dots">${dots}</span>
        <span class="preset-name">${preset.name}</span>
      `;
      btn.addEventListener('click', () => {
        bgPicker.value = preset.bg;
        fgPicker.value = preset.fg;
        if (preset.bb) {
          bbActive = true;
          bbPicker.value = preset.bb;
          bbHex.value = preset.bb;
        } else {
          bbActive = false;
        }
        syncBBVisibility();
        update();
      });
      presetContainer.appendChild(btn);
    });

    // Copy CSS
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(cssOutput.textContent).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy CSS'; }, 2000);
      });
    });

    // Initial render
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
