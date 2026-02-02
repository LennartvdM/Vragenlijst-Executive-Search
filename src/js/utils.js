/**
 * Utility functions module
 * Contains helper functions, word counters, and misc utilities
 */

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Setup word counter for contenteditable field with word limits
 */
export function setupWordCounter() {
  const editor = document.getElementById('voorbeeld-organisatie-editor');
  const hiddenInput = document.getElementById('voorbeeld-organisatie-hidden');
  const counter = document.getElementById('word-counter-voorbeeld');
  if (!editor || !hiddenInput || !counter) return;

  const softLimit = 200;
  const hardLimit = 220;

  function getWords(text) {
    const trimmed = text.trim();
    if (!trimmed) return [];
    return trimmed.split(/\s+/);
  }

  function getPlainText() {
    return editor.textContent || '';
  }

  function saveCursorPosition() {
    const sel = window.getSelection();
    if (sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(editor);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString().length;
  }

  function restoreCursorPosition(pos) {
    if (pos === null) return;
    const sel = window.getSelection();
    const range = document.createRange();

    let currentPos = 0;
    let found = false;

    function walkNodes(node) {
      if (found) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const len = node.textContent.length;
        if (currentPos + len >= pos) {
          range.setStart(node, pos - currentPos);
          range.collapse(true);
          found = true;
          return;
        }
        currentPos += len;
      } else {
        for (const child of node.childNodes) {
          walkNodes(child);
          if (found) return;
        }
      }
    }

    walkNodes(editor);
    if (found) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  function getGradientColor(index, total) {
    const t = total <= 1 ? 1 : index / (total - 1);
    const r = Math.round(230 + (200 - 230) * t);
    const g = Math.round(170 + (50 - 170) * t);
    const b = Math.round(0 + (50 - 0) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function updateDisplay() {
    const text = getPlainText();
    const words = getWords(text);
    const wordCount = words.length;

    hiddenInput.value = text;

    if (wordCount <= softLimit) {
      counter.innerHTML = `${wordCount} / ${softLimit} woorden`;
      if (editor.textContent !== text) {
        editor.textContent = text;
      }
      return;
    }

    const excessIndex = Math.min(wordCount - softLimit - 1, 19);
    const counterColor = wordCount >= hardLimit
      ? getGradientColor(19, 20)
      : getGradientColor(excessIndex, 20);

    if (wordCount >= hardLimit) {
      counter.innerHTML = `<span style="color: ${counterColor}; font-weight: 500;">${wordCount} / ${softLimit} woorden</span> — <span class="hint-error">limiet bereikt</span>`;
    } else {
      counter.innerHTML = `<span style="color: ${counterColor}; font-weight: 500;">${wordCount} / ${softLimit} woorden</span> — <span class="hint-success">dit mag nog</span>`;
    }

    const cursorPos = saveCursorPosition();

    const normalWords = words.slice(0, softLimit);
    const excessWords = words.slice(softLimit, hardLimit);

    let html = escapeHtml(normalWords.join(' '));
    if (excessWords.length > 0) {
      const styledWords = excessWords.map((word, i) => {
        const color = getGradientColor(i, 20);
        return `<span style="color: ${color}; font-weight: 600;">${escapeHtml(word)}</span>`;
      });
      html += ' ' + styledWords.join(' ');
    }

    editor.innerHTML = html;
    restoreCursorPosition(cursorPos);

    if (wordCount > hardLimit) {
      hiddenInput.value = words.slice(0, hardLimit).join(' ');
    }
  }

  editor.addEventListener('keydown', function(e) {
    const words = getWords(getPlainText());
    const atLimit = words.length >= hardLimit;
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    const isCtrlCombo = e.ctrlKey || e.metaKey;

    if (atLimit && !allowedKeys.includes(e.key) && !isCtrlCombo) {
      e.preventDefault();
    }
  });

  editor.addEventListener('paste', function(e) {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const currentText = getPlainText();
    const currentWords = getWords(currentText);
    const pastedWords = getWords(pastedText);
    const availableSlots = hardLimit - currentWords.length;

    if (availableSlots <= 0) return;

    const textToInsert = pastedWords.slice(0, availableSlots).join(' ');
    document.execCommand('insertText', false, textToInsert);
  });

  editor.addEventListener('input', updateDisplay);
  updateDisplay();
}

/**
 * Setup simple word counters for large textareas
 */
export function setupTextareaWordCounters() {
  const textareaNames = [
    'leiderschap_toelichting',
    'strategie_toelichting',
    'hr_toelichting',
    'communicatie_toelichting',
    'kennis_toelichting',
    'klimaat_toelichting',
    'motivatie',
    'opmerkingen_stap_0',
    'opmerkingen_stap_1',
    'opmerkingen_stap_2',
    'opmerkingen_stap_3',
    'opmerkingen_stap_5',
    'opmerkingen_stap_6',
    'opmerkingen_stap_7',
    'opmerkingen_stap_8',
    'opmerkingen_stap_9',
    'opmerkingen_stap_10',
    'opmerkingen_stap_11',
    'opmerkingen_stap_12',
    'opmerkingen_stap_13'
  ];

  function getWordCount(text) {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }

  function updateCounter(textarea, counter) {
    const wordCount = getWordCount(textarea.value);
    counter.textContent = wordCount === 1 ? '1 woord' : `${wordCount} woorden`;
  }

  textareaNames.forEach(function(name) {
    const textarea = document.querySelector(`textarea[name="${name}"]`);
    if (!textarea) return;

    const counter = document.createElement('span');
    counter.className = 'word-counter textarea-word-counter';

    textarea.parentNode.insertBefore(counter, textarea.nextSibling);

    textarea.addEventListener('input', function() {
      updateCounter(textarea, counter);
    });

    updateCounter(textarea, counter);
  });
}

/**
 * Initialize Flatpickr date picker with custom styling
 */
export function initDatePicker() {
  const datumInput = document.getElementById('datumPicker');
  if (!datumInput || typeof flatpickr === 'undefined') return;

  const savedValue = datumInput.value;
  let defaultDate = 'today';

  if (savedValue) {
    const datePatterns = [
      /^(\d{4})-(\d{2})-(\d{2})$/,
      /^(\d{2})-(\d{2})-(\d{4})$/
    ];

    for (const pattern of datePatterns) {
      const match = savedValue.match(pattern);
      if (match) {
        if (pattern === datePatterns[0]) {
          defaultDate = new Date(match[1], match[2] - 1, match[3]);
        } else {
          defaultDate = new Date(match[3], match[2] - 1, match[1]);
        }
        break;
      }
    }
  }

  flatpickr(datumInput, {
    locale: 'nl',
    dateFormat: 'd-m-Y',
    altInput: true,
    altFormat: 'j F Y',
    disableMobile: true,
    allowInput: false,
    defaultDate: defaultDate,
    monthSelectorType: 'dropdown',
    animate: true,
    onChange: function(selectedDates, dateStr, instance) {
      // Will be connected via event system
      document.dispatchEvent(new CustomEvent('formDataChanged'));
    },
    onReady: function(selectedDates, dateStr, instance) {
      instance.calendarContainer.classList.add('flatpickr-terracotta');
    }
  });
}
