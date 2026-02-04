/**
 * Contextual Help Module
 *
 * Injects hover-triggered help popovers at key points in the survey.
 * Follows the same interaction patterns as the privacy panel:
 * hover to open, safe zones, mouse-out to close, no click required.
 *
 * Three content blocks:
 * 1. CBS definition ("Wie telt mee?") — steps 2 and 3
 * 2. Likert scale explanation ("Wat betekenen de antwoorden?") — step 5 only
 * 3. Department differences ("Verschilt het per afdeling?") — all Likert steps (5-10)
 */

// ============================================================================
// STATE
// ============================================================================

let activePopoverId = null;
let activeTriggerEl = null;
let safezoneEl = null;
let closeTimer = null;
let scrollEl = null;

// Registry of popover elements by id
const popovers = {};

// ============================================================================
// HELP CONTENT
// ============================================================================

function getCBSContent() {
  return `
    <p class="ch-lead">We volgen de CBS-definitie. Die gaat over geboortelanden — van uzelf of uw ouders.</p>
    <div class="ch-divider"></div>
    <div class="ch-reveal">
      <span class="ch-reveal-label">De exacte definitie</span>
      <div class="ch-reveal-body">
        <div class="ch-reveal-inner">
          <p>Iemand heeft een niet-westerse migratieachtergrond als hij, zij of \u00e9\u00e9n van de ouders niet in Europa (exclusief Turkije), Noord-Amerika of Oceani\u00eb is geboren. Indonesi\u00eb en Japan worden ook tot de westerse landen gerekend.</p>
        </div>
      </div>
    </div>
    <div class="ch-reveal">
      <span class="ch-reveal-label">Praktisch: wie telt mee?</span>
      <div class="ch-reveal-body">
        <div class="ch-reveal-inner">
          <div class="ch-two-col">
            <div class="ch-col ch-col-yes">
              <strong>Telt mee</strong>
              <ul>
                <li>Marokko, Turkije, Suriname, Antillen, Aruba</li>
                <li>Afrika, Azi\u00eb (m.u.v. Japan, Indonesi\u00eb), Latijns-Amerika</li>
                <li>In Nederland geboren, ouder uit bovenstaande gebieden</li>
              </ul>
            </div>
            <div class="ch-col ch-col-no">
              <strong>Telt niet mee</strong>
              <ul>
                <li>Europa (m.u.v. Turkije), Noord-Amerika, Oceani\u00eb</li>
                <li>Japan, Indonesi\u00eb</li>
                <li>Nederland, beide ouders ook westers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="ch-reveal">
      <span class="ch-reveal-label">Wat als u het niet precies weet?</span>
      <div class="ch-reveal-body">
        <div class="ch-reveal-inner">
          <p>U hoeft niet in personeelsdossiers te graven. Gebruik de informatie die u heeft \u2014 uit zelfidentificatie, diversiteitsonderzoeken, of een onderbouwde inschatting. Het doel is een eerlijk beeld, geen waterdichte administratie.</p>
        </div>
      </div>
    </div>
    <p class="ch-footnote">Het CBS stapt over op nieuwe terminologie. Wij volgen voorlopig de oude definitie \u2014 dat houdt de monitoring vergelijkbaar met eerdere jaren.</p>`;
}

function getLikertContent() {
  return `
    <p class="ch-lead">De vier niveaus beschrijven de fase waarin uw organisatie zit. Het is geen rapportcijfer.</p>
    <div class="ch-divider"></div>
    <div class="ch-scale">
      <div class="ch-scale-item">
        <span class="ch-scale-badge ch-badge-0">Niet</span>
        <span class="ch-scale-quote">\u201cWe verkennen de mogelijkheden\u201d</span>
        <span class="ch-scale-desc">Er is een voornemen, maar concrete stappen moeten nog komen.</span>
      </div>
      <div class="ch-scale-item">
        <span class="ch-scale-badge ch-badge-1">Enigszins</span>
        <span class="ch-scale-quote">\u201cWe zijn gestart\u201d</span>
        <span class="ch-scale-desc">Er is een plan, een pilot, een eerste actie. Het is nog pril.</span>
      </div>
      <div class="ch-scale-item">
        <span class="ch-scale-badge ch-badge-2">Grotendeels</span>
        <span class="ch-scale-quote">\u201cHet werk is in volle gang\u201d</span>
        <span class="ch-scale-desc">Het loopt. Niet perfect, maar het is praktijk, geen project meer.</span>
      </div>
      <div class="ch-scale-item">
        <span class="ch-scale-badge ch-badge-3">Volledig</span>
        <span class="ch-scale-quote">\u201cWe hebben het in de vingers\u201d</span>
        <span class="ch-scale-desc">Verankerd, gemonitord, continu verbeterd. Structureel geborgd.</span>
      </div>
    </div>
    <div class="ch-divider"></div>
    <div class="ch-reveal">
      <span class="ch-reveal-label">Twijfelt u tussen twee niveaus?</span>
      <div class="ch-reveal-body">
        <div class="ch-reveal-inner">
          <p>Kies het niveau dat het eerlijkst voelt. Liever een eerlijke basis om vandaan te groeien dan uzelf te hoog inschatten \u2014 dan meet u volgend jaar achteruitgang terwijl u vooruitgaat.</p>
        </div>
      </div>
    </div>`;
}

function getDeptContent() {
  return `
    <p class="ch-lead">Verschilt het per afdeling? Tel waar het geldt.</p>
    <div class="ch-divider"></div>
    <div class="ch-scale ch-scale-compact">
      <div class="ch-scale-item">
        <span class="ch-scale-badge ch-badge-0">Niet</span>
        <span class="ch-scale-desc">Geen enkele afdeling</span>
      </div>
      <div class="ch-scale-item">
        <span class="ch-scale-badge ch-badge-1">Enigszins</span>
        <span class="ch-scale-desc">Minder dan de helft</span>
      </div>
      <div class="ch-scale-item">
        <span class="ch-scale-badge ch-badge-2">Grotendeels</span>
        <span class="ch-scale-desc">Meer dan de helft</span>
      </div>
      <div class="ch-scale-item">
        <span class="ch-scale-badge ch-badge-3">Volledig</span>
        <span class="ch-scale-desc">Alle afdelingen</span>
      </div>
    </div>
    <div class="ch-divider"></div>
    <div class="ch-reveal">
      <span class="ch-reveal-label">Een voorbeeld</span>
      <div class="ch-reveal-body">
        <div class="ch-reveal-inner">
          <p>U heeft zes divisies. Bij twee is inclusief werven standaardpraktijk. Twee van de zes is minder dan de helft: <em>enigszins gerealiseerd</em>. Volgend jaar vier van de zes? Meer dan de helft: <em>grotendeels</em>. Vooruitgang, zichtbaar in de cijfers.</p>
        </div>
      </div>
    </div>`;
}

// ============================================================================
// INFRASTRUCTURE
// ============================================================================

function createSafezone() {
  safezoneEl = document.createElement('div');
  safezoneEl.className = 'ch-safezone';
  document.body.appendChild(safezoneEl);

  safezoneEl.addEventListener('mouseenter', cancelClose);
  safezoneEl.addEventListener('mouseleave', startClose);
}

function positionSafezone(pop) {
  if (!safezoneEl) return;
  var rect = pop.getBoundingClientRect();
  var hMargin = Math.max(20, rect.width * 0.08);  // 5-10% horizontal
  var topMargin = 20;

  // Extend vertically all the way to the bottom of the viewport
  // so the mouse can drift down freely while reading expanding content
  var bottomExtent = window.innerHeight - rect.bottom;

  safezoneEl.style.left = (rect.left - hMargin) + 'px';
  safezoneEl.style.top = (rect.top - topMargin) + 'px';
  safezoneEl.style.width = (rect.width + hMargin * 2) + 'px';
  safezoneEl.style.height = (rect.height + topMargin + bottomExtent) + 'px';
  safezoneEl.classList.add('is-visible');
}

function updateSafezone() {
  if (!activePopoverId) return;
  var pop = popovers[activePopoverId];
  if (pop) positionSafezone(pop);
}

function createPopoverElement(id, html) {
  var pop = document.createElement('div');
  pop.className = 'ch-popover';
  pop.id = 'ch-pop-' + id;
  pop.innerHTML = html;
  document.body.appendChild(pop);

  pop.addEventListener('mouseenter', cancelClose);
  pop.addEventListener('mouseleave', startClose);

  // Handle reveal sections inside popovers
  // Each reveal gets a collapse delay so moving between reveals doesn't
  // cause a chain reaction of collapsing/expanding content
  var reveals = pop.querySelectorAll('.ch-reveal');
  reveals.forEach(function(reveal) {
    var collapseTimer = null;

    function cancelCollapse() {
      if (collapseTimer) {
        clearTimeout(collapseTimer);
        collapseTimer = null;
      }
    }

    reveal.addEventListener('mouseenter', function() {
      cancelCollapse();
      // Collapse sibling reveals and cancel their pending timers
      reveals.forEach(function(sib) {
        if (sib !== reveal) {
          if (sib._cancelCollapse) sib._cancelCollapse();
          sib.classList.remove('is-expanded');
        }
      });
      reveal.classList.add('is-expanded');
      setTimeout(updateSafezone, 1050);
    });

    reveal.addEventListener('mouseleave', function() {
      collapseTimer = setTimeout(function() {
        reveal.classList.remove('is-expanded');
        setTimeout(updateSafezone, 1050);
      }, 300);
    });

    // Store cancel function so siblings can reach it
    reveal._cancelCollapse = cancelCollapse;
  });

  popovers[id] = pop;
  return pop;
}

function createTrigger(id, text) {
  var trigger = document.createElement('span');
  trigger.className = 'ch-trigger';
  trigger.dataset.help = id;
  trigger.textContent = text;

  // Desktop: hover
  trigger.addEventListener('mouseenter', function() {
    showPopover(id, trigger);
  });
  trigger.addEventListener('mouseleave', function() {
    startClose();
  });

  // Mobile: tap toggle
  trigger.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (activePopoverId === id) {
      closeActivePopover();
    } else {
      showPopover(id, trigger);
    }
  });

  return trigger;
}

// ============================================================================
// SHOW / HIDE / POSITION
// ============================================================================

function showPopover(id, trigger) {
  cancelClose();

  // Close different popover if open
  if (activePopoverId && activePopoverId !== id) {
    closeActivePopover();
  }

  var pop = popovers[id];
  if (!pop) return;

  // Reset expanded sections
  pop.querySelectorAll('.ch-reveal.is-expanded').forEach(function(r) {
    r.classList.remove('is-expanded');
  });

  // Position and show
  positionPopoverNear(trigger, pop);
  pop.classList.add('is-open');
  trigger.classList.add('is-active');
  activePopoverId = id;
  activeTriggerEl = trigger;

  requestAnimationFrame(function() {
    positionSafezone(pop);
  });
}

function positionPopoverNear(trigger, pop) {
  var rect = trigger.getBoundingClientRect();

  // Temporarily show to measure
  pop.style.visibility = 'hidden';
  pop.style.display = 'block';
  pop.style.opacity = '0';
  var popHeight = pop.offsetHeight;
  var popWidth = pop.offsetWidth;
  pop.style.display = '';
  pop.style.visibility = '';
  pop.style.opacity = '';

  var left, top;
  var isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Center on screen, below trigger
    left = Math.max(16, (window.innerWidth - popWidth) / 2);
    top = rect.bottom + 12;
    if (top + popHeight > window.innerHeight - 16) {
      top = Math.max(16, rect.top - popHeight - 12);
    }
    pop.classList.add('ch-arrow-up');
  } else {
    // Prefer above trigger, centered
    left = rect.left + (rect.width / 2) - (popWidth / 2);
    top = rect.top - popHeight - 12;

    if (top < 16) {
      // Not enough room above, show below
      top = rect.bottom + 12;
      pop.classList.add('ch-arrow-up');
    } else {
      pop.classList.remove('ch-arrow-up');
    }
  }

  // Viewport bounds
  if (left + popWidth > window.innerWidth - 16) {
    left = window.innerWidth - popWidth - 16;
  }
  if (left < 16) left = 16;

  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}

function closeActivePopover() {
  cancelClose();

  if (activePopoverId) {
    var pop = popovers[activePopoverId];
    if (pop) {
      pop.classList.remove('is-open');
      pop.querySelectorAll('.ch-reveal.is-expanded').forEach(function(r) {
        r.classList.remove('is-expanded');
      });
    }

    // Remove active state from triggers
    if (activeTriggerEl) {
      activeTriggerEl.classList.remove('is-active');
      activeTriggerEl = null;
    }

    activePopoverId = null;
  }

  if (safezoneEl) {
    safezoneEl.classList.remove('is-visible');
  }
}

function startClose() {
  cancelClose();
  closeTimer = setTimeout(closeActivePopover, 120);
}

function cancelClose() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

// ============================================================================
// INJECTION
// ============================================================================

function injectStep2Help() {
  var step = document.querySelector('.step[data-step="2"]');
  if (!step) return;

  var subtitle = step.querySelector('.subtitle');
  if (!subtitle) return;

  var bar = document.createElement('div');
  bar.className = 'ch-help-bar';
  bar.appendChild(createTrigger('cbs', 'Wie telt mee als Buiten-Europa?'));
  subtitle.after(bar);
}

function injectStep3Help() {
  var step = document.querySelector('.step[data-step="3"]');
  if (!step) return;

  var subtitle = step.querySelector('.subtitle');
  if (!subtitle) return;

  var bar = document.createElement('div');
  bar.className = 'ch-help-bar';
  bar.appendChild(createTrigger('cbs', 'Wie telt mee als Buiten-Europa?'));
  subtitle.after(bar);
}

function injectStep5LikertHelp() {
  var step = document.querySelector('.step[data-step="5"]');
  if (!step) return;

  var likertHeader = step.querySelector('.likert-header');
  if (!likertHeader) return;

  var span = likertHeader.querySelector('span');
  if (!span) return;

  span.appendChild(createTrigger('likert', 'Wat betekenen de antwoorden?'));
}

function injectDeptHelp() {
  // Add "Verschilt het per afdeling?" to all Likert steps (5-10)
  for (var stepId = 5; stepId <= 10; stepId++) {
    var step = document.querySelector('.step[data-step="' + stepId + '"]');
    if (!step) continue;

    var likertHeader = step.querySelector('.likert-header');
    if (!likertHeader) continue;

    var span = likertHeader.querySelector('span');
    if (!span) continue;

    // Add separator if there's already a trigger (step 5)
    if (span.querySelector('.ch-trigger')) {
      var sep = document.createElement('span');
      sep.className = 'ch-trigger-sep';
      sep.textContent = ' \u00b7 ';
      span.appendChild(sep);
    }

    span.appendChild(createTrigger('dept', 'Verschilt het per afdeling?'));
  }
}

// ============================================================================
// INIT
// ============================================================================

export function initHelp() {
  // Guard against double init
  if (document.querySelector('.ch-trigger')) return;

  // Create shared infrastructure
  createSafezone();

  // Create popovers (shared across triggers)
  createPopoverElement('cbs', getCBSContent());
  createPopoverElement('likert', getLikertContent());
  createPopoverElement('dept', getDeptContent());

  // Inject triggers at the right DOM positions
  injectStep2Help();
  injectStep3Help();
  injectStep5LikertHelp();
  injectDeptHelp();

  // Close on scroll
  scrollEl = document.getElementById('contentScrollable');
  if (scrollEl) {
    scrollEl.addEventListener('scroll', closeActivePopover, { passive: true });
  }

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && activePopoverId) {
      closeActivePopover();
    }
  });

  // Close on outside click (useful for mobile)
  document.addEventListener('mousedown', function(e) {
    if (activePopoverId && !e.target.closest('.ch-popover') && !e.target.closest('.ch-trigger')) {
      closeActivePopover();
    }
  });
}
